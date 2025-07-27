import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '../../../lib/googleAuth'
import { supabase } from '../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, vehicleId, startDate, endDate, option_child_seat, option_insurance } = body;

    console.log('🔵 Confirm API Called:', { userId, vehicleId, startDate, endDate });

    // ✅ カレンダーID取得
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    };
    const calendarId = calendarMap[vehicleId];

    // ✅ 車両情報取得
    const { data: car, error: carError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('car_no', vehicleId)
      .single();

    if (carError || !car) {
      return NextResponse.json({ message: '車両情報が見つかりません' }, { status: 400 });
    }

    // ✅ 泊数計算 & プラン判定
    const sameDay = startDate === endDate;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (sameDay) {
      days = 0; // 泊数は0泊扱い（プランは当日）
    } else if (days <= 0) {
      days = 1; // 安全策（終了日が開始日より前のケース回避）
    }

    // ✅ 料金計算
    let plan_price: number;
    let planLabel: string;

    if (sameDay) {
      plan_price = car.price_same_day; // ✅ 同日価格
      planLabel = '当日';
    } else {
      plan_price = car.price_1n; // ✅ 通常1泊以上の価格
      planLabel = `${days}泊`;
    }

    const option_price_child_seat = option_child_seat ? car.option_price_1 * (sameDay ? 1 : days) : 0;
    const option_price_insurance = option_insurance ? car.option_price_2 * (sameDay ? 1 : days) : 0;
    const total_price = plan_price + option_price_child_seat + option_price_insurance;

    // ✅ Googleサービスアカウントのアクセストークン取得
    const accessToken = await getAccessToken();

    // ✅ Supabase reservations に INSERT（Google登録より先）
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert([
        {
          user_id: userId,
          vehicle_id: vehicleId,
          car_name: car.name,
          rank: car.rank,
          number_plate: car.number_plate,
          start_date: startDate,
          end_date: endDate,
          plan_id: planLabel, // ✅ 同日なら「当日」
          plan_price: Number(plan_price),
          option_child_seat,
          option_insurance,
          option_price_child_seat: Number(option_price_child_seat),
          option_price_insurance: Number(option_price_insurance),
          total_price: Number(total_price),
          status: 'pending',
        },
      ])
      .select();

    if (reservationError || !reservationData) {
      console.error('🚨 reservations Insert Error:', reservationError);
      return NextResponse.json({ message: '❌ Supabase reservations 保存に失敗しました' }, { status: 500 });
    }

    const reservationId = reservationData[0].reservation_id;

    // ✅ Googleカレンダー登録（Supabase成功後）
    const endDateObj = new Date(endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const adjustedEndDate = endDateObj.toISOString().split('T')[0];

    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: `${vehicleId}`,
          start: { date: startDate },
          end: { date: adjustedEndDate },
        }),
      }
    );

    const eventData = await eventRes.json();
    if (!eventRes.ok || !eventData.id) {
      // Google登録失敗したら reservations を削除（ロールバック）
      await supabase.from('reservations').delete().eq('reservation_id', reservationId);
      return NextResponse.json({ message: '❌ Googleカレンダーへの登録に失敗しました' }, { status: 500 });
    }

    const calendarEventId = eventData.id;

    // ✅ carrental にも INSERT（GoogleカレンダーIDつき）
    const { data: carrentalData, error: carrentalError } = await supabase
      .from('carrental')
      .insert([
        {
          reservation_uuid: reservationId,
          user_id: userId,
          vehicle_id: vehicleId,
          car_name: car.name,
          rank: car.rank,
          number_plate: car.number_plate,
          start_date: startDate,
          end_date: endDate,
          planId: planLabel, // ✅ 同日なら「当日」
          car_rental_price: Number(plan_price),
          option_price_1: Number(option_price_child_seat),
          option_price_2: Number(option_price_insurance),
          total_price: Number(total_price),
          calendar_event_id: calendarEventId,
          payment_status: 'unpaid',
          status: 'pending',
        },
      ])
      .select();

    if (carrentalError) {
      console.error('🚨 carrental Insert Error:', carrentalError);
    } else {
      console.log('✅ carrental Insert Success:', carrentalData);
    }

    // ✅ Google Sheets に carrental 情報を書き込み
    if (process.env.GOOGLE_SHEETS_ID) {
      const jpCreatedAt = new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const sheetPayload = {
        values: [[
          reservationId || '',
          userId || '',
          vehicleId || '',
          calendarEventId || '',
          startDate || '',
          endDate || '',
          planLabel || '',   // ✅ 「当日」または「◯泊」
          plan_price ?? 0,
          option_price_child_seat ?? 0,
          option_price_insurance ?? 0,
          total_price ?? 0,
          'pending',
          jpCreatedAt || ''
        ]]
      };

      const sheetsURL = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;

      await fetch(sheetsURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(sheetPayload),
      });
    }

    return NextResponse.json({
      reservation_id: reservationId,
      message: `✅ 予約が確定しました！（プラン: ${planLabel}）`,
    });

  } catch (err) {
    console.error('🔥 Confirm Reservation Error:', err);
    return NextResponse.json({ message: '❌ サーバーエラー' }, { status: 500 });
  }
}
