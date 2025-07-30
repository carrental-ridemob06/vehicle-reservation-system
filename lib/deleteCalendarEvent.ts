// lib/deleteCalendarEvent.ts
import { google } from 'googleapis';
import { getAccessToken } from './googleAuth';
import { createClient } from '@supabase/supabase-js';

// ✅ Supabase クライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Googleカレンダーのイベント削除 + system_logs記録
 * @param calendarId GoogleカレンダーID
 * @param eventId 削除するイベントID
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  try {
    // 🔵 削除開始ログ
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-start',
        reservation_id: null, // 予約IDが渡せる場合は入れる
        details: `削除開始: カレンダー=${calendarId}, イベントID=${eventId}`
      }
    ]);

    // 🔐 認証処理
    const auth = await getAccessToken();
    const calendar = google.calendar({ version: 'v3', auth });

    // ✅ Google Calendar イベント削除
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    // 🟢 成功ログ
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-success',
        reservation_id: null,
        details: `削除成功: イベントID=${eventId}`
      }
    ]);

    console.log(`✅ Googleカレンダーイベント削除成功: ${eventId}`);
    return true;

  } catch (err: any) {
    console.error('❌ Googleカレンダー削除エラー:', err);

    // 🔴 失敗ログ（Google APIのレスポンス詳細も残す）
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-error',
        reservation_id: null,
        details: `削除失敗: イベントID=${eventId} / エラー詳細: ${JSON.stringify(err.response?.data || err)}`
      }
    ]);

    return false; // throw せず false を返すことで処理は継続
  }
}
