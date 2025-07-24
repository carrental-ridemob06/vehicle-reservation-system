import { NextRequest, NextResponse } from 'next/server';

// 必要: googleapis, google-auth-library などで認証を用意しておく

export async function POST(req: NextRequest) {
  try {
    const { calendarId, startDate, endDate } = await req.json();

    // Google API クライアントを初期化（サービスアカウントを使う）
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // FreeBusy API で空き状況確認
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: `${endDate}T23:59:59Z`,
        items: [{ id: calendarId }],
      },
    });

    const busy = res.data.calendars?.[calendarId]?.busy || [];
    const isAvailable = busy.length === 0;

    return NextResponse.json({ isAvailable, busy });

  } catch (error) {
    console.error('checkAvailability error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
