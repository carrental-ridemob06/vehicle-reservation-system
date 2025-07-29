'use client'

import { useState } from 'react'
import ImageUploader from './ImageUploader'

type VehicleFormProps = {
  vehicle?: any
  onClose: () => void
  onSaved: () => void
}

export default function VehicleForm({ vehicle, onClose, onSaved }: VehicleFormProps) {
  const [form, setForm] = useState({
    car_no: vehicle?.car_no || '',
    manufacturer: vehicle?.manufacturer || '',   // ✅ メーカー
    name: vehicle?.name || '',
    rank: vehicle?.rank || '',
    number_plate: vehicle?.number_plate || '',
    model: vehicle?.model || '',                 // ✅ 年式
    color: vehicle?.color || '',                 // ✅ 色
    price_same_day: vehicle?.price_same_day || 0,
    price_1n: vehicle?.price_1n || 0,
    price_2n: vehicle?.price_2n || 0,
    price_3n: vehicle?.price_3n || 0,
    price_4n: vehicle?.price_4n || 0,
    option_price_1: vehicle?.option_price_1 || 0,
    option_price_2: vehicle?.option_price_2 || 0,
    option_price_3: vehicle?.option_price_3 || 0,
    calendar_id: vehicle?.calendar_id || '',
    notes: vehicle?.notes || '',
  })

  const [images, setImages] = useState<string[]>([
    vehicle?.image_url_1 || '',
    vehicle?.image_url_2 || '',
    vehicle?.image_url_3 || '',
    vehicle?.image_url_4 || '',
    vehicle?.image_url_5 || '',
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSave = async () => {
    const method = vehicle ? 'PUT' : 'POST'
    const body = {
      ...form,
      image_url_1: images[0],
      image_url_2: images[1],
      image_url_3: images[2],
      image_url_4: images[3],
      image_url_5: images[4],
    }

    const res = await fetch('/api/vehicles', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      alert('✅ 保存しました')
      onSaved()
    } else {
      const err = await res.json()
      alert('❌ 保存に失敗しました: ' + err.message)
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '12px' }}>
          {vehicle ? '✏️ 車両を編集' : '➕ 新しい車を登録'}
        </h2>

        <div style={gridStyle}>

          {/* ✅ 車両ID */}
          <label>🚗 車両ID</label>
          <input
            type="text"
            name="car_no"
            value={form.car_no}
            onChange={handleChange}
            disabled={!!vehicle}
          />

          {/* ✅ メーカー */}
          <label>🏭 メーカー</label>
          <input
            type="text"
            name="manufacturer"
            value={form.manufacturer}
            onChange={handleChange}
          />

          {/* ✅ 車種名 */}
          <label>📛 車種名</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} />

          {/* ✅ ランク */}
          <label>🏷 ランク</label>
          <input type="text" name="rank" value={form.rank} onChange={handleChange} />

          {/* ✅ ナンバー */}
          <label>🔢 ナンバー</label>
          <input type="text" name="number_plate" value={form.number_plate} onChange={handleChange} />

          {/* ✅ 年式 */}
          <label>📆 年式</label>
          <input
            type="text"
            name="model"
            value={form.model}
            onChange={handleChange}
            placeholder="例：2023"
          />

          {/* ✅ 色 */}
          <label>🎨 色</label>
          <input
            type="text"
            name="color"
            value={form.color}
            onChange={handleChange}
            placeholder="例：ホワイト"
          />

          {/* 💴 料金関係 */}
          <label>💴 当日価格</label>
          <input type="number" name="price_same_day" value={form.price_same_day} onChange={handleChange} />

          <label>💴 1泊価格</label>
          <input type="number" name="price_1n" value={form.price_1n} onChange={handleChange} />

          <label>💴 2泊価格</label>
          <input type="number" name="price_2n" value={form.price_2n} onChange={handleChange} />

          <label>💴 3泊価格</label>
          <input type="number" name="price_3n" value={form.price_3n} onChange={handleChange} />

          <label>💴 4泊価格</label>
          <input type="number" name="price_4n" value={form.price_4n} onChange={handleChange} />

          {/* 🎯 オプション */}
          <label>🎯 オプション価格1</label>
          <input type="number" name="option_price_1" value={form.option_price_1} onChange={handleChange} />

          <label>🎯 オプション価格2</label>
          <input type="number" name="option_price_2" value={form.option_price_2} onChange={handleChange} />

          <label>🎯 オプション価格3</label>
          <input type="number" name="option_price_3" value={form.option_price_3} onChange={handleChange} />

          {/* 📆 Googleカレンダー */}
          <label>📆 Google Calendar ID</label>
          <input type="text" name="calendar_id" value={form.calendar_id} onChange={handleChange} />

          {/* 📝 備考 */}
          <label>📝 備考</label>
          <input type="text" name="notes" value={form.notes} onChange={handleChange} />
        </div>

        {/* 📷 画像アップローダー */}
        <h3 style={{ marginTop: '20px', fontWeight: 'bold' }}>📷 車の写真（最大5枚）</h3>
        <ImageUploader carNo={form.car_no} images={images} setImages={setImages} />

        {/* ✅ ボタン */}
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button style={cancelBtn} onClick={onClose}>
            ❌ キャンセル
          </button>
          <button style={saveBtn} onClick={handleSave}>
            ✅ 保存
          </button>
        </div>
      </div>
    </div>
  )
}

/* 🎨 スタイル */
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const modalStyle: React.CSSProperties = {
  background: '#fff',
  padding: '20px',
  borderRadius: '10px',
  width: '600px',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '150px 1fr',
  gap: '10px',
  alignItems: 'center',
}

const cancelBtn: React.CSSProperties = {
  background: '#9ca3af',
  color: '#fff',
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  marginRight: '8px',
  cursor: 'pointer',
}

const saveBtn: React.CSSProperties = {
  background: '#10b981',
  color: '#fff',
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}
