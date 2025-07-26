import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getAccessToken } from '../../../lib/googleAuth'

export async function POST(req: NextRequest) {
  try {
    const { reservation_id, cancel_reason } = await req.json()
    console.log('🛑 キャンセルAPI呼び出し:', { reservation_id, cancel_reason })

    // ✅ Supabaseから予約情報を取得
    const { data, error } = await supabase
      .from('carrental')
      .select('calendar_event_id, vehicle_id')
      .eq('id', reservation_id)
      .single()

    if (error || !data) {
      console.error('🚨 予約が見つかりません', error)
      return NextResponse.json({ message: '予約が見つかりません' }, { status: 404 })
    }

    const { calendar_event_id, vehicle_id } = data

    // ✅ 車両ごとのカレンダーIDをマッピング
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    }
    const calendarId = calendarMap[vehicle_id]

    // ✅ Googleカレンダーからイベント削除
    try {
      const token = await getAccessToken()
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${calendar_event_id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      console.log(`✅ Googleカレンダーイベント削除成功: ${calendar_event_id}`)
    } catch (googleError) {
      console.error('🚨 Googleカレンダー削除エラー', googleError)
      // カレンダー削除失敗しても処理は続ける
    }

    // ✅ Supabaseの予約ステータスを canceled に更新
    const { error: updateError } = await supabase
      .from('carrental')
      .update({
        status: 'canceled',
        payment_status: 'refunded', // ClickPAY側で返金済み想定
        refund_reason: cancel_reason || 'ClickPAY refund',
      })
      .eq('id', reservation_id)

    if (updateError) {
      console.error('🚨 Supabase 更新エラー', updateError)
      return NextResponse.json({ message: 'DB更新に失敗しました' }, { status: 500 })
    }

    console.log(`✅ Supabase予約更新完了: ID=${reservation_id}`)

    return NextResponse.json({ 
      message: '✅ 予約をキャンセルしました',
      reservation_id
    })

  } catch (err) {
    console.error('🔥 Cancel API エラー:', err)
    return NextResponse.json({ message: '❌ サーバーエラー' }, { status: 500 })
  }
}
