import { google } from 'googleapis';
import { getAccessToken } from './googleAuth';

/**
 * Googleカレンダーイベント削除
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  try {
    const auth = await getAccessToken();
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log(`✅ Googleカレンダーイベント削除成功: ${eventId}`);
    return true;

  } catch (err) {
    console.error('❌ Googleカレンダーイベント削除エラー:', err);
    throw err;
  }
}
