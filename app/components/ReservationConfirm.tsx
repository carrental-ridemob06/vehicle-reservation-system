'use client'

type ReservationConfirmProps = {
  reservation: any;
};

export default function ReservationConfirm({ reservation }: ReservationConfirmProps) {
  return (
    <div style={container}>
      {/* ✅ 見出し */}
      <h2 style={heading}>✅ 予約確認</h2>

      {/* ✅ 車の写真 */}
      {reservation.image_url_1 ? (
        <img src={reservation.image_url_1} alt={reservation.car_name} style={image} />
      ) : (
        <p style={noImage}>🚘 車の写真は登録されていません</p>
      )}

      {/* ✅ 車両情報 */}
      <h3 style={subHeading}>🚗 車両情報</h3>
      <ul style={list}>
        <li><strong>ID:</strong> {reservation.vehicle_id || '―'}</li>
        <li><strong>車名:</strong> {reservation.car_name || '―'}</li>
        <li><strong>ランク:</strong> {reservation.rank || '―'}</li>
        <li><strong>ナンバー:</strong> {reservation.number_plate || '―'}</li>
        <li><strong>メーカー:</strong> {reservation.manufacturer || '―'}</li>
        <li><strong>年式:</strong> {reservation.model || '―'}</li>
        <li><strong>色:</strong> {reservation.color || '―'}</li>
      </ul>

      {/* ✅ 予約情報 */}
      <h3 style={subHeading}>📅 予約情報</h3>
      <ul style={list}>
        <li><strong>予約番号:</strong> {reservation.reservation_id || '―'}</li>
        <li><strong>日付:</strong> {reservation.start_date || '―'} 〜 {reservation.end_date || '―'}</li>
        <li><strong>泊数:</strong> {reservation.planId || '―'}</li>
      </ul>

      {/* ✅ 金額 */}
      <h3 style={subHeading}>💴 金額</h3>
      <ul style={list}>
        <li><strong>基本料金:</strong> ¥{(reservation.car_rental_price ?? 0).toLocaleString()}</li>
        <li>チャイルドシート: ¥{(reservation.option_price_1 ?? 0).toLocaleString()}</li>
        <li>免責補償: ¥{(reservation.option_price_2 ?? 0).toLocaleString()}</li>
      </ul>

      {/* ✅ 合計 */}
      <div style={totalBox}>
        合計: <span style={totalPrice}>¥{(reservation.total_price ?? 0).toLocaleString()}</span>
      </div>

      {/* ✅ 注意書き */}
      <p style={note}>
        ※この後決済登録完了後、予約確定となります。<br />
        ※20分間以内に決済が行われないと予約が消滅します。<br />
        ※開始日当日までに免許証などの本人確認の登録が必要です。
      </p>
    </div>
  )
}

/* 🎨 CSS スタイル */
const container: React.CSSProperties = {
  padding: '20px',
  background: '#ffffff',
  borderRadius: '12px',
  marginTop: '20px',
  maxWidth: '700px',
  marginLeft: 'auto',
  marginRight: 'auto',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  fontFamily: "'Noto Sans JP', sans-serif"
};

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 'bold',
  marginBottom: '16px',
  textAlign: 'center',
  color: '#2c3e50'
};

const image: React.CSSProperties = {
  width: '100%',
  maxWidth: '550px',
  display: 'block',
  margin: '0 auto 16px auto',
  borderRadius: '12px',
  border: '2px solid #f1f1f1',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
};

const noImage: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '14px',
  color: '#777',
  marginBottom: '12px'
};

const subHeading: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginTop: '20px',
  marginBottom: '8px',
  paddingLeft: '6px',
  borderLeft: '4px solid #3498db',
  color: '#34495e'
};

const list: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  lineHeight: '1.7'
};

const totalBox: React.CSSProperties = {
  marginTop: '20px',
  textAlign: 'right',
  fontSize: '18px',
  fontWeight: 'bold'
};

const totalPrice: React.CSSProperties = {
  fontSize: '22px',
  color: '#e74c3c',
  marginLeft: '6px',
  background: '#fff5f5',
  padding: '4px 10px',
  borderRadius: '6px'
};

const note: React.CSSProperties = {
  marginTop: '20px',
  fontSize: '13px',
  color: '#777',
  lineHeight: '1.6'
};

/* 📱 レスポンシブ（スマホ最適化） */
const responsiveStyle = `
@media (max-width: 480px) {
  h2 {
    font-size: 20px !important;
  }
  h3 {
    font-size: 16px !important;
  }
  ul li {
    font-size: 14px !important;
  }
  div {
    font-size: 14px !important;
  }
}
`;

// ⬆ このスタイルは `globals.css` に追加するか、<style jsx global> に埋め込めます
