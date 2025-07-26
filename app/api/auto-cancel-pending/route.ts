import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getAccessToken } from '../../../lib/googleAuth'

export async function GET() {
  try {
    console.log('⏳ 20分キャンセルチェック開始')

    // ✅ 今から20分前の時刻を計算
    const cutoffTime = new Date(Date.now() - 20 * 60 * 1000).toISOString()

    // ✅ 20分以上経過した pending の予約を取得
    const { data: pendingReservations, error } = await supabase
      .from('carrental')
      .select('id, vehicle_id, calendar_event_id, created_at')
      .eq('status', 'pending')
      .lt('created_at', cutoffTime)

    if (error) {
      console.error('🚨 Supabase 取得エラー:', error)
      return NextResponse.json({ message: 'Supabase取得エラー' }, { status: 500 })
    }

    if (!pendingReservations || pendingReservations.length === 0) {
      console.log('✅ キャンセル対象なし')
      return NextResponse.json({ message: 'キャンセル対象なし', count: 0 })
    }

    console.log(`⚠️ ${pendingReservations.length} 件の予約をキャンセルします`)

    // ✅ Googleカレンダー削除用の認証
    const token = await getAccessToken()

    // ✅ 車両ごとのカレンダーIDマップ
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    }

    // ✅ 1件ずつ処理
    for (const reservation of pendingReservations) {
      const { id, vehicle_id, calendar_event_id } = reservation

      try {
        const calendarId = calendarMap[vehicle_id]

        // ✅ Googleカレンダーからイベント削除
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${calendar_event_id}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        )

        // ✅ Supabaseのステータスを canceled に更新
        await supabase
          .from('carrental')
          .update({ status: 'canceled', payment_status: 'expired' })
          .eq('id', id)

        console.log(`🛑 予約ID ${id} をキャンセルしました`)
      } catch (err) {
        console.error(`🚨 予約ID ${id} のキャンセル中にエラー:`, err)
      }
    }

    return NextResponse.json({
      message: `${pendingReservations.length} 件の予約をキャンセルしました`,
      count: pendingReservations.length,
    })
  } catch (err) {
    console.error('🔥 20分キャンセルAPIエラー:', err)
    return NextResponse.json({ message: 'サーバーエラー' }, { status: 500 })
  }
}
