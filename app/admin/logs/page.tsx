'use client';
import { useEffect, useState } from 'react';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/system-logs');
        if (!res.ok) throw new Error('APIエラー: ' + res.status);
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error('🚨 ログ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>📝 システムログ</h1>
      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>ID</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Action</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Reservation ID</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Details</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{log.id}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{log.action}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{log.reservation_id}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                </td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                  {new Date(log.created_at).toLocaleString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
