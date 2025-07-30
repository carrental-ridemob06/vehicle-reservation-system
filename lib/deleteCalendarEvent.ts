import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Googleカレンダーイベント削除（車両IDをもとにカレンダーを選択）
 * @param vehicleId - 車両ID (例: car01, car02, car03)
 * @param eventId - 削除対象のGoogleカレンダーイベントID
 */
export async function deleteCalendarEvent(vehicleId: string, eventId: string) {
  // ✅ カレンダーIDマップ
  const calendarMap: Record<string, string> = {
    car01: process.env.CAR01_CALENDAR_ID!,
    car02: process.env.CAR02_CALENDAR_ID!,
    car03: process.env.CAR03_CALENDAR_ID!,
  };

  const calendarId = calendarMap[vehicleId];

  if (!calendarId) {
    console.error(`❌ カレンダーIDが見つかりません vehicleId=${vehicleId}`);
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-error',
        reservation_id: null,
        details: `vehicleId=${vehicleId} に対応するカレンダーIDが見つかりません`
      }
    ]);
    return { success: false, error: `vehicleId=${vehicleId} のカレンダーIDが未定義` };
  }

  try {
    // ✅ Google認証（Service Account）
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // ✅ 削除処理開始ログ
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-start',
        reservation_id: null,
        details: `イベントID: ${eventId} / カレンダーID: ${calendarId}`
      }
    ]);

    // ✅ Googleカレンダーイベント削除
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log(`✅ Googleカレンダー削除成功: ${eventId} (vehicle=${vehicleId})`);

    // ✅ 成功ログ
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-deleted',
        reservation_id: null,
        details: `成功: EventID=${eventId} / CalendarID=${calendarId} / Vehicle=${vehicleId}`
      }
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('🔴 Googleカレンダー削除エラー:', err);

    // ✅ エラーメッセージと HTTP ステータスを system_logs に記録
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-error',
        reservation_id: null,
        details: `Error: Status=${err.code || err.response?.status || '不明'} / ${err.message || String(err)}`
      }
    ]);

    return { success: false, error: err };
  }
}
