'use client'

import Link from 'next/link'

export default function AdminMenu() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>🛠 管理メニュー</h1>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        flexWrap: 'wrap',
      }}>
        {/* 🚗 車両管理 */}
        <Link href="/admin/vehicles">
          <div style={cardStyle}>
            <h2 style={cardTitle}>🚗 車両管理システム</h2>
            <p style={cardDesc}>車の登録・編集・削除・画像管理</p>
          </div>
        </Link>

        {/* 📅 カレンダー管理 */}
        <Link href="/admin/calendar">
          <div style={cardStyle}>
            <h2 style={cardTitle}>📅 カレンダー管理システム</h2>
            <p style={cardDesc}>Googleカレンダー予約の管理</p>
          </div>
        </Link>

        {/* ✅ 予約管理 */}
        <Link href="/admin/reservations">
          <div style={cardStyle}>
            <h2 style={cardTitle}>✅ 予約管理システム</h2>
            <p style={cardDesc}>予約一覧・手動キャンセル</p>
          </div>
        </Link>

        {/* 📜 システムログ ← 追加済み */}
        <Link href="/admin/logs">
          <div style={cardStyle}>
            <h2 style={cardTitle}>📜 システムログ</h2>
            <p style={cardDesc}>自動/手動キャンセル履歴とエラー</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

/* 🎨 スタイル */
const cardStyle: React.CSSProperties = {
  width: '250px',
  padding: '20px',
  border: '1px solid #ddd',
  borderRadius: '12px',
  background: '#f9fafb',
  cursor: 'pointer',
  transition: '0.3s',
  textAlign: 'center',
};

const cardTitle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '10px',
};

const cardDesc: React.CSSProperties = {
  fontSize: '14px',
  color: '#555',
};
