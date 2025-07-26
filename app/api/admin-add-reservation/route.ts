import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAccessToken } from '../../../lib/googleAuth'
import { carConfig } from '../../../lib/carConfig'

export async function POST(req: Request) {
  try {
    const { vehicleId, startDate, endDate, colorId, title } = await req.json()

    // ✅ 車ごとのカレンダーIDマップ
    const calendarMap = {
      car01: process.env.CAR01_CALENDAR_ID,
      car02: process.env.CAR02_CALENDAR_ID,
      car03: process.env.CAR03_CALENDAR_ID,
    }

    // ✅ 車ごとにカレンダーIDを自動選択
    const calendarId = calendarMap[vehicleId as keyof typeof calendarMap]
    if (!calendarId) {
      throw new Error('❌ カレンダーIDが見つかりません')
    }

    // 🔐 Google OAuth 認証を取得
    const auth = await getAccessToken()
    const calendar = google.calendar({ version: 'v3', auth })

    // ✅ 車ごとの基本設定を読み込み
    const carDefaults = carConfig[vehicleId as keyof typeof carConfig] || { default_color: '8', default_title: '🚘 未設定車両' }

    // ✅ タイトル＆色を決定（入力があれば上書き）
    const eventTitle = title || `【管理者追加】${carDefaults.default_title}`
    const eventColor = colorId || carDefaults.default_color

    // ✅ 終了日を +1日する（Google Calendar の仕様対応）
    const endDateObj = new Date(endDate)
    endDateObj.setDate(endDateObj.getDate() + 1)
    const adjustedEndDate = endDateObj.toISOString().split('T')[0] // YYYY-MM-DD形式

    // ✅ Google Calendar に予約登録
    const event = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: {
        summary: eventTitle,
        start: { date: startDate },
        end: { date: adjustedEndDate },  // ✅ +1日した終了日
        colorId: eventColor,
      },
    })

    return NextResponse.json({ result: 'success', event: event.data })
  } catch (error) {
    console.error('❌ Admin reservation error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
