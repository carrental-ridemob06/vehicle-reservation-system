// app/api/createReservation/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId, vehicleId, calendarId, startDate, endDate } = await req.json()
    console.log('💡 Request Body:', { userId, vehicleId, calendarId, startDate, endDate })

    // ============================
    // Google 認証
    // ============================
    const { google } = require('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials: {
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    })

    const calendar = google.calendar({ version: 'v3', auth })

    // ============================
    // FreeBusy チェック
    // ============================
    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: `${endDate}T23:59:59Z`,
        items: [{ id: calendarId }],
      },
    })

    console.log('✅ FreeBusy:', JSON.stringify(freebusy.data, null, 2))

    const busy = freebusy.data.calendars?.[calendarId]?.busy || []
    if (busy.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is not available', busy },
        { status: 409 }
      )
    }

    // ============================
    // Google Calendar に予定作成
    // ============================
    const eventRes = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Reservation for ${userId}`,
        start: { date: startDate },
        end: { date: endDate },
      },
    })

    const calendarEventId = eventRes.data.id
    console.log('✅ Created Calendar Event ID:', calendarEventId)

    // ============================
    // Supabase Insert（サービスロールキー使用）
    // ============================
    console.log('💡 SUPABASE_URL:', process.env.SUPABASE_URL)
    console.log('💡 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY)

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // ← サービスロールでRLSをバイパス
    )

    const { data: insertData, error: insertError } = await supabase
      .from('carrental')
      .insert([{
        user_id: userId,
        vehicle_id: vehicleId,
        calendar_event_id: calendarEventId,
        start_date: startDate,
        end_date: endDate,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      }])
      .select()

    console.log('✅ Supabase Insert Data:', insertData)
    if (insertError || !insertData || insertData.length === 0) {
      console.error('❌ Supabase Insert Error:', insertError)

      // ロールバック：カレンダーから削除
      try {
        await calendar.events.delete({ calendarId, eventId: calendarEventId })
        console.log('✅ Calendar rollback success')
      } catch (err) {
        console.error('❌ Calendar rollback failed:', err)
      }

      throw insertError ?? new Error('Supabase insert returned no data.')
    }

    // ============================
    // Google Sheets に行追加
    // ============================
    const sheets = google.sheets({ version: 'v4', auth })

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Sheet1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              insertData[0].id,
              userId,
              vehicleId,
              startDate,
              endDate,
              'confirmed',
              new Date().toISOString(),
            ],
          ],
        },
      })
      console.log('✅ Sheets Append Success')
    } catch (sheetsErr) {
      console.error('❌ Sheets Append Error:', sheetsErr)

      // ロールバック：カレンダー & Supabase
      try {
        await calendar.events.delete({ calendarId, eventId: calendarEventId })
        console.log('✅ Calendar rollback success')
      } catch (err) {
        console.error('❌ Calendar rollback failed:', err)
      }
      try {
        await supabase.from('carrental').delete().eq('id', insertData[0].id)
        console.log('✅ Supabase rollback success')
      } catch (err) {
        console.error('❌ Supabase rollback failed:', err)
      }

      throw sheetsErr
    }

    // ============================
    // 成功レスポンス
    // ============================
    return NextResponse.json({
      message: 'Reservation created successfully!',
      calendarEventId,
      reservationId: insertData[0].id,
    })
  } catch (error) {
    console.error('❌ createReservation error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
