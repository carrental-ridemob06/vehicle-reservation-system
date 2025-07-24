import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/googleAuth' // パスは環境に合わせて調整

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vehicleId, startDate, endDate } = body

    console.log('🚗 可用性チェックリクエスト:', { vehicleId, startDate, endDate })

    // 車両ごとの Google カレンダーIDマッピング
    const calendarMap: Record<string, string> = {
      car01: process.env.NEXT_PUBLIC_CAR01_CALENDAR_ID!,
      car02: process.env.NEXT_PUBLIC_CAR02_CALENDAR_ID!,
      car03: process.env.NEXT_PUBLIC_CAR03_CALENDAR_ID!,
    }

    const calendarId = calendarMap[vehicleId]
    if (!calendarId) {
      console.error('❌ 無効な vehicleId:', vehicleId)
      return NextResponse.json({ message: `Invalid vehicleId: ${vehicleId}` }, { status: 400 })
    }

    console.log('📅 使用カレンダーID:', calendarId)

    // サービスアカウントからアクセストークンを取得
    const accessToken = await getAccessToken()
    console.log('🔑 アクセストークン取得成功')

    // FreeBusy API で空き状況を確認
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
    console.log('📝 FreeBusyレスポンス:', JSON.stringify(freeBusyData, null, 2))

    if (!freeBusyData.calendars || !freeBusyData.calendars[calendarId]) {
      console.error('⚠️ FreeBusyにカレンダー情報が見つかりません')
      return NextResponse.json({ message: 'Google API応答にカレンダーが見つかりません' }, { status: 500 })
    }

    const busySlots = freeBusyData.calendars[calendarId].busy || []
    console.log('📆 忙しい時間帯:', busySlots)

    if (busySlots.length > 0) {
      return NextResponse.json({ message: '指定期間はすでに予約されています。' }, { status: 409 })
    }

    console.log('✅ 予約可能です！')
    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('🔥 予期せぬエラー:', error)
    return NextResponse.json({ message: 'サーバーエラー', detail: String(error) }, { status: 500 })
  }
}
