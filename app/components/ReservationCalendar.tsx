'use client'

import { useState } from 'react'
import { format } from 'date-fns'

export default function ReservationCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [timeSlot, setTimeSlot] = useState<string>('')

  const handleSubmit = async () => {
    if (!selectedDate || !timeSlot) return alert('日付と時間を選択してください')

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: timeSlot,
        vehicle_id: 'car01', // 必要に応じて変数化
      }),
    })

    const data = await response.json()
    console.log('✅ 予約送信完了:', data)
    alert('予約が完了しました！')
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg space-y-6 mt-6">
      <h2 className="text-xl font-semibold">🚗 車両予約カレンダー</h2>

      <input
        type="date"
        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
        onChange={(e) => setSelectedDate(new Date(e.target.value))}
        className="w-full border border-gray-300 rounded p-2"
      />

      <select
        value={timeSlot}
        onChange={(e) => setTimeSlot(e.target.value)}
        className="w-full border border-gray-300 rounded p-2"
      >
        <option value="">時間を選択</option>
        <option value="10:00">10:00〜</option>
        <option value="13:00">13:00〜</option>
        <option value="16:00">16:00〜</option>
      </select>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        この内容で予約する
      </button>
    </div>
  )
}