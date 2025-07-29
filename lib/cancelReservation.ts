import { createClient } from '@supabase/supabase-js';
import { deleteCalendarEvent } from './deleteCalendarEvent';

// ✅ Supabase クライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      .select('id, calendar_event_id, vehicle_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      console.error('🔴 carrental 取得エラー:', fetchError);
      await supabase.from('system_logs').insert([
        { action: 'cancel-fetch-error', reservation_id: reservationId, details: fetchError?.message || '予約が見つかりません' }
      ]);
      return { success: false, error: '予約が見つかりません' };
    }

    // ② すでにキャンセル済みなら何もしない
    if (reservation.status === 'canceled') {
      console.log('⚠️ 既にキャンセル済み');
      await supabase.from('system_logs').insert([
        { action: 'already-canceled', reservation_id: reservationId }
      ]);
      return { success: true, message: '既にキャンセルされています' };
    }

    // ③ Googleカレンダー削除（イベントIDがあれば）
    if (reservation.calendar_event_id) {
      // ✅ ここで throw しない → 処理は続ける
      const deleted = await deleteCalendarEvent(
        process.env[`CAR${reservation.vehicle_id.slice(-2)}_CALENDAR_ID`] || '',
        reservation.calendar_event_id
      );

      await supabase.from('system_logs').insert([
        {
          action: deleted ? 'google-event-deleted' : 'google-event-delete-error',
          reservation_id: reservationId,
          details: deleted ? 'イベント削除成功' : 'Google API エラー（処理続行）'
        }
      ]);
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
      await supabase.from('system_logs').insert([
        { action: 'carrental-update-error', reservation_id: reservationId, details: updateError.message }
      ]);
      return { success: false, error: '予約のステータス更新に失敗しました' };
    }

    // ⑤ system_logs にキャンセル完了を記録
    await supabase.from('system_logs').insert([
      {
        action: reason,
        reservation_id: reservationId,
        details: 'キャンセル完了'
      }
    ]);

    console.log(`✅ キャンセル完了: ${reservationId}`);
    return { success: true, message: 'キャンセル完了' };

  } catch (error) {
    console.error('🔴 cancelReservation 処理エラー:', error);
    await supabase.from('system_logs').insert([
      { action: 'cancel-fatal', reservation_id: reservationId, details: String(error) }
    ]);
    return { success: false, error: String(error) };
  }
}
