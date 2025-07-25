import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '../../../lib/googleAuth'
import { supabase } from '../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vehicleId, startDate, endDate } = body

    console.log('🔵 Confirm API Called:', { vehicleId, startDate, endDate })

    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    }

    const calendarId = calendarMap[vehicleId]
    const accessToken = await getAccessToken()

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
    const calendarEventId = eventData.id

    // ✨ 泊数から plan_id を自動生成
    const start = new Date(startDate)
    const end = new Date(endDate)
    const durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const planId = `${durationDays}泊`

    const { data, error } = await supabase
      .from('carrental')
      .insert([
        {
          user_id: 'test-user-001',
          vehicle_id: vehicleId,
          calendar_event_id: calendarEventId,
          start_date: startDate,
          end_date: endDate,
          plan_id: planId,
          status: 'confirmed',
        },
      ])
      .select()

    if (error || !data || data.length === 0) {
      return NextResponse.json({ message: 'DB保存に失敗しました' }, { status: 500 })
    }

    const reservationId = data[0].id

    if (process.env.GOOGLE_SHEETS_ID) {
      const sheetsURL = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`

      const sheetPayload = {
        values: [
          [
            reservationId,
            'test-user-001',
            vehicleId,
            calendarEventId,
            startDate,
            endDate,
            planId,
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

      if (!sheetsRes.ok) {
        const sheetsData = await sheetsRes.json()
        console.error('🚫 Sheets Append エラー:', sheetsRes.status, sheetsRes.statusText)
        console.error('📄 エラー内容:', JSON.stringify(sheetsData, null, 2))
      }
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
