import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '../../../lib/googleAuth'
import { supabase } from '../../../lib/supabase'

/**
 * ✅ Click用（秒なし、yyyy-MM-dd HH:mm）
 */
function getJSTDateForClick() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getFullYear();
  const month = String(jst.getMonth() + 1).padStart(2, '0');
  const day = String(jst.getDate()).padStart(2, '0');
  const hour = String(jst.getHours()).padStart(2, '0');
  const minute = String(jst.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * ✅ Google Sheets用（JSTシンプル yyyy/MM/dd HH:mm:ss）
 */
function getJSTDateForSheets() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getFullYear();
  const month = String(jst.getMonth() + 1).padStart(2, '0');
  const day = String(jst.getDate()).padStart(2, '0');
  const hour = String(jst.getHours()).padStart(2, '0');
  const minute = String(jst.getMinutes()).padStart(2, '0');
  const second = String(jst.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, vehicleId, startDate, endDate } = body;

    console.log('🔵 Confirm API Called:', { userId, vehicleId, startDate, endDate });

    // ✅ 車ごとの Google カレンダーIDマップ
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    };

    const calendarId = calendarMap[vehicleId];
    if (!calendarId) {
      return NextResponse.json({ message: '無効な車両IDです' }, { status: 400 });
    }

    // ✅ 1️⃣ まず Supabase で重複予約チェック
    const { data: existing } = await supabase
      .from('carrental')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('start_date', startDate)
      .eq('end_date', endDate)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (existing) {
      console.log('⚠️ 重複予約を検知: ID=', existing.id);
      return NextResponse.json({
        message: '⚠️ すでに同じ日程で予約があります',
        reservation_id: existing.id
      }, { status: 400 });
    }

    // ✅ Googleサービスアカウントのアクセストークン取得
    const accessToken = await getAccessToken();
    console.log('🔑 GOOGLE AccessToken:', accessToken);

    // ✅ Googleカレンダー用に終了日を +1日
    const endDateObj = new Date(endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const adjustedEndDate = endDateObj.toISOString().split('T')[0];

    // ✅ Googleカレンダーにイベント作成
    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: `Reservation for ${vehicleId}`,
          start: { date: startDate },
          end: { date: adjustedEndDate },   // ✅ +1日した日付を送信
        }),
      }
    );

    const eventData = await eventRes.json();

    if (!eventRes.ok || !eventData.id) {
      console.error('🚫 Google Calendar イベント作成失敗:', eventRes.status, eventData);
      return NextResponse.json(
        { message: 'Googleカレンダーへの登録に失敗しました' },
        { status: 500 }
      );
    }

    const calendarEventId = eventData.id;
    console.log('📜 Google Calendar Event Created:', calendarEventId);

    // ✅ 泊数計算（endDate は +1せず元の日付で計算）
    const days =
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) || 1;

    // ✅ Supabaseに挿入（重複チェックを通過した場合のみ）
    const { data, error } = await supabase
      .from('carrental')
      .insert([
        {
          user_id: userId,
          vehicle_id: vehicleId,
          calendar_event_id: calendarEventId,
          start_date: startDate,
          end_date: endDate,        // ✅ DBには元の日付を保存
          planId: `${days}泊`,
          status: 'pending',
          payment_status: 'unpaid',
        },
      ])
      .select();

    if (error || !data || data.length === 0) {
      console.error('🚫 Supabase Insert Error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: 'DB保存に失敗しました' }, { status: 500 });
    }

    const reservationId = data[0].id;
    console.log('✅ Supabase Reservation ID:', reservationId);

    // ✅ Google Sheetsへ書き込み
    if (process.env.GOOGLE_SHEETS_ID) {
      console.log('🟢 Sheets書き込みを開始します...');

      // ✅ JST（yyyy/MM/dd HH:mm:ss）で created_at を作成
      const jpCreatedAt = new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      // ✅ Google Sheets で “テキスト” として扱わせるため ' を付ける
      const sheetTimestamp = `'${jpCreatedAt}'`;

      const sheetsURL = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;

      const sheetPayload = {
        values: [
          [
            reservationId,
            userId,
            vehicleId,
            calendarEventId,
            startDate,
            endDate,
            `${days}泊`,
            'pending',    // ← 仮予約のステータス
            sheetTimestamp,   // ← JSTのテキスト（シングルクォート付き）
          ],
        ],
      };

      const sheetsRes = await fetch(sheetsURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(sheetPayload),
      });

      const sheetsData = await sheetsRes.json();

      if (sheetsRes.ok) {
        console.log('✅ Sheets Append 成功:', JSON.stringify(sheetsData, null, 2));
      } else {
        console.error('🚫 Sheets Append エラー:', sheetsRes.status, sheetsRes.statusText);
        console.error('📄 エラー内容:', JSON.stringify(sheetsData, null, 2));
      }
    } else {
      console.log('⚠️ Sheets IDが未設定のため、スキップしました');
    }

    return NextResponse.json({
      reservation_id: reservationId,
      message: '予約が確定しました！',
    });
  } catch (err) {
    console.error('🔥 Confirm Reservation Error:', err);
    return NextResponse.json({ message: 'サーバーエラー' }, { status: 500 });
  }
}
