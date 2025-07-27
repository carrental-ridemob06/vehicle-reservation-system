'use client'

type Vehicle = {
  car_no: string
  name: string
  rank: string
  number_plate: string
  price_same_day: number
  price_1n: number
  price_2n: number
  price_3n: number
  price_4n: number
  option_price_1: number
  option_price_2: number
  option_price_3: number
  calendar_id: string
  image_url_1?: string
  image_url_2?: string
  image_url_3?: string
  image_url_4?: string
  image_url_5?: string
  notes?: string
}

export default function VehicleTable({
  vehicles,
  onEdit,
  onDelete,
}: {
  vehicles: Vehicle[]
  onEdit: (vehicle: Vehicle) => void
  onDelete: (car_no: string) => void
}) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
      }}
    >
      <thead>
        <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
          <th style={thStyle}>車両ID</th>
          <th style={thStyle}>車種名</th>
          <th style={thStyle}>ランク</th>
          <th style={thStyle}>ナンバー</th>
          <th style={thStyle}>当日価格</th>
          <th style={thStyle}>1泊価格</th>
          <th style={thStyle}>2泊価格</th>
          <th style={thStyle}>3泊価格</th>
          <th style={thStyle}>4泊価格</th>
          <th style={thStyle}>操作</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <tr key={v.car_no} style={{ borderBottom: '1px solid #ddd' }}>
            <td style={tdStyle}>{v.car_no}</td>
            <td style={tdStyle}>{v.name}</td>
            <td style={tdStyle}>{v.rank}</td>
            <td style={tdStyle}>{v.number_plate}</td>
            <td style={tdStyle}>{v.price_same_day}</td>
            <td style={tdStyle}>{v.price_1n}</td>
            <td style={tdStyle}>{v.price_2n}</td>
            <td style={tdStyle}>{v.price_3n}</td>
            <td style={tdStyle}>{v.price_4n}</td>
            <td style={tdStyle}>
              <button
                style={editBtn}
                onClick={() => onEdit(v)}
              >
                ✏️ 編集
              </button>
              <button
                style={deleteBtn}
                onClick={() => onDelete(v.car_no)}
              >
                🗑 削除
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px',
  borderBottom: '2px solid #ccc',
  fontWeight: 'bold',
  fontSize: '14px',
}

const tdStyle: React.CSSProperties = {
  padding: '8px',
  fontSize: '13px',
}

const editBtn: React.CSSProperties = {
  background: '#3b82f6',
  color: '#fff',
  padding: '4px 8px',
  marginRight: '6px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
}

const deleteBtn: React.CSSProperties = {
  background: '#ef4444',
  color: '#fff',
  padding: '4px 8px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
}
