'use client'

import { useState } from 'react'
import './admin.css'   // 🎨 ここでCSSを読み込む

export default function AdminPage() {
  const [vehicleId, setVehicleId] = useState('car01')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [colorId, setColorId] = useState('1')
  const [title, setTitle] = useState('')

  const handleSubmit = async () => {
    const res = await fetch('/api/admin-add-reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        startDate,
        endDate,
        colorId,
        title
      }),
    })
    const data = await res.json()
    if (res.ok) {
      alert('✅ Googleカレンダーに予約を追加しました')
    } else {
      alert('❌ 予約追加に失敗: ' + data.error)
    }
  }

  return (
    <div className="admin-container">
      <h1 className="admin-title">📋 管理者予約追加</h1>

      {/* 🚗 車選択 */}
      <div className="form-group">
        <label>🚗 車を選択</label>
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="car01">Car01</option>
          <option value="car02">Car02</option>
          <option value="car03">Car03</option>
        </select>
      </div>

      {/* 📅 開始日 */}
      <div className="form-group">
        <label>📅 開始日</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>

      {/* 📅 終了日 */}
      <div className="form-group">
        <label>📅 終了日</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {/* 🎨 色選択 */}
      <div className="form-group">
        <label>🎨 色（Google Calendar ColorId）</label>
        <select value={colorId} onChange={(e) => setColorId(e.target.value)}>
          <option value="1">青</option>
          <option value="3">緑</option>
          <option value="5">黄色</option>
          <option value="6">オレンジ</option>
          <option value="8">グレー</option>
        </select>
      </div>

      {/* 🏷 タイトル */}
      <div className="form-group">
        <label>🏷 タイトル</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 管理者追加予約" />
      </div>

      {/* ✅ 送信 */}
      <button className="submit-btn" onClick={handleSubmit}>✅ Googleカレンダーに予約追加</button>
    </div>
  )
}
