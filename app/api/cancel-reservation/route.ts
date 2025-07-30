import { NextRequest, NextResponse } from 'next/server';
import { cancelReservation } from '@/lib/cancelReservation';
import { deleteCalendarEvent } from '@/lib/deleteCalendarEvent';  // ✅ libから呼び出しに一本化

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
