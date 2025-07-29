'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Reservation = {
  id: number;
  user_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string | null;
  created_at: string;
};

export default function ReservationAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Supabase から予約一覧を取得
  async function fetchReservations() {
    setLoading(true);
    const { data, error } = await supabase
      .from('carrental')
      .select('id, user_id, vehicle_id, start_date, end_date, status, payment_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 予約一覧取得エラー:', error);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  }

  // ✅ 手動キャンセル処理
  async function handleCancel(reservationId: number) {
    if (!confirm('本当にこの予約をキャンセルしますか？')) return;

    try {
      const res = await fetch('/api/cancel-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      });

      const result = await res.json();
      if (res.ok) {
        alert('✅ キャンセル完了');
        fetchReservations(); // 更新
      } else {
        alert(`❌ キャンセル失敗: ${result.error}`);
      }
    } catch (err) {
      console.error('🔴 手動キャンセルエラー:', err);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>✅ 予約管理システム</h1>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>ユーザー</th>
              <th style={thStyle}>車両</th>
              <th style={thStyle}>開始日</th>
              <th style={thStyle}>終了日</th>
              <th style={thStyle}>ステータス</th>
              <th style={thStyle}>作成日</th>
              <th style={thStyle}>操作</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td style={tdStyle}>{r.id}</td>
                <td style={tdStyle}>{r.user_id}</td>
                <td style={tdStyle}>{r.vehicle_id}</td>
                <td style={tdStyle}>{r.start_date}</td>
                <td style={tdStyle}>{r.end_date}</td>
                <td style={{ ...tdStyle, color: getStatusColor(r.status) }}>{r.status}</td>
                <td style={tdStyle}>{new Date(r.created_at).toLocaleString()}</td>
                <td style={tdStyle}>
                  {r.status !== 'canceled' ? (
                    <button
                      style={cancelButtonStyle}
                      onClick={() => handleCancel(r.id)}
                    >
                      🚨 手動キャンセル
                    </button>
                  ) : (
                    <span style={{ color: '#777' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* 🎨 スタイル */
const thStyle: React.CSSProperties = {
  borderBottom: '2px solid #ddd',
  padding: '10px',
  background: '#f0f0f0',
  textAlign: 'left',
};

const tdStyle: React.CSSProperties = {
  borderBottom: '1px solid #ddd',
  padding: '10px',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: '#ff4d4f',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return '#e67e22'; // オレンジ
    case 'confirmed':
      return '#3498db'; // 青
    case 'canceled':
      return '#7f8c8d'; // グレー
    default:
      return '#000';
  }
}
