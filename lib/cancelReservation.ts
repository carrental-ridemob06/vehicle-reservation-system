// ✅ lib/cancelReservation.ts
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import { getAccessToken } from './googleAuth'

// ✅ Supabase Service Role で接続（削除もあるので service_key 必須）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 予約キャンセル共通処理
 * @param reservationId carrental.id（または reservation_id）
 * @param reason 'auto-cancel' | 'manual-cancel'
 */
export async function cancelReservation(reservationId: string, reason: string = 'manual-cancel') {
  try {
    console.log(`🚨 キャンセル処理開始: ${reservationId} (${reason})`)

    // ① carrental から予約情報を取得
    const { data: reservation, error: fetchError } = await supabase
      .from('carrental')
      .select('id, calendar_event_id, status, vehicle_id')
      .eq('id', reservationId)
      .single()

    if (fetchError || !reservation) {
      console.error('🔴 carrental 取得エラー:', fetchError)
      return { success: false, error: '予約が見つかりません' }
    }

    // ② すでにキャンセル済みならスキップ
    if (reservation.status === 'canceled') {
      console.log('⚠️ 既にキャンセル済み')
      return { success: true, message: '既にキャンセルされています' }
    }

    // ③ Googleカレンダーのイベント削除
    if (reservation.calendar_event_id) {
      try {
        const auth = await getAccessToken()
        const calendar = google.calendar({ version: 'v3', auth })

        // ✅ 車ごとのカレンダーIDマップ
        const calendarMap = {
          car01: process.env.CAR01_CALENDAR_ID!,
          car02: process.env.CAR02_CALENDAR_ID!,
          car03: process.env.CAR03_CALENDAR_ID!,
        }

        const calendarId = calendarMap[reservation.vehicle_id as keyof typeof calendarMap]

        if (calendarId) {
          await calendar.events.delete({
            calendarId,
            eventId: reservation.calendar_event_id
          })
          console.log(`📆 Googleカレンダー削除完了: ${reservation.calendar_event_id}`)
        }
      } catch (err) {
        console.error('🔴 Googleカレンダー削除エラー:', err)
      }
    }

    // ④ Supabase carrental をキャンセル状態に更新
    const { error: updateError } = await supabase
      .from('carrental')
      .update({
        status: 'canceled',
        payment_status: 'expired'
      })
      .eq('id', reservationId)

    if (updateError) {
      console.error('🔴 carrental 更新エラー:', updateError)
      return { success: false, error: '予約のステータス更新に失敗しました' }
    }

    // ⑤ system_logs に記録
    await supabase.from('system_logs').insert([
      {
        action: reason,
        reservation_id: reservationId,
        details: { calendar_event_id: reservation.calendar_event_id },
        created_at: new Date().toISOString()
      }
    ])

    console.log(`✅ キャンセル完了: ${reservationId}`)
    return { success: true, message: 'キャンセル完了' }

  } catch (error) {
    console.error('🔴 cancelReservation 処理エラー:', error)
    return { success: false, error: String(error) }
  }
}
