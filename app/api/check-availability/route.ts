import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/googleAuth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vehicleId, startDate, endDate } = body

    console.log('🚗 可用性チェックリクエスト:', { vehicleId, startDate, endDate })

    // 🔍 カレンダーIDマッピング（環境変数のチェックも含む）
    const calendarMap: Record<string, string> = {
      car01: process.env.NEXT_PUBLIC_CAR01_CALENDAR_ID ?? '',
      car02: process.env.NEXT_PUBLIC_CAR02_CALENDAR_ID ?? '',
      car03: process.env.NEXT_PUBLIC_CAR03_CALENDAR_ID ?? '',
    }

    console.log('📦 カレンダーIDマップ:', calendarMap)

    const calendarId = calendarMap[vehicleId]

    if (!calendarId || calendarId.trim() === '') {
      console.error('❌ 無効な vehicleId または カレンダーID未設定:', vehicleId)
      return NextResponse.json(
        { message: `Invalid vehicleId: ${vehicleId}` },
        { status: 400 }
      )
    }

    console.log('📅 使用するカレンダーID:', calendarId)

    // 🔐 Google アクセストークン取得
    const accessToken = await getAccessToken()
    if (!accessToken) {
      console.error('❌ アクセストークン取得失敗')
      return NextResponse.json(
        { message: 'アクセストークンの取得に失敗しました' },
        { status: 500 }
      )
    }

    console.log('🔑 アクセストークン取得成功')

    // 📡 Google Calendar FreeBusy API 呼び出し
    const freeBusyRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: `${startDate}T00:00:00+09:00`,
        timeMax: `${endDate}T23:59:59+09:00`,
        timeZone: 'Asia/Tokyo',
        items: [{ id: calendarId }],
      }),
    })

    const freeBusyData = await freeBusyRes.json()
    console.log('📝 FreeBusy API 応答:', JSON.stringify(freeBusyData, null, 2))

    if (!freeBusyData.calendars || !freeBusyData.calendars[calendarId]) {
      console.error('⚠️ カレンダー情報が応答に含まれていません:', freeBusyData)
      return NextResponse.json(
        { message: 'Google API応答にカレンダー情報が見つかりません' },
        { status: 500 }
      )
    }

    const busySlots = freeBusyData.calendars[calendarId].busy || []
    console.log('📆 忙しい時間帯:', busySlots)

    if (busySlots.length > 0) {
      console.warn('🚫 忙しい時間帯が存在するため予約不可')
      return NextResponse.json(
        { message: '指定期間はすでに予約されています。', busy: busySlots },
        { status: 409 }
      )
    }

    console.log('✅ 空きあり → 予約可能')
    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('🔥 サーバー処理エラー:', error)
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', detail: String(error) },
      { status: 500 }
    )
  }
}
