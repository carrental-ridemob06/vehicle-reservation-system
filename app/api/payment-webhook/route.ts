import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('💳 ClickPAY Webhook 受信:', body)

    // ✅ ClickPAY からの通知データ
    const { reservation_id, payment_status, payment_id } = body

    // ✅ 必須チェック
    if (!reservation_id || !payment_status || !payment_id) {
      return NextResponse.json({ message: '❌ 必要な情報が不足しています' }, { status: 400 })
    }

    // ✅ 決済が成功していない場合
    if (payment_status !== 'succeeded') {
      return NextResponse.json({ message: '⚠️ 決済は未完了です' }, { status: 400 })
    }

    // ✅ Supabaseの予約を confirmed に更新
    const { data, error } = await supabase
      .from('carrental')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_id: payment_id,
      })
      .eq('id', reservation_id)
      .select()

    if (error) {
      console.error('🚨 Supabase 更新エラー:', error)
      return NextResponse.json({ message: '❌ DB更新に失敗しました' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: '❌ 該当する予約が見つかりません' }, { status: 404 })
    }

    console.log('✅ 本予約確定:', data[0])

    // ✅ Google Sheets にも本予約確定を記録（任意）
    if (process.env.GOOGLE_SHEETS_ID) {
      const sheetsURL = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`

      const sheetPayload = {
        values: [
          [
            reservation_id,
            data[0].user_id,
            data[0].vehicle_id,
            data[0].calendar_event_id,
            data[0].start_date,
            data[0].end_date,
            `${data[0].planId}`,
            'confirmed',
            new Date().toISOString(),
          ],
        ],
      }

      const sheetsRes = await fetch(sheetsURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await (await import('../../../lib/googleAuth')).getAccessToken()}`,
        },
        body: JSON.stringify(sheetPayload),
      })

      if (sheetsRes.ok) {
        console.log('✅ Sheets Append 成功')
      } else {
        console.error('🚨 Sheets Append エラー', sheetsRes.statusText)
      }
    }

    return NextResponse.json({
      message: '✅ 本予約が確定しました',
      reservation_id,
    })
  } catch (err) {
    console.error('🔥 Webhook API エラー:', err)
    return NextResponse.json({ message: '❌ サーバーエラー' }, { status: 500 })
  }
}
