'use client'

import { useSearchParams } from 'next/navigation'
import CalendarUi from './components/CalendarUi'

export default function HomePage() {
  return (
    <main>
      <CalendarUi />
    </main>
  )
}
