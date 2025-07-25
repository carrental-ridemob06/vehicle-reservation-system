'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

// ✅ 切り出しコンポーネント
import VehicleSelect from '../components/VehicleSelect'
import NightsDisplay from '../components/NightsDisplay'

// ✅ ここでモーダルを import
import ConfirmModal from '../components/ConfirmModal'
import ResultModal from '../components/ResultModal'

type Props = {
  userId: string;
}

export default function CalendarUi({ userId }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // ✅ URLから vehicle_id を取得
  const defaultVehicleId = searchParams.get('vehicle_id') ?? ''
  const [vehicleId, setVehicleId] = useState(defaultVehicleId)

  // ✅ カレンダーID
  const car01Id = process.env.NEXT_PUBLIC_CAR01_CALENDAR_ID
  const car02Id = process.env.NEXT_PUBLIC_CAR02_CALENDAR_ID
  const car03Id = process.env.NEXT_PUBLIC_CAR03_CALENDAR_ID

  const allCarsCalendarUrl = `https://calendar.google.com/calendar/embed?src=${car01Id}&src=${car02Id}&src=${car03Id}&ctz=Asia%2FTokyo`

  const calendarMap: Record<string, string> = {
    car01: car01Id!,
    car02: car02Id!,
    car03: car03Id!,
  }
  const colorMap: Record<string, string> = {
  car01: '%23039be5', // 青
  car02: '%23ef6c00', // オレンジ
  car03: '%2333b679'  // 緑
};


  // ✅ 日付管理
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

  // ✅ モーダル管理
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalAction, setModalAction] = useState<(() => void) | null>(null)

  // ✅ 車両変更
  const handleVehicleChange = (newId: string) => {
    setVehicleId(newId)
    router.replace(`?user=${userId}&vehicle_id=${newId}`)
  }

  // ✅ 予約処理
  const handleReserve = async () => {
    if (!userId) {
      setModalMessage('❌ ログインしてください。')
      setModalAction(null)
      setResultModalOpen(true)
      return
    }
    if (!startDate || !endDate) {
      setModalMessage('📅 開始日と終了日を選択してください。')
      setModalAction(null)
      setResultModalOpen(true)
      return
    }
    if (nights <= 0) {
      setModalMessage('⚠️ 終了日は開始日以降を選んでください。')
      setModalAction(null)
      setResultModalOpen(true)
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
        setModalMessage(`❌ 予約不可: ${data.message}`)
        setModalAction(null)
        setResultModalOpen(true)
        return
      }

      // ✅ 確認モーダルを開く
      setModalMessage('✅ 空きあり！ このまま予約を確定しますか？')
      setModalAction(() => async () => {
        const confirmRes = await fetch('/api/confirm-reservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const confirmData = await confirmRes.json()
        console.log('🟢 Confirm Reservation Response:', confirmData)

        if (confirmRes.ok) {
          setModalMessage(`✅ 予約が確定しました！\n予約ID: ${confirmData.reservation_id}`)
          setResultModalOpen(true)
          setStartDate('')
          setEndDate('')
          setNights(0)
        } else {
          setModalMessage(`❌ 予約確定エラー: ${confirmData.message}`)
          setResultModalOpen(true)
        }
        setConfirmModalOpen(false)
      })
      setConfirmModalOpen(true)
    } catch (err) {
      console.error('⚡ ネットワークエラー:', err)
      setModalMessage('⚡ ネットワークエラーが発生しました')
      setModalAction(null)
      setResultModalOpen(true)
    }
  }

  return (
  <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', background: 'linear-gradient(to bottom, #e6f0ff, #f5f5ff)', padding: '16px' }}>
    <main style={{
      width: '100%',
      maxWidth: '500px',
      background: '#fff',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      border: '1px solid #ccc'
    }}>
      <h2 style={{ fontSize: '28px', textAlign: 'center', marginBottom: '20px', color: '#003366' }}>🚙予約システム</h2>

      {/* 🚗 ドロップダウン */}
      <VehicleSelect vehicleId={vehicleId} onChange={handleVehicleChange} />

      {/* 🚗 未選択メッセージ */}
      {vehicleId === '' && (
        <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', marginTop: '8px' }}>
          🚗 まず車両を選択してください
        </p>
      )}

      {/* 📅 Googleカレンダー（✅ グレーアウトしない） */}
      
      <div
  style={{
    margin: '16px 0',
    borderRadius: '12px',
    overflow: 'hidden'
  }}
>
  <div
  style={{
    margin: '16px 0',
    borderRadius: '12px',
    overflow: 'hidden'
  }}
>
  {vehicleId === '' ? (
    // ✅ 全カレンダーまとめて表示（最新版 iframe URL に差し替え）
    <iframe
      src="https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=Asia%2FTokyo&showPrint=0&title=%E3%83%AC%E3%83%B3%E3%82%BF%E3%82%AB%E3%83%BC&showTz=0&showTitle=0&src=Y2FycmVudGFsLnJpZGVtb2IwNkBnbWFpbC5jb20&src=M2RkNjNjZDliZmE4MmMyMDNmYWI2NTg1ZmU5NmZjODFhMDAyOTZhMmY5YTljZjFmZGIxNjJiNmQzYTc3NGYxM0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ODY5ZTcwMzg5ZDc4NGViNmQ5ZDllMzE4NmUyNzQxY2E2NzQ5MGY4ZmY4Nzc1YjhlOTY2NTExZjc4NDExNjY4NkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ZTIyZTBiMGI2NGQ4MjQxY2EwZThlODMzNWQ1YzQwZjY4NTYwMzdmZGZiNzFiN2E1ZWI4YmJiNTNlMjM5NjA5OUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=amEuamFwYW5lc2UjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%23009688&color=%23039be5&color=%23ef6c00&color=%2333b679&color=%23e4c441"
      style={{ width: '100%', height: '470px', border: 'none' }}
    />
  ) : (
    // ✅ 単体カレンダー表示（車ごとに違う色）
    <iframe
      src={`https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=Asia%2FTokyo&showPrint=0&showTz=0&showTitle=0&src=${calendarMap[vehicleId]}&color=${colorMap[vehicleId]}`}
      style={{ width: '100%', height: '350px', border: 'none' }}
    />
  )}
</div></div>



      {/* 📆 日付入力（✅ 未選択時はグレーアウト＆入力不可） */}
<div style={{ marginBottom: '20px', opacity: vehicleId === '' ? 0.5 : 1 }}>
  <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>📅 開始日</label>
  <input
    type="date"
    value={startDate}
    min={(() => {
      // ✅ 今日 + 2日後（翌々日）以降しか選べない
      const today = new Date();
      today.setDate(today.getDate() + 2);
      return today.toISOString().split('T')[0];
    })()}
    onChange={(e) => setStartDate(e.target.value)}
    disabled={vehicleId === ''}   // ✅ 車両未選択なら入力不可
    style={{
      width: '100%',
      padding: '12px',
      fontSize: '18px',
      border: '2px solid #999',
      borderRadius: '8px',
      marginBottom: '12px'
    }}
  />

  <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>📅 終了日</label>
  <input
    type="date"
    value={endDate}
    min={startDate ? (() => {
      // ✅ 開始日の翌日から
      const minDate = new Date(startDate);
      minDate.setDate(minDate.getDate() + 1);
      return minDate.toISOString().split('T')[0];
    })() : ''}
    max={startDate ? (() => {
      // ✅ 開始日から4日後まで（最大4泊）
      const maxDate = new Date(startDate);
      maxDate.setDate(maxDate.getDate() + 4);
      return maxDate.toISOString().split('T')[0];
    })() : ''}
    onChange={(e) => setEndDate(e.target.value)}
    disabled={vehicleId === ''}   // ✅ 車両未選択なら入力不可
    style={{
      width: '100%',
      padding: '12px',
      fontSize: '18px',
      border: '2px solid #999',
      borderRadius: '8px'
    }}
  />
</div>


      {/* 🌙 泊数 */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        泊数: {nights} 泊
      </div>

      {/* 🚆 予約ボタン（✅ 未選択時はグレーアウト＆無効化） */}
      <button
        onClick={handleReserve}
        disabled={vehicleId === ''}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#fff',
          background: vehicleId === '' ? '#aaa' : '#007bff',
          border: 'none',
          borderRadius: '8px',
          cursor: vehicleId === '' ? 'not-allowed' : 'pointer',
          opacity: vehicleId === '' ? 0.7 : 1
        }}
      >
        🚆 この車を予約する
      </button>
    </main>
  

  

      {/* ✅ 予約確認モーダル */}
<ConfirmModal
  isOpen={confirmModalOpen}
  title="予約確認"
  message={modalMessage}
  onConfirm={() => { if (modalAction) modalAction() }}
  onCancel={() => setConfirmModalOpen(false)}
  confirmText="予約する"
  cancelText="やめる"
/>

{/* ✅ 結果モーダル */}
<ResultModal
  isOpen={resultModalOpen}
  title="予約結果"
  message={modalMessage}
  onClose={() => setResultModalOpen(false)}
  confirmText="OK"
/>
</div>
)}