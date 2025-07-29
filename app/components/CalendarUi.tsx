'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

// ✅ Supabaseクライアント
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ 切り出しコンポーネント
import VehicleSelect from '../components/VehicleSelect'
import NightsDisplay from '../components/NightsDisplay'
import DatePicker from '../components/DatePicker'
import ReservationConfirm from '../components/ReservationConfirm'

// ✅ モーダル import
import ConfirmModal from '../components/ConfirmModal'
import ResultModal from '../components/ResultModal'
import CopyModal from '../components/CopyModal'

type Props = {
  userId: string;
  onReserveComplete?: (reservationId: string) => void;
};

// ✅ ReservationData 型を定義
type ReservationData = {
  reservation_id: string;
  vehicle_id: string;
  car_name: string;
  rank: string;
  number_plate: string;
  manufacturer: string;
  model: string;
  color: string;
  image_url_1?: string;
  start_date: string;
  end_date: string;
  planId: string;
  car_rental_price: number;
  option_price_1: number;
  option_price_2: number;
  total_price: number;
};

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nights, setNights] = useState(0);

  // ✅ startDateを選んだら4日後まで終了日を制限（JST固定）
  const maxEndDate = startDate
    ? (() => {
        const start = new Date(`${startDate}T00:00:00`);   
        start.setDate(start.getDate() + 4);
        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        const d = String(start.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      })()
    : undefined;

  // ✅ 泊数計算（JST固定）
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      setNights(diff >= 0 ? diff : 0);
    } else {
      setNights(0);
    }
  }, [startDate, endDate]);

  // ✅ モーダル管理
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalAction, setModalAction] = useState<(() => void) | null>(null)

  // ✅ オプション管理
  const [childSeat, setChildSeat] = useState(false)
  const [insurance, setInsurance] = useState(false)

  // ✅ 予約ID
  const [reservationId, setReservationId] = useState('');
  const [reservationData, setReservationData] = useState<any>(null);

  // ✅ コピー時アニメーション
  const [copied, setCopied] = useState(false);

  // ✅ タブ切り替え
  const [tab, setTab] = useState<'calendar' | 'form'>('calendar');

  // ✅ 予約IDをコピー
  const copyReservationId = () => {
    navigator.clipboard.writeText(reservationId);
    setModalMessage(`📋 予約番号をコピーしました\n${reservationId}`);
    setCopyModalOpen(true);
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
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

  try {
    const newReservationId = generateReservationId()
    setReservationId(newReservationId)

    // ✅ APIに送信する予約データ
const confirmPayload = {
  reservation_id: newReservationId,
  userId,
  vehicleId,
  startDate,
  endDate,
  option_child_seat: childSeat,
  option_insurance: insurance
}

// ✅ API呼び出し
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

  // ✅ API から返却された予約データを state にセット
  if (confirmData.reservation) {
    console.log('📦 [CalendarUi] APIから取得した reservation を state へ:', confirmData.reservation)
    setReservationData(confirmData.reservation)
  }

  // ✅ 入力値リセット
  setStartDate('')
  setEndDate('')
  setNights(0)
  setChildSeat(false)
  setInsurance(false)

  // ✅ carrental から予約詳細も取得（APIから足りない情報があった場合に補完用）
  const { data: reservation } = await supabase
    .from('carrental')
    .select('reservation_id, start_date, end_date, total_price, car_name')
    .eq('reservation_id', newReservationId)
    .single()

  if (reservation) {
    console.log('📥 [CalendarUi] Supabase carrental から補完:', reservation)
    setReservationData((prev: any) => ({
      ...prev,  // APIからのデータを維持
      reservationId: reservation.reservation_id,
      car: reservation.car_name,
      startDate: reservation.start_date,
      endDate: reservation.end_date,
      totalPrice: reservation.total_price,
      imageUrl: prev?.imageUrl || null
    }))
  }

} else {
  setModalMessage(`❌ 予約確定エラー: ${confirmData.message}`)
  setResultModalOpen(true)
}

setConfirmModalOpen(false)


  } catch (err) {
    console.error('⚡ ネットワークエラー:', err)
    setModalMessage('⚡ ネットワークエラーが発生しました')
    setModalAction(null)
    setResultModalOpen(true)
  }
}
  // ✅ UI側でも min 属性で前日をブロック
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 2);
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

        {/* 🔀 タブ切り替え */}
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <button
            onClick={() => setTab('calendar')}
            style={{
              flex: 1, padding: 8,
              background: tab === 'calendar' ? '#007bff' : '#eee',
              color: tab === 'calendar' ? '#fff' : '#000',
              border: 'none', borderRadius: 6
            }}
          >
            📆 空き状況
          </button>
          <button
            onClick={() => setTab('form')}
            style={{
              flex: 1, padding: 8,
              background: tab === 'form' ? '#007bff' : '#eee',
              color: tab === 'form' ? '#fff' : '#000',
              border: 'none', borderRadius: 6
            }}
          >
            🖊 日付入力
          </button>
        </div>

        {/* 📅 Googleカレンダー */}
{tab === 'calendar' && (
  <div style={{ margin: '16px 0', borderRadius: '12px', overflow: 'hidden' }}>
    {vehicleId === '' ? (
      // ✅ 車が未選択 → 総合カレンダー表示
<iframe
  src="https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=Asia%2FTokyo&showPrint=0&showTitle=0&src=3dd63cd9bfa82c203fab6585fe96fc81a00296a2f9a9cf1fdb162b6d3a774f13@group.calendar.google.com&src=869e70389d784eb6d9d9e3186e2741ca67490f8ff8775b8e966511f784116686@group.calendar.google.com&src=e22e0b0b64d8241ca0e8e8335d5c40f6856037fdfb71b7a5eb8bbb53e2396099@group.calendar.google.com&color=%23039be5&color=%23ef6c00&color=%237cb342"
  style={{ borderWidth: 0, width: '100%', height: '470px', border: 'none' }}
  frameBorder="0"
  scrolling="no"
/>



    ) : (
      // ✅ 車両が選択されている → その車両だけ表示
      <iframe
        src={`https://calendar.google.com/calendar/embed?height=600&wkst=2&ctz=Asia%2FTokyo&showPrint=0&showTitle=0&showTabs=0&showCalendars=0
          &src=${calendarMap[vehicleId]}&color=${colorMap[vehicleId]}`}
        style={{ borderWidth: 0, width: '100%', height: '470px', border: 'none' }}
        frameBorder="0"
        scrolling="no"
      />
    )}
  </div>
)}





        {/* 📆 日付入力 */}
        {tab === 'form' && (
          <div style={{ marginBottom: '20px', opacity: vehicleId === '' ? 0.5 : 1 }}>
            <DatePicker
              label="📅 開始日"
              value={startDate}
              onChange={setStartDate}
              minDate={minSelectableDate}
            />
            <DatePicker
              label="📅 終了日"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate || minSelectableDate}
              maxDate={maxEndDate}
            />
          </div>
        )}

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
    opacity: vehicleId === '' ? 0.7 : 1,
    transition: 'transform 0.15s ease, background-color 0.3s ease',
  }}
  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
>
  🚆 この車を予約する
</button>


        {/* ✅ 予約番号 */}
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
                background: copied ? '#4caf50' : '#f0f0f0',
                color: copied ? '#fff' : '#000',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              📋 コピー
            </button>
          </div>
        )}

        {/* ✅ 予約確認画面 */}
        {reservationData && (
  <>
    {console.log('📦 [CalendarUi] ReservationConfirm に渡すデータ:', reservationData)}
    <ReservationConfirm reservation={reservationData} />
  </>
)}

      </main>

      {/* ✅ モーダル群 */}
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

      <CopyModal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        message={modalMessage}
      />
    </div>
  )
}
