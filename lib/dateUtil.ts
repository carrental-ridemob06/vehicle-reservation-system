// /lib/dateUtil.ts

// ✅ Click用（秒なし、yyyy-MM-dd HH:mm）
export function getJSTDateForClick() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getFullYear();
  const month = String(jst.getMonth() + 1).padStart(2, '0');
  const day = String(jst.getDate()).padStart(2, '0');
  const hour = String(jst.getHours()).padStart(2, '0');
  const minute = String(jst.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// ✅ Google Sheets用（ISO + JSTオフセット）
export function getJSTDateForSheets() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().replace('Z', '+09:00');
}
