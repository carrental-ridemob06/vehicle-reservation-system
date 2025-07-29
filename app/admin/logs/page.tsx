'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type LogEntry = {
  id: number;
  action: string;
  reservation_id: string;
  details: any;
  created_at: string;
};

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Supabase からログ取得
  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('id, action, reservation_id, details, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 system_logs 取得エラー:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>📜 システムログ</h1>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Reservation ID</th>
              <th style={thStyle}>Details</th>
              <th style={thStyle}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={tdStyle}>{log.id}</td>
                <td style={{ ...tdStyle, color: getActionColor(log.action) }}>{log.action}</td>
                <td style={tdStyle}>{log.reservation_id}</td>
                <td style={tdStyle}>
                  <pre style={preStyle}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </td>
                <td style={tdStyle}>{new Date(log.created_at).toLocaleString()}</td>
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
  verticalAlign: 'top',
};

const preStyle: React.CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: '12px',
  color: '#333',
};

/* ✅ 追加: cardDesc が未定義エラーにならないように定義 */
const cardDesc: React.CSSProperties = {
  fontSize: '14px',
  color: '#555',
};

function getActionColor(action: string) {
  switch (action) {
    case 'auto-cancel':
      return '#e67e22'; // オレンジ
    case 'manual-cancel':
      return '#3498db'; // 青
    case 'error':
      return '#e74c3c'; // 赤
    default:
      return '#000';
  }
}
