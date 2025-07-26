'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

// ✅ 切り出しコンポーネント
import VehicleSelect from '../components/VehicleSelect'
import NightsDisplay from '../components/NightsDisplay'

// ✅ Props
type Props = {
  userId: string;
}

export default function CalendarUi({ userId }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // ✅ URLから vehicle_id を取得（なければ ''）
  const defaultVehicleId = searchParams.get('vehicle_id') ?? ''
  const [vehicleId, setVehicleId] = useState(defaultVehicleId)

  // ✅ .env.local からカレンダーIDを取得
  const car01Id = process.env.NEXT_PUBLIC_CAR01_CALENDAR_ID
  const car02Id = process.env.NEXT_PUBLIC_CAR02_CALENDAR_ID
  const car03Id = process.env.NEXT_PUBLIC_CAR03_CALENDAR_ID

  // ✅ 3台まとめ用URL
  const allCarsCalendarUrl = `https://calendar.google.com/calendar/embed?src=${car01Id}&src=${car02Id}&src=${car03Id}&ctz=Asia%2FTokyo`

  // ✅ 個別カレンダー用マップ
  const calendarMap: Record<string, string> = {
    car01: car01Id!,
    car02: car02Id!,
    car03: car03Id!,
  }

  // ✅ 日付管理
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [nights, setNights] = useState(0)

  // ✅ 泊数計算
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

  // ✅ 車両変更
  const handleVehicleChange = (newId: string) => {
    setVehicleId(newId)
    router.replace(`?user=${userId}&vehicle_id=${newId}`)
  }

  // ✅ 予約処理
  const handleReserve = async () => {
    if (!userId) {
      alert('ログインしてください。')
      return
    }
    if (!startDate || !endDate) {
      alert('開始日と終了日を選択してください。')
      return
    }
    if (nights <= 0) {
      alert('終了日は開始日以降を選んでください。')
      return
    }

    const payload = { userId, vehicleId, startDate, endDate }

    try {
      console.log('🟡 Check Availability Payload:', payload)

      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('🟢 Check Availability Response:', data)

      if (!res.ok) {
        alert(`❌ 予約不可: ${data.message}`)
        return
      }

      // ✅ confirm を使いキャンセルできる
      const confirmBooking = window.confirm('✅ 空きあり！\nこのまま予約を確定しますか？')

      if (!confirmBooking) {
        alert('予約をキャンセルしました')
        return
      }

      const confirmRes = await fetch('/api/confirm-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const confirmData = await confirmRes.json()
      console.log('🟢 Confirm Reservation Response:', confirmData)

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
        <h2 className="text-3xl font-extrabold text-center text-blue-800 mb-8">
          🚙予約システム
        </h2>

        {/* 🚗 ドロップダウン */}
        <VehicleSelect vehicleId={vehicleId} onChange={handleVehicleChange} />

        {/* 📅 Googleカレンダー */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-10 mt-4">
          {vehicleId === '' ? (
            <iframe
              src={allCarsCalendarUrl}
              className="w-full border-0"
              style={{ height: '470px' }}
            />
          ) : (
            <iframe
              src={`https://calendar.google.com/calendar/embed?src=${calendarMap[vehicleId]}&ctz=Asia%2FTokyo`}
              className="w-full border-0"
              style={{ height: '350px' }}
            />
          )}
        </div>

       {/* 📆 日付入力 */}
<div style={{
  marginBottom: '24px',
  width: '100%',
  boxSizing: 'border-box'
}}>
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box'
  }}>
    {/* 🚗 未選択時メッセージ */}
    {vehicleId === '' && (
      <p style={{
        color: 'red',
        fontWeight: '700',
        fontSize: '16px',
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        🚗 まず車両を選択してください
      </p>
    )}

    {/* ✅ 開始日 */}
    <div style={{ width: '100%' }}>
      <label
        style={{
          display: 'block',
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#333'
        }}
      >
        📅 開始日
      </label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '20px',
          border: '2px solid #999',
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          backgroundColor: '#fff',
          boxSizing: 'border-box'
        }}
        disabled={vehicleId === ''}  // ✅ 車両未選択なら入力できないように
      />
    </div>

    {/* ✅ 終了日 */}
    <div style={{ width: '100%' }}>
      <label
        style={{
          display: 'block',
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#333'
        }}
      >
        📅 終了日
      </label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '20px',
          border: '2px solid #999',
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          backgroundColor: '#fff',
          boxSizing: 'border-box'
        }}
        disabled={vehicleId === ''}  // ✅ 車両未選択なら入力できないように
      />
    </div>
  </div>

  {/* 🌙 泊数 + 予約ボタン */}
<div style={{
  display: 'flex',
  flexDirection: 'column',   // ✅ 縦並びに変更
  alignItems: 'center',
  marginTop: '20px',
  gap: '12px'
}}>
  {/* ✅ 泊数表示 */}
  <div style={{
    fontSize: '18px',
    fontWeight: '600',
    padding: '10px 16px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    minWidth: '120px',
    textAlign: 'center'
  }}>
    泊数: {nights} 泊
  </div>

  {/* ✅ userId があるかでボタン切替 */}
  {userId && userId.trim() !== '' ? (
    <button
      onClick={handleReserve}
      style={{
        padding: '14px 24px',
        fontSize: '18px',
        fontWeight: '700',
        border: '2px solid #007BFF',
        borderRadius: '10px',
        backgroundColor: vehicleId === '' ? '#ccc' : '#007BFF',
        color: '#fff',
        cursor: vehicleId === '' ? 'not-allowed' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '280px',
        display: 'inline-block'
      }}
      disabled={vehicleId === ''}
    >
      🚆 この車を予約する
    </button>
  ) : (
    <button
      disabled
      style={{
        padding: '14px 24px',
        fontSize: '18px',
        fontWeight: '700',
        border: '2px solid #aaa',
        borderRadius: '10px',
        backgroundColor: '#ddd',
        color: '#666',
        width: '100%',
        maxWidth: '280px',
        display: 'inline-block',
        cursor: 'not-allowed'
      }}
    >
      🚆 この車を予約する
    </button>
      )}
    </div>
  </div> </main> </div>

 )     
}