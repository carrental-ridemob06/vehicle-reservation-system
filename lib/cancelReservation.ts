import { createClient } from '@supabase/supabase-js';
import { deleteCalendarEvent } from './deleteCalendarEvent';

// ✅ Supabase クライアント（Service Role 使用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // ✅ anon ではなく service_role を使う
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
        { 
          action: `${reason}-fetch-error`, 
          reservation_id: reservationId, 
          details: fetchError?.message || '予約が見つかりません' 
        }
      ]);
      return { success: false, error: '予約が見つかりません' };
    }

    // ② 既にキャンセル済みならスキップ
    if (reservation.status === 'canceled') {
      await supabase.from('system_logs').insert([
        { 
          action: `${reason}-skip`, 
          reservation_id: reservationId, 
          details: '既にキャンセル済み' 
        }
      ]);
      return { success: true, message: '既にキャンセルされています' };
    }

    // ③ Google カレンダー削除
    if (reservation.calendar_event_id) {
      try {
        await deleteCalendarEvent(reservation.vehicle_id, reservation.calendar_event_id);
        // 成功ログは deleteCalendarEvent.ts 内で記録
      } catch (err) {
        console.error('🔴 Googleカレンダー削除エラー:', err);
        await supabase.from('system_logs').insert([
          { 
            action: `${reason}-google-event-delete-error`, 
            reservation_id: reservationId, 
            details: String(err) 
          }
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
        { 
          action: `${reason}-update-error`, 
          reservation_id: reservationId, 
          details: updateError.message 
        }
      ]);
      return { success: false, error: '予約のステータス更新に失敗しました' };
    }

    // ✅ キャンセル完了ログ（auto/manual を分ける）
    await supabase.from('system_logs').insert([
      { 
        action: `${reason}-success`, 
        reservation_id: reservationId, 
        details: 'キャンセル成功' 
      }
    ]);

    console.log(`✅ キャンセル完了: ${reservationId}`);
    return { success: true, message: 'キャンセル完了' };

  } catch (err) {
    console.error('🔴 cancelReservation 処理エラー:', err);
    await supabase.from('system_logs').insert([
      { 
        action: `${reason}-fatal-error`, 
        reservation_id: reservationId, 
        details: String(err) 
      }
    ]);
    return { success: false, error: String(err) };
  }
}
