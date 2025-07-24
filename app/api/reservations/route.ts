// app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'  // ✅ 共通クライアントに置き換え
import { getAccessToken } from '@/lib/googleAuth'

// GoogleカレンダーIDを車両ごとに切り替えるマッピング
const calendarMap: Record<string, string> = {
  car01: process.env.NEXT_PUBLIC_CAR01_CALENDAR_ID || '',
  car02: process.env.NEXT_PUBLIC_CAR02_CALENDAR_ID || '',
  car03: process.env.NEXT_PUBLIC_CAR03_CALENDAR_ID || '',
}

export async function POST(req: NextRequest) {
  try {
    const { date, time, vehicle_id } = await req.json()

    // Supabaseへの保存
    const { data, error } = await supabaseAdmin.from('reservations').insert([
      {
        vehicle_id,
        start_date: date,
        end_date: date,
        status: 'reserved',
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Google Calendar にも予約を登録
    const calendarId = calendarMap[vehicle_id] || calendarMap.car01
    const accessToken = await getAccessToken()

    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: '車両予約',
          description: `予約内容: ${vehicle_id}`,
          start: {
            dateTime: `${date}T${time}:00+09:00`,
            timeZone: 'Asia/Tokyo',
          },
          end: {
            dateTime: `${date}T${parseInt(time) + 1}:00+09:00`,
            timeZone: 'Asia/Tokyo',
          },
        }),
      }
    )

    const eventJson = await eventRes.json()
    if (!eventRes.ok) {
      console.error('❌ Google Calendar error:', eventJson)
      return NextResponse.json({ error: 'カレンダー登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ result: 'success', data })

  } catch (err) {
    console.error('❌ Unknown error:', err)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
