import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getAccessToken } from '@/lib/googleAuth'

const calendarMap: Record<string, string> = {
  car01: process.env.NEXT_PUBLIC_CAR01_CALENDAR_ID || '',
  car02: process.env.NEXT_PUBLIC_CAR02_CALENDAR_ID || '',
  car03: process.env.NEXT_PUBLIC_CAR03_CALENDAR_ID || '',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      date,
      time,
      vehicle_id,
      plan_type,             // same_day / 1n / 2n / 3n / 4n
      option_child_seat,     // true/false
      option_insurance       // true/false
    } = body

    console.log('📥 受信データ:', body)

    /**
     * 🚗 1. 車両データ取得（Supabase vehiclesテーブル）
     */
    const { data: car, error: carError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('car_no', vehicle_id)
      .single()

    if (carError || !car) {
      console.error('❌ 車両データ取得エラー:', carError)
      return NextResponse.json({ error: '車両データが見つかりません' }, { status: 400 })
    }

    /**
     * 📆 2. 日数計算
     * - same_day は 1日
     * - 1n = 2日, 2n = 3日 ...
     */
    let days = 1
    let plan_price = 0

    switch (plan_type) {
      case 'same_day':
        days = 1
        plan_price = car.price_same_day
        break
      case '1n':
        days = 2
        plan_price = car.price_1n
        break
      case '2n':
        days = 3
        plan_price = car.price_2n
        break
      case '3n':
        days = 4
        plan_price = car.price_3n
        break
      case '4n':
        days = 5
        plan_price = car.price_4n
        break
      default:
        return NextResponse.json({ error: '不正なプランが指定されました' }, { status: 400 })
    }

    /**
     * 💰 3. オプション料金計算
     */
    const option_price_child_seat = option_child_seat ? car.option_price_1 * days : 0
    const option_price_insurance = option_insurance ? car.option_price_2 * days : 0

    /**
     * 💰 4. 合計金額
     */
    const total_price = plan_price + option_price_child_seat + option_price_insurance

    /**
     * 📝 5. reservationsテーブルにINSERT
     * - 価格・車両情報をすべて保存
     */
    const { data, error } = await supabaseAdmin.from('reservations').insert([
      {
        vehicle_id,
        car_name: car.name,
        rank: car.rank,
        number_plate: car.number_plate,
        start_date: date,
        end_date: date,
        plan_id: plan_type,
        plan_price,
        option_child_seat,
        option_insurance,
        option_price_child_seat,
        option_price_insurance,
        total_price,
        status: 'reserved',
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    /**
     * 📅 6. Googleカレンダー登録
     */
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
          summary: `車両予約 (${plan_type})`,
          description: `予約内容: ${vehicle_id}\nプラン: ${plan_type}\n合計金額: ${total_price}円`,
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
    console.log('📅 カレンダー登録結果:', eventJson)

    if (!eventRes.ok) {
      console.error('❌ Google Calendar error:', eventJson)
      return NextResponse.json({ error: 'カレンダー登録に失敗しました' }, { status: 500 })
    }

    /**
     * ✅ 7. 成功レスポンス
     */
    return NextResponse.json({
      result: 'success',
      reservation: data,
      calendar_event: eventJson,
      total_price,
    })
  } catch (err) {
    console.error('❌ Unknown error:', err)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
