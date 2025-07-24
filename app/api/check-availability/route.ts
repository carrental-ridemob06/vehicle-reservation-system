import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '../../../lib/googleAuth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vehicleId, startDate, endDate } = body

    console.log('🔵 可用性API Called:', { vehicleId, startDate, endDate })

    // ✅ .env からカレンダーIDを読み込む
    const calendarMap: Record<string, string> = {
      car01: process.env.CAR01_CALENDAR_ID!,
      car02: process.env.CAR02_CALENDAR_ID!,
      car03: process.env.CAR03_CALENDAR_ID!,
    }

    const calendarId = calendarMap[vehicleId]

    if (!calendarId) {
      console.error('🚫 Invalid vehicleId:', vehicleId)
      return NextResponse.json(
        { message: `Invalid vehicleId: ${vehicleId}` },
        { status: 400 }
      )
    }

    console.log('🗂️ 使用する calendarId:', calendarId)

    // ✅ サービスアカウントでアクセストークン取得
    const accessToken = await getAccessToken()
    console.log('🔑 取得した AccessToken:', accessToken)

    // ✅ FreeBusy API 呼び出し
    const freeBusyRes = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          timeMin: `${startDate}T00:00:00Z`,
          timeMax: `${endDate}T23:59:59Z`,
          items: [{ id: calendarId }],
        }),
      }
    )

    const freeBusyData = await freeBusyRes.json()
    console.log('📜 FreeBusy API Response:', JSON.stringify(freeBusyData, null, 2))

    if (!freeBusyData.calendars || !freeBusyData.calendars[calendarId]) {
      console.error('🚫 カレンダーIDが結果に含まれていません:', calendarId)
      return NextResponse.json(
        { message: `Google APIで指定カレンダーが見つかりません: ${calendarId}` },
        { status: 500 }
      )
    }

    const busy = freeBusyData.calendars[calendarId].busy || []
    console.log('📅 Busy Slots:', busy)

    if (busy.length > 0) {
      return NextResponse.json(
        { message: '指定期間はすでに予約されています。' },
        { status: 400 }
      )
    }

    console.log('✅ 予約可能！空き枠あり')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('🔥 FreeBusy API Error:', err)
    return NextResponse.json(
      { message: 'サーバーエラー' },
      { status: 500 }
    )
  }
}
