import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cancelReservation } from '@/lib/cancelReservation';
import { getAccessToken } from '@/lib/googleAuth';

// ✅ Google Calendar イベント削除関数
async function deleteCalendarEvent(calendarEventId: string) {
  try {
    const calendar = google.calendar({ version: 'v3' });

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID!, // ✅ 環境変数で管理
      eventId: calendarEventId,
      auth: new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/calendar'],
      }),
    });

    console.log(`✅ Googleカレンダー削除成功: ${calendarEventId}`);
    return { success: true };
  } catch (error) {
    console.error('🔴 Googleカレンダー削除失敗:', error);
    return { success: false, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { reservationId, calendarEventId } = await req.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId が必要です' }, { status: 400 });
    }

    console.log(`🚨 手動キャンセルAPI呼び出し: ${reservationId}`);

    // ✅ Googleカレンダー削除（eventIdが送られてきた場合のみ）
    if (calendarEventId) {
      await deleteCalendarEvent(calendarEventId);
    }

    // ✅ Supabase側の予約キャンセル（lib/cancelReservation.ts を使用）
    const result = await cancelReservation(reservationId, 'manual-cancel');

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'キャンセル完了', reservationId });
  } catch (err) {
    console.error('🔴 APIエラー:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
