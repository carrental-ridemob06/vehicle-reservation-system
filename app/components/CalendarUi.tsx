'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

// ✅ 切り出しコンポーネント
import VehicleSelect from '../components/VehicleSelect'
import NightsDisplay from '../components/NightsDisplay'
import DatePicker from '../components/DatePicker'
// ✅ モーダル import
import ConfirmModal from '../components/ConfirmModal'
import ResultModal from '../components/ResultModal'

type Props = {
  userId: string;
}

// ✅ ランダムID生成関数（小文字英数字8桁）
function generateReservationId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((n) => chars[n % chars.length])
    .join('');
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

  const calendarMap: Record<string, string> = {
    car01: car01Id!,
    car02: car02Id!,
    car03: car03Id!,
  }
  const colorMap: Record<string, string> = {
    car01: '%23039be5',
    car02: '%23ef6c00',
    car03: '%2333b679'
  }

  // ✅ 日付管理
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [nights, setNights] = useState(0)

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      // ✅ 同日予約 → 0泊表示
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

  // ✅ オプション管理
  const [childSeat, setChildSeat] = useState(false)
  const [insurance, setInsurance] = useState(false)

  // ✅ 予約ID（予約完了後だけ生成）
  const [reservationId, setReservationId] = useState('');

  // ✅ 予約IDをコピーする関数
  const copyReservationId = () => {
    navigator.clipboard.writeText(reservationId);
    alert('✅ 予約番号をコピーしました: ' + reservationId);
  };

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

    // ✅ 【JS側チェック】前日予約禁止
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // 翌日まで禁止
    const selectedStart = new Date(startDate);
    if (selectedStart <= tomorrow) {
      setModalMessage('⚠️ 前日予約はできません。翌日以降を選択してください。');
      setModalAction(null)
      setResultModalOpen(true);
      return;
    }

    try {
      // ✅ まず空き確認
      const payload = { 
        userId, 
        vehicleId, 
        startDate, 
        endDate,
        option_child_seat: childSeat,
        option_insurance: insurance
      }
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

      // ✅ 確認モーダル
      setModalMessage('✅ 空きあり！ このまま予約を確定しますか？')
      setModalAction(() => async () => {
        // ✅ ここで予約番号を初めて生成
        const newReservationId = generateReservationId();
        setReservationId(newReservationId);

        // ✅ Supabase / Sheet に送るpayload
        const confirmPayload = { 
          reservation_id: newReservationId,
          userId, 
          vehicleId, 
          startDate, 
          endDate,
          option_child_seat: childSeat,
          option_insurance: insurance
        }

        const confirmRes = await fetch('/api/confirm-reservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(confirmPayload),
        })

        const confirmData = await confirmRes.json()
        console.log('🟢 Confirm Reservation Response:', confirmData)

        if (confirmRes.ok) {
          setModalMessage(`✅ 予約が確定しました！\n予約番号: ${newReservationId}`)
          setResultModalOpen(true)
          setStartDate('')
          setEndDate('')
          setNights(0)
          setChildSeat(false)
          setInsurance(false)
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

  // ✅ UI側でも min 属性で前日をブロック
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 3); // 今日 + 2日
  const minSelectableDate = minDateObj.toISOString().substring(0, 10);

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

        {/* 📅 Googleカレンダー */}
        <div style={{ margin: '16px 0', borderRadius: '12px', overflow: 'hidden' }}>
          {vehicleId === '' ? (
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=Asia%2FTokyo&showPrint=0&title=%E3%83%AC%E3%83%B3%E3%82%BF%E3%82%AB%E3%83%BC&showTz=0&showTitle=0&src=Y2FycmVudGFsLnJpZGVtb2IwNkBnbWFpbC5jb20&src=M2RkNjNjZDliZmE4MmMyMDNmYWI2NTg1ZmU5NmZjODFhMDAyOTZhMmY5YTljZjFmZGIxNjJiNmQzYTc3NGYxM0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ODY5ZTcwMzg5ZDc4NGViNmQ5ZDllMzE4NmUyNzQxY2E2NzQ5MGY4ZmY4Nzc1YjhlOTY2NTExZjc4NDExNjY4NkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ZTIyZTBiMGI2NGQ4MjQxY2EwZThlODMzNWQ1YzQwZjY4NTYwMzdmZGZiNzFiN2E1ZWI4YmJiNTNlMjM5NjA5OUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=amEuamFwYW5lc2UjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb29nbGUuY29t&color=%23009688&color=%23039be5&color=%23ef6c00&color=%2333b679&color=%23e4c441"
              style={{ width: '100%', height: '470px', border: 'none' }}
            />
          ) : (
            <iframe
              src={`https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=Asia%2FTokyo&showPrint=0&showTz=0&showTitle=0&src=${calendarMap[vehicleId]}&color=${colorMap[vehicleId]}`}
              style={{ width: '100%', height: '350px', border: 'none' }}
            />
          )}
        </div>

       {/* 📆 日付入力 */}
<div 
  style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    gap: '16px',            // ✅ 開始日と終了日の間に余白
    marginBottom: '20px', 
    opacity: vehicleId === '' ? 0.5 : 1 
  }}
>
  <div style={{ flex: 1 }}>
    <DatePicker
      label="📅 開始日"
      value={startDate}
      onChange={(date) => {
        setStartDate(date);
        setEndDate('');
      }}
      minDate={minSelectableDate}
      disabled={vehicleId === ''}
    />
  </div>

  <div style={{ flex: 1 }}>
    <DatePicker
      label="📅 終了日"
      value={endDate}
      onChange={setEndDate}
      minDate={startDate || minSelectableDate}
      maxDate={
        startDate
          ? new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 4))
              .toISOString()
              .split('T')[0]
          : undefined
      }
      disabled={vehicleId === ''}
    />
  </div>
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

        {/* ✅ オプション選択 */}
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          background: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ccc'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>✅ オプション</h3>
          <label style={{ display: 'block', marginBottom: '6px' }}>
            <input
              type="checkbox"
              checked={childSeat}
              onChange={(e) => setChildSeat(e.target.checked)}
            />
            チャイルドシート（590円/日）
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={insurance}
              onChange={(e) => setInsurance(e.target.checked)}
            />
            免責補償（550円/日）
          </label>
        </div>

        {/* 🚆 予約ボタン */}
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

        {/* ✅ 予約番号（予約完了後だけ表示 & コピー可） */}
        {reservationId && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#222' }}>
              予約番号: {reservationId}
            </span>
            <button
              onClick={copyReservationId}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '14px',
                cursor: 'pointer',
                background: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              📋 コピー
            </button>
          </div>
        )}
      </main>

      {/* ✅ モーダル */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="予約確認"
        message={modalMessage}
        onConfirm={() => { if (modalAction) modalAction() }}
        onCancel={() => setConfirmModalOpen(false)}
        confirmText="予約する"
        cancelText="やめる"
      />

      <ResultModal
        isOpen={resultModalOpen}
        title="予約結果"
        message={modalMessage}
        onClose={() => setResultModalOpen(false)}
        confirmText="OK"
      />
    </div>
  )
}
