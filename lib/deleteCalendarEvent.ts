import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Googleカレンダーイベント削除（Supabaseにログ書き込み対応）
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string, reservationId?: string) {
  try {
    // ✅ Supabaseログ: 削除開始
    await supabase.from('system_logs').insert([
      { action: 'google-event-delete-start', reservation_id: reservationId || null, details: `イベントID: ${eventId}` }
    ]);

    // ✅ サービスアカウントのJWTで認証
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    // ✅ Calendar API を初期化
    const calendar = google.calendar({ version: 'v3', auth });

    // ✅ Googleカレンダーイベント削除
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log(`✅ Googleカレンダーイベント削除成功: ${eventId}`);

    // ✅ Supabaseログ: 削除成功
    await supabase.from('system_logs').insert([
      { action: 'google-event-delete-success', reservation_id: reservationId || null, details: `削除成功: ${eventId}` }
    ]);

    return true;
  } catch (err: any) {
    console.error('❌ Googleカレンダーイベント削除エラー:', err);

    // ✅ Supabaseログ: エラー記録
    await supabase.from('system_logs').insert([
      { action: 'google-event-delete-error', reservation_id: reservationId || null, details: `エラー: ${err.message}` }
    ]);

    // エラーを上位に投げる（処理は続行させる）
    throw err;
  }
}
