import { google, Auth } from 'googleapis'

export async function getAccessToken(): Promise<Auth.OAuth2Client> {
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

  // ✅ OAuth2クライアントを取得（型を明示）
  const client = (await auth.getClient()) as Auth.OAuth2Client

  console.log('✅ GoogleAuth クライアント作成成功')

  return client
}
