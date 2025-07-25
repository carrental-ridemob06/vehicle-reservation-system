import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '../../../lib/googleAuth'
import { supabase } from '../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, vehicleId, startDate, endDate } = body

    console.log('🔵 Confirm API Called:', { userId, vehicleId, startDate, endDate })

    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    }

    const calendarId = calendarMap[vehicleId]
    if (!calendarId) {
      return NextResponse.json({ message: '無効な車両IDです' }, { status: 400 })
    }

    const accessToken = await getAccessToken()
    console.log('🔑 GOOGLE AccessToken:', accessToken)

    // ✅ Googleカレンダーにイベント作成
    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: `Reservation for ${vehicleId}`,
          start: { date: startDate },
          end: { date: endDate },
        }),
      }
    )

    const eventData = await eventRes.json()

    if (!eventRes.ok || !eventData.id) {
      console.error('🚫 Google Calendar イベント作成失敗:', eventRes.status, eventData)
      return NextResponse.json(
        { message: 'Googleカレンダーへの登録に失敗しました' },
        { status: 500 }
      )
    }

    const calendarEventId = eventData.id
    console.log('📜 Google Calendar Event Created:', calendarEventId)

    const days =
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) || 1

    // ✅ Supabaseに挿入
    const { data, error } = await supabase
      .from('carrental')
      .insert([
        {
          user_id: userId,
          vehicle_id: vehicleId,
          calendar_event_id: calendarEventId,
          start_date: startDate,
          end_date: endDate,
          planId: `${days}泊`,
          status: 'confirmed',
        },
      ])
      .select()

    if (error || !data || data.length === 0) {
      console.error('🚫 Supabase Insert Error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ message: 'DB保存に失敗しました' }, { status: 500 })
    }

    const reservationId = data[0].id
    console.log('✅ Supabase Reservation ID:', reservationId)

    // ✅ Google Sheetsへ書き込み（任意）
    if (process.env.GOOGLE_SHEETS_ID) {
      console.log('🟢 Sheets書き込みを開始します...')

      const sheetsURL = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`

      const sheetPayload = {
        values: [
          [
            reservationId,
            userId,
            vehicleId,
            calendarEventId,
            startDate,
            endDate,
            `${days}泊`,
            'confirmed',
            new Date().toISOString(),
          ],
        ],
      }

      const sheetsRes = await fetch(sheetsURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(sheetPayload),
      })

      const sheetsData = await sheetsRes.json()

      if (sheetsRes.ok) {
        console.log('✅ Sheets Append 成功:', JSON.stringify(sheetsData, null, 2))
      } else {
        console.error('🚫 Sheets Append エラー:', sheetsRes.status, sheetsRes.statusText)
        console.error('📄 エラー内容:', JSON.stringify(sheetsData, null, 2))
      }
    } else {
      console.log('⚠️ Sheets IDが未設定のため、スキップしました')
    }

    return NextResponse.json({
      reservation_id: reservationId,
      message: '予約が確定しました！',
    })
  } catch (err) {
    console.error('🔥 Confirm Reservation Error:', err)
    return NextResponse.json({ message: 'サーバーエラー' }, { status: 500 })
  }
}
