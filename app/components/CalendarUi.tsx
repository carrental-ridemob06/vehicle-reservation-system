'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

type Props = {
  userId: string
}

export default function CalendarUi({ userId }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const defaultVehicleId = searchParams.get('vehicle_id') ?? 'car01'
  const [vehicleId, setVehicleId] = useState(defaultVehicleId)

  const calendarMap: Record<string, string> = {
    car01: process.env.NEXT_PUBLIC_CAR01_CALENDAR_ID || 'car01_calendar_id@group.calendar.google.com',
    car02: process.env.NEXT_PUBLIC_CAR02_CALENDAR_ID || 'car02_calendar_id@group.calendar.google.com',
    car03: process.env.NEXT_PUBLIC_CAR03_CALENDAR_ID || 'car03_calendar_id@group.calendar.google.com',
  }

  const calendarId = calendarMap[vehicleId] || calendarMap['car01']

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [nights, setNights] = useState(0)

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      setNights(diff >= 0 ? diff : 0)
    } else {
      setNights(0)
    }
  }, [startDate, endDate])

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    setVehicleId(newId)
    router.replace(`?vehicle_id=${newId}`)
  }

  const handleReserve = async () => {
    if (!startDate || !endDate) {
      alert('開始日と終了日を選択してください。')
      return
    }
    if (nights <= 0) {
      alert('終了日は開始日以降を選んでください。')
      return
    }

    const payload = {
      userId,         // ✅ 追加
      vehicleId,
      startDate,
      endDate,
    }

    try {
      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('✅ Check Availability Response:', data)

      if (!res.ok) {
        alert(`❌ 予約不可: ${data.message}`)
        return
      }

      alert('✅ 空きあり！ 予約確定します')

      const confirmRes = await fetch('/api/confirm-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const confirmData = await confirmRes.json()
      console.log('✅ Confirm Reservation Response:', confirmData)

      if (confirmRes.ok) {
        alert(`✅ 予約が確定しました！\n予約ID: ${confirmData.reservation_id}`)
        setStartDate('')
        setEndDate('')
        setNights(0)
      } else {
        alert(`❌ 予約確定エラー: ${confirmData.message}`)
      }

    } catch (err) {
      console.error('⚡ ネットワークエラー:', err)
      alert('ネットワークエラーが発生しました')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-indigo-100 px-4">
      <main className="w-full max-w-2xl mx-auto px-6 py-10 bg-white rounded-2xl shadow-xl border border-gray-200">
        <h1 className="text-3xl font-extrabold text-center text-blue-800 mb-8">🚗 車両予約カレンダー</h1>

        {/* 車両選択 */}
        <div className="mb-6">
          <label className="block mb-2 text-lg font-semibold text-gray-700">車両を選択:</label>
          <select
            value={vehicleId}
            onChange={handleVehicleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="car01">car01</option>
            <option value="car02">car02</option>
            <option value="car03">car03</option>
          </select>
        </div>

        {/* カレンダー埋め込み */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-10">
          <iframe
            src={`https://calendar.google.com/calendar/embed?src=${calendarId}&ctz=Asia%2FTokyo`}
            className="w-full h-[500px] border-0"
          />
        </div>

        {/* 予約日付・泊数 */}
        <div className="space-y-6">
          <div>
            <label className="block text-base mb-2 font-semibold text-gray-700">開始日:</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-base mb-2 font-semibold text-gray-700">終了日:</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="text-base text-gray-700">
            泊数: <strong className="text-blue-700">{nights}</strong> 泊
          </div>

          {/* 予約ボタン */}
          <button
            onClick={handleReserve}
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white text-lg py-4 rounded-xl font-bold shadow-md"
          >
            📝 この車を予約する
          </button>
        </div>
      </main>
    </div>
  )
}
