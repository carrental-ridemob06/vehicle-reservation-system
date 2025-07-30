import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelReservation } from '@/lib/cancelReservation'

// ✅ Supabase クライアント（Service Role）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // 🔥 service role を使って DB更新
)

export async function GET() {
  try {
    console.log('⏳ 自動キャンセル処理開始')

    // ✅ 20分前の時刻を計算
    const cutoffTime = new Date(Date.now() - 20 * 60 * 1000).toISOString()

    // ✅ carrental から status=pending & created_at < cutoffTime を取得
    const { data: pendingReservations, error } = await supabase
      .from('carrental')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', cutoffTime)

    if (error) {
      console.error('🔴 Supabase 取得エラー:', error)
      await supabase.from('system_logs').insert([
        { action: 'auto-cancel-error', details: `Supabase取得失敗: ${error.message}` }
      ])
      return NextResponse.json({ error: '予約の取得に失敗' }, { status: 500 })
    }

    if (!pendingReservations || pendingReservations.length === 0) {
      console.log('✅ 自動キャンセル対象なし')
      await supabase.from('system_logs').insert([
        { action: 'auto-cancel-check', details: '対象0件' }
      ])
      return NextResponse.json({ message: '対象なし', count: 0 })
    }

    console.log(`🚨 対象予約数: ${pendingReservations.length}`)
    await supabase.from('system_logs').insert([
      { action: 'auto-cancel-check', details: `対象 ${pendingReservations.length}件` }
    ])

    // ✅ キャンセル処理を順番に実行
    const results = []
    for (const reservation of pendingReservations) {
      try {
        console.log(`🔵 キャンセル処理開始: ID=${reservation.id}`)
        await supabase.from('system_logs').insert([
          { action: 'auto-cancel-start', reservation_id: reservation.id }
        ])

        // ✅ cancelReservation（Googleカレンダー削除＋status更新＋system_logs記録）
        //    🚩 cancelReservation 内も delete ではなく update に修正してある前提
        const res = await cancelReservation(reservation.id, 'auto-cancel')
        results.push({ id: reservation.id, ...res })

        console.log(`✅ キャンセル成功: ID=${reservation.id}`)
        await supabase.from('system_logs').insert([
          { action: 'auto-cancel-success', reservation_id: reservation.id, details: 'status=canceled に更新' }
        ])
      } catch (err) {
        console.error(`❌ キャンセル失敗: ID=${reservation.id}`, err)
        await supabase.from('system_logs').insert([
          { action: 'auto-cancel-error', reservation_id: reservation.id, details: String(err) }
        ])
      }
    }

    console.log(`✅ 自動キャンセル完了: ${results.length}件`)
    await supabase.from('system_logs').insert([
      { action: 'auto-cancel-finish', details: `完了: ${results.length}件` }
    ])

    return NextResponse.json({ message: '自動キャンセル完了', count: results.length, results })
  } catch (err) {
    console.error('🔴 自動キャンセルAPIエラー:', err)
    await supabase.from('system_logs').insert([
      { action: 'auto-cancel-fatal', details: String(err) }
    ])
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

