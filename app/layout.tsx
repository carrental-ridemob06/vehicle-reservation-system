// app/layout.tsx
import '../styles/globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: '🚗 車両予約システム',
  description: '簡単に車両予約ができるシステム',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* ✅ ブラウザタブやダイアログに出るタイトル */}
        <title>🚗 車両予約システム</title>
        <meta name="description" content="簡単に車両予約ができるシステム" />
      </head>
      <body>{children}</body>
    </html>
  )
}
