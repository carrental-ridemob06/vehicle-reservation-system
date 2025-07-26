'use client'

import { useSearchParams } from 'next/navigation'
import CalendarUi from './components/CalendarUi'

export default function HomePage() {
  const searchParams = useSearchParams()

  // ✅ URL の ?user= を取得（なければ null）
  const userId = searchParams.get('user') || ''

  return (
    <main>
      {/* ✅ userId を明示的に渡す */}
      <CalendarUi userId={userId} />
    </main>
  )
}
