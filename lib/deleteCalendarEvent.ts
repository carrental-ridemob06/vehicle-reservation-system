import { google } from 'googleapis';

/**
 * Googleカレンダーイベント削除
 * Service Account の JWT 認証を使う（API Key 認証のエラーを防止）
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  try {
    // ✅ Service Account 認証（JWT）
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    // ✅ Google Calendar API クライアント作成
    const calendar = google.calendar({ version: 'v3', auth });

    // ✅ イベント削除
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log(`✅ Googleカレンダーイベント削除成功: ${eventId}`);
    return { success: true };

  } catch (err) {
    console.error('❌ Googleカレンダーイベント削除エラー:', err);
    return { success: false, error: err };
  }
}
