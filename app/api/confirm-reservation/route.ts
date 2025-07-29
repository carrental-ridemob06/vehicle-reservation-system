import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '../../../lib/googleAuth'
import { supabase } from '../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    // ✅ フロントから reservation_id も受け取る
    const body = await req.json();
    const { reservation_id, userId, vehicleId, startDate, endDate, option_child_seat, option_insurance } = body;
    console.log('🔵 Confirm API Called:', { reservation_id, userId, vehicleId, startDate, endDate, option_child_seat, option_insurance });

    // ✅ カレンダーID取得
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    };
    const calendarId = calendarMap[vehicleId];
    console.log('📗 calendarId:', calendarId);

    // ✅ 車両情報取得
    const { data: car, error: carError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('car_no', vehicleId)
      .single();
    console.log('📘 車両情報:', car);

    if (carError || !car) {
      console.error('🚨 車両情報取得エラー:', carError);
      return NextResponse.json({ message: '車両情報が見つかりません' }, { status: 400 });
    }

    // ✅ 泊数計算 & プラン判定
    const sameDay = startDate === endDate;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (sameDay) {
      days = 0;
    } else if (days <= 0) {
      days = 1;
    }
    console.log('📆 泊数計算:', { sameDay, days });

    // ✅ 料金計算（泊数ごとに価格を振り分け）
    let plan_price: number;
    let planLabel: string;

    if (sameDay) {
      plan_price = car.price_same_day;
      planLabel = '当日';
    } else if (days === 1) {
      plan_price = car.price_1n;
      planLabel = '1泊';
    } else if (days === 2) {
      plan_price = car.price_2n;
      planLabel = '2泊';
    } else if (days === 3) {
      plan_price = car.price_3n;
      planLabel = '3泊';
    } else {
      plan_price = car.price_4n;  // ✅ 4泊以上は4泊料金を適用
      planLabel = `${days}泊`;
    }

    // ✅ オプション料金（泊数分を加算）
    const option_price_child_seat = option_child_seat ? car.option_price_1 * (sameDay ? 1 : days) : 0;
    const option_price_insurance = option_insurance ? car.option_price_2 * (sameDay ? 1 : days) : 0;

    // ✅ 合計
    const total_price = plan_price + option_price_child_seat + option_price_insurance;

    console.log('💴 料金計算:', { plan_price, planLabel, option_price_child_seat, option_price_insurance, total_price });

    // ✅ Googleサービスアカウントのアクセストークン取得
    const accessToken = await getAccessToken();
    console.log('🔑 Google AccessToken 取得成功');

    // ✅ Supabase reservations に INSERT
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert([
        {
          reservation_id,
          user_id: userId,
          vehicle_id: vehicleId,
          car_name: car.name,
          rank: car.rank,
          number_plate: car.number_plate,
          start_date: startDate,
          end_date: endDate,
          plan_id: planLabel,
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
    console.log('📥 reservations Insert 結果:', reservationData);

    if (reservationError || !reservationData) {
      console.error('🚨 reservations Insert Error:', reservationError);
      return NextResponse.json({ message: '❌ Supabase reservations 保存に失敗しました' }, { status: 500 });
    }

    const reservationId = reservationData[0].reservation_id;

    // ✅ Googleカレンダー登録
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
    console.log('📤 Googleカレンダー登録レスポンス:', eventData);

    if (!eventRes.ok || !eventData.id) {
      console.error('🚨 Googleカレンダー登録失敗:', eventData);
      await supabase.from('reservations').delete().eq('reservation_id', reservationId);
      return NextResponse.json({ message: '❌ Googleカレンダーへの登録に失敗しました' }, { status: 500 });
    }

    const calendarEventId = eventData.id;

    // ✅ carrental に INSERT
    const { data: carrentalData, error: carrentalError } = await supabase
      .from('carrental')
      .insert([
        {
          reservation_id: reservationId,
          user_id: userId,
          vehicle_id: vehicleId,
          car_name: car.name,
          rank: car.rank,
          number_plate: car.number_plate,
          start_date: startDate,
          end_date: endDate,
          planId: planLabel,
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
    console.log('📥 carrental Insert 結果:', carrentalData);

    if (carrentalError) {
      console.error('🚨 carrental Insert Error:', carrentalError);
    }

    // ✅ 返すデータをまとめる
    const responsePayload = {
      reservation_id: reservationId,
      message: `✅ 予約が確定しました！（プラン: ${planLabel}）`,
      reservation: {
        reservation_id: reservationId,
        vehicle_id: vehicleId,
        car_name: car.name,
        rank: car.rank,
        number_plate: car.number_plate,
        manufacturer: car.manufacturer || "",
        model: car.model || "",
        color: car.color || "",
        image_url_1: car.image_url_1 || "",
        start_date: startDate,
        end_date: endDate,
        planId: planLabel,
        car_rental_price: plan_price,
        option_price_1: option_price_child_seat,
        option_price_2: option_price_insurance,
        total_price: total_price,
      }
    };

    console.log('📦 API Response:', responsePayload);

    return NextResponse.json(responsePayload);

  } catch (err) {
    console.error('🔥 Confirm Reservation Error:', err);
    return NextResponse.json({ message: '❌ サーバーエラー' }, { status: 500 });
  }
}
