'use client'

import { useSearchParams } from 'next/navigation'
import CalendarUi from './components/CalendarUi'

export default function HomePage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('user') ?? 'test-user-001'

  return (
    <main>
      <CalendarUi userId={userId} />
    </main>
  )
}
