import { google } from 'googleapis'

export async function getAccessToken(): Promise<string> {
  // ✅ Googleサービスアカウント認証設定
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

  // ✅ 認証クライアントを取得
  const client = await auth.getClient()

  // ✅ アクセストークンを取得
  const tokenResponse = await client.getAccessToken()

  if (!tokenResponse || !tokenResponse.token) {
    throw new Error('❌ Google APIのアクセストークンが取得できませんでした')
  }

  console.log('🔑 Google AccessToken 取得成功')
  return tokenResponse.token
}
