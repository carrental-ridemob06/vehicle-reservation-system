import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAccessToken } from '../../../lib/googleAuth'
import { carConfig } from '../../../lib/carConfig'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { vehicleId, startDate, endDate, colorId, title } = await req.json()

    // ✅ カレンダーIDマップ
    const calendarMap = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    }

    const calendarId = calendarMap[vehicleId as keyof typeof calendarMap]
    if (!calendarId) {
      throw new Error('❌ カレンダーIDが見つかりません')
    }

    // 🔐 Google OAuth 認証を取得
    const auth = await getAccessToken()
    const calendar = google.calendar({ version: 'v3', auth })

    // ✅ 車ごとの設定
    const carDefaults = carConfig[vehicleId as keyof typeof carConfig] || { default_color: '8', default_title: '🚘 未設定車両' }
    const eventTitle = title || `【管理者追加】${carDefaults.default_title}`
    const eventColor = colorId || carDefaults.default_color

    // ✅ 終了日 +1日（Google Calendar 仕様）
    const endDateObj = new Date(endDate)
    endDateObj.setDate(endDateObj.getDate() + 1)
    const adjustedEndDate = endDateObj.toISOString().split('T')[0]

    // ✅ Google Calendar 登録
    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: eventTitle,
        start: { date: startDate },
        end: { date: adjustedEndDate },
        colorId: eventColor,
      },
    })

    // ✅ system_logs に記録
    await supabase.from('system_logs').insert([
      {
        action: 'admin_reservation_added',
        reservation_id: null,
        details: {
          vehicleId,
          startDate,
          endDate,
          title: eventTitle,
          colorId: eventColor,
        },
        created_at: new Date().toISOString(),
      }
    ])

    return NextResponse.json({
      result: 'success',
      event: {
        id: event.data.id,
        summary: event.data.summary,
        start: event.data.start,
        end: event.data.end,
        colorId: event.data.colorId,
      }
    })

  } catch (error) {
    console.error('❌ Admin reservation error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
