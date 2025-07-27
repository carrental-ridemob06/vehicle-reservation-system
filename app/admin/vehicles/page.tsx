'use client'

import { useEffect, useState } from 'react'
import VehicleTable from '../VehicleTable'
import VehicleForm from '../VehicleForm'


export default function AdminPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // 🚀 初回ロード時に車データを取得
  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    const res = await fetch('/api/vehicles')
    const data = await res.json()
    setVehicles(data)
  }

  const handleAdd = () => {
    setEditingVehicle(null)
    setIsFormOpen(true)
  }

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle)
    setIsFormOpen(true)
  }

  const handleDelete = async (car_no: string) => {
    if (!confirm('🚨 この車を削除してもいいですか？')) return

    const res = await fetch('/api/vehicles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ car_no }),
    })

    if (res.ok) {
      alert('✅ 車を削除しました')
      fetchVehicles()
    } else {
      alert('❌ 削除に失敗しました')
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 className="text-2xl font-bold mb-4">🚗 車両管理画面</h1>

      <button
        onClick={handleAdd}
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}
      >
        ➕ 新しい車を登録
      </button>

      {/* 📋 車一覧テーブル */}
      <VehicleTable vehicles={vehicles} onEdit={handleEdit} onDelete={handleDelete} />

      {/* 📝 車追加・編集フォーム */}
      {isFormOpen && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => setIsFormOpen(false)}
          onSaved={() => {
            fetchVehicles()
            setIsFormOpen(false)
          }}
        />
      )}
    </div>
  )
}
