import { createClient } from '@supabase/supabase-js';
import { deleteCalendarEvent } from './deleteCalendarEvent';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function cancelReservation(reservationId: string, reason: string = 'manual-cancel') {
  try {
    console.log(`🚨 キャンセル処理開始: ${reservationId} (${reason})`);

    // ① carrental 取得
    const { data: reservation, error: fetchError } = await supabase
      .from('carrental')
      .select('id, vehicle_id, calendar_event_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      console.error('🔴 carrental 取得エラー:', fetchError);
      await supabase.from('system_logs').insert([
        { action: 'cancel-fetch-error', reservation_id: reservationId, details: fetchError?.message || '予約なし' }
      ]);
      return { success: false, error: '予約が見つかりません' };
    }

    // ② 既にキャンセル済みならスキップ
    if (reservation.status === 'canceled') {
      await supabase.from('system_logs').insert([
        { action: 'cancel-skip', reservation_id: reservationId, details: '既にキャンセル済み' }
      ]);
      return { success: true, message: '既にキャンセルされています' };
    }

    // ③ Google カレンダー削除
    if (reservation.calendar_event_id) {
      try {
        // ✅ 削除処理は deleteCalendarEvent.ts に一本化
        await deleteCalendarEvent(reservation.vehicle_id, reservation.calendar_event_id);
        // ✅ 成功ログは deleteCalendarEvent.ts 内で処理するのでここでは書かない
      } catch (err) {
        console.error('🔴 Googleカレンダー削除エラー:', err);
        await supabase.from('system_logs').insert([
          { action: 'google-event-delete-error', reservation_id: reservationId, details: String(err) }
        ]);
      }
    }

    // ④ Supabase carrental 更新
    const { error: updateError } = await supabase
      .from('carrental')
      .update({ status: 'canceled', payment_status: 'expired' })
      .eq('id', reservationId);

    if (updateError) {
      console.error('🔴 carrental 更新エラー:', updateError);
      await supabase.from('system_logs').insert([
        { action: 'cancel-update-error', reservation_id: reservationId, details: updateError.message }
      ]);
      return { success: false, error: '予約のステータス更新に失敗しました' };
    }

    // ✅ キャンセル完了ログ
    await supabase.from('system_logs').insert([
      { action: 'auto-cancel-success', reservation_id: reservationId, details: 'キャンセル成功' }
    ]);

    console.log(`✅ キャンセル完了: ${reservationId}`);
    return { success: true, message: 'キャンセル完了' };

  } catch (err) {
    console.error('🔴 cancelReservation 処理エラー:', err);
    await supabase.from('system_logs').insert([
      { action: 'cancel-fatal-error', reservation_id: reservationId, details: String(err) }
    ]);
    return { success: false, error: String(err) };
  }
}
