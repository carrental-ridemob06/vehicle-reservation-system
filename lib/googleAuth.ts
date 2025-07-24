import { google } from 'googleapis'

export async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  })

  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()

  console.log('🔑 GOOGLE AccessToken:', tokenResponse)

  if (!tokenResponse || !tokenResponse.token) {
    throw new Error('アクセストークンの取得に失敗しました')
  }

  return tokenResponse.token
}
