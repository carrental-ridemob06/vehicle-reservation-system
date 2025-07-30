import { google } from 'googleapis';
import { getAccessToken } from './googleAuth';
import { createClient } from '@supabase/supabase-js';

// ✅ Supabase クライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Googleカレンダーイベント削除（HTTPステータス詳細ログ付き）
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  try {
    const auth = await getAccessToken();
    const calendar = google.calendar({ version: 'v3', auth });

    // ✅ 削除開始ログ
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-start',
        reservation_id: eventId,
        details: `イベントID: ${eventId} / カレンダーID: ${calendarId}`
      }
    ]);

    // ✅ Google API 呼び出し
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    // ✅ 成功ログ
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-success',
        reservation_id: eventId,
        details: `Google API: 削除成功`
      }
    ]);

    console.log(`✅ Googleカレンダーイベント削除成功: ${eventId}`);
    return true;

  } catch (err: any) {
    console.error('❌ Googleカレンダーイベント削除エラー:', err);

    // ✅ エラー時のステータスコードとレスポンス詳細をログに残す
    const status = err?.response?.status || 'NO_STATUS';
    const statusText = err?.response?.statusText || 'NO_STATUS_TEXT';
    const apiMessage = JSON.stringify(err?.response?.data) || 'NO_RESPONSE_DATA';

    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-error',
        reservation_id: eventId,
        details: `Error: Status=${status} (${statusText}) / Response=${apiMessage}`
      }
    ]);

    return false;
  }
}
