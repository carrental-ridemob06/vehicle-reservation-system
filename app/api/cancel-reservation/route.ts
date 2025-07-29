import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cancelReservation } from '@/lib/cancelReservation';

// ✅ Google Calendar イベント削除関数
async function deleteCalendarEvent(vehicleId: string, calendarEventId: string) {
  try {
    // ✅ 車両ごとのカレンダーIDマップ
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    };

    const calendarId = calendarMap[vehicleId];
    if (!calendarId) {
      throw new Error(`❌ vehicleId=${vehicleId} のカレンダーIDが見つかりません`);
    }

    // ✅ Google認証（Service Account）
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // ✅ イベント削除
    await calendar.events.delete({
      calendarId,
      eventId: calendarEventId,
    });

    console.log(`✅ Googleカレンダー削除成功: ${calendarEventId} (vehicle=${vehicleId})`);
    return { success: true };
  } catch (error) {
    console.error('🔴 Googleカレンダー削除失敗:', error);
    return { success: false, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { reservationId, calendarEventId, vehicleId } = await req.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId が必要です' }, { status: 400 });
    }

    console.log(`🚨 手動キャンセルAPI呼び出し: ${reservationId}`);

    // ✅ Googleカレンダー削除（eventIdとvehicleIdが送られてきた場合のみ）
    if (calendarEventId && vehicleId) {
      await deleteCalendarEvent(vehicleId, calendarEventId);
    }

    // ✅ Supabase側の予約キャンセル
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
