import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getAccessToken } from '../../../lib/googleAuth'

export async function GET() {
  try {
    console.log('⏳ 20分キャンセルチェック開始')

    // ✅ 今から20分前の時刻を計算
    const cutoffTime = new Date(Date.now() - 20 * 60 * 1000).toISOString()

    // ✅ キャンセル対象ステータス（今後増えてもここを編集すればOK）
    const CANCEL_TARGET_STATUS = ['pending', 'unpaid']

    // ✅ 20分以上経過した予約を取得（pending / unpaid 両方）
    const { data: pendingReservations, error } = await supabase
      .from('carrental')
      .select('id, vehicle_id, calendar_event_id, created_at')
      .in('status', CANCEL_TARGET_STATUS)  // ← ✅ ここを eq から in に変更
      .lt('created_at', cutoffTime)

    if (error) {
      return NextResponse.json({ message: '❌ Supabase取得エラー', error }, { status: 500 })
    }

    if (!pendingReservations || pendingReservations.length === 0) {
      return NextResponse.json({ message: '✅ キャンセル対象なし', count: 0 })
    }

    console.log(`⚠️ ${pendingReservations.length}件の予約をキャンセルします`)

    // ✅ Googleカレンダー削除用の認証
    const token = await getAccessToken()

    // ✅ 車両ごとのカレンダーIDマップ
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    }

    // ✅ 成功・失敗ログを保持する配列
    const successLogs: any[] = []
    const errorLogs: any[] = []

    // ✅ 1件ずつ処理
    for (const reservation of pendingReservations) {
      const { id, vehicle_id, calendar_event_id } = reservation

      try {
        const calendarId = calendarMap[vehicle_id]

        // ✅ Googleカレンダーからイベント削除
        const deleteRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${calendar_event_id}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        )

        if (deleteRes.status === 204) {
          successLogs.push({ id, calendar_event_id, message: '🗑 削除成功' })
        } else {
          const errorText = await deleteRes.text()
          errorLogs.push({
            id,
            calendar_event_id,
            status: deleteRes.status,
            message: '🚨 削除失敗',
            error: errorText,
          })
        }

        // ✅ Supabaseのステータスを canceled に更新
        await supabase
          .from('carrental')
          .update({ status: 'canceled', payment_status: 'expired' })
          .eq('id', id)
      } catch (err: any) {
        errorLogs.push({ id, calendar_event_id, message: '🚨 エラー', error: err.message })
      }
    }

    // ✅ 最後に JSON で全ログを返す
    return NextResponse.json({
      message: `${pendingReservations.length}件の予約をチェックしました`,
      count: pendingReservations.length,
      success: successLogs,
      failed: errorLogs,
    })
  } catch (err: any) {
    return NextResponse.json({ message: '🔥 20分キャンセルAPIエラー', error: err.message }, { status: 500 })
  }
}
