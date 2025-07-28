'use client'

type Props = {
  vehicleId: string;
  onChange: (id: string) => void;
};

export default function VehicleSelect({ vehicleId, onChange }: Props) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <select
        value={vehicleId}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '20px',
          fontWeight: '600',
          border: '2px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* ✅ 先頭 option */}
        <option value="">車両を選択してください</option>

        {/* 🚗 車両リスト */}
        <option value="car01">🚙 Car 01</option>
        <option value="car02">🚗 Car 02</option>
        <option value="car03">🚐 Car 03</option>
      </select>
    </div>
  )
}
