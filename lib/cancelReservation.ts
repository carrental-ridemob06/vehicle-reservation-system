// ✅ lib/cancelReservation.ts
import { createClient } from '@supabase/supabase-js';
import { deleteCalendarEvent } from './googleCalendar';

// ✅ Supabase クライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ 車両キー型を定義
type VehicleKey = 'car01' | 'car02' | 'car03';

/**
 * 予約キャンセル共通処理
 * @param reservationId 予約ID（または id）
 * @param reason 'auto-cancel' | 'manual-cancel'
 */
export async function cancelReservation(reservationId: string, reason: string = 'manual-cancel') {
  try {
    console.log(`🚨 キャンセル処理開始: ${reservationId} (${reason})`);

    // ① carrental から予約情報を取得
    const { data: reservation, error: fetchError } = await supabase
      .from('carrental')
      .select('id, vehicle_id, calendar_event_id, status')
      .eq('id', reservationId) // idベースで検索
      .single();

    if (fetchError || !reservation) {
      console.error('🔴 carrental 取得エラー:', fetchError);
      return { success: false, error: '予約が見つかりません' };
    }

    // ② すでにキャンセル済みなら何もしない
    if (reservation.status === 'canceled') {
      console.log('⚠️ 既にキャンセル済み');
      return { success: true, message: '既にキャンセルされています' };
    }

    // ✅ 車両ごとのカレンダーIDマップ（型定義）
    const calendarMap: Record<VehicleKey, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    };

    // ✅ reservation.vehicle_id が 'car01' | 'car02' | 'car03' であることを保証
    const vehicleKey = reservation.vehicle_id as VehicleKey;
    const calendarId = calendarMap[vehicleKey];

    // ③ Googleカレンダー削除（イベントIDがあれば）
    if (calendarId && reservation.calendar_event_id) {
      try {
        console.log(`📆 Googleカレンダー削除: ${reservation.calendar_event_id}`);
        await deleteCalendarEvent(calendarId, reservation.calendar_event_id);

        // ✅ system_logsに削除成功を記録
        await supabase.from('system_logs').insert([{
          action: 'google-event-deleted',
          reservation_id: reservationId,
          details: { calendar_event_id: reservation.calendar_event_id }
        }]);

      } catch (err) {
        console.error('🔴 Googleカレンダー削除エラー:', err);
        await supabase.from('system_logs').insert([{
          action: 'google-event-delete-error',
          reservation_id: reservationId,
          details: String(err)
        }]);
      }
    }

    // ④ Supabase carrental をキャンセル状態に更新
    const { error: updateError } = await supabase
      .from('carrental')
      .update({
        status: 'canceled',
        payment_status: 'expired'
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('🔴 carrental 更新エラー:', updateError);
      return { success: false, error: '予約のステータス更新に失敗しました' };
    }

    // ⑤ Supabase system_logs に記録
    await supabase.from('system_logs').insert([{
      action: reason,
      reservation_id: reservationId,
      details: { calendar_event_id: reservation.calendar_event_id }
    }]);

    console.log(`✅ キャンセル完了: ${reservationId}`);
    return { success: true, message: 'キャンセル完了' };

  } catch (error) {
    console.error('🔴 cancelReservation 処理エラー:', error);
    return { success: false, error: String(error) };
  }
}
