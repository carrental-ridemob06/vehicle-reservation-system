'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import CalendarUi from './components/CalendarUi';
import ReservationConfirm from './components/ReservationConfirm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user') || '';

  const [reservationData, setReservationData] = useState<any>(null);

  // ✅ reservation_id を受け取り、2回のクエリで予約内容と車の詳細を取得
  async function fetchReservation(reservationId: string) {
    // ① reservations から予約情報を取得
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('reservation_id, start_date, end_date, total_price, car_id')
      .eq('reservation_id', reservationId)
      .single();

    if (reservationError || !reservation) {
      console.error('🔴 reservations 取得エラー:', reservationError);
      return;
    }

    // ② vehicles から車の名前と画像を取得
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('name, image_url_1')
      .eq('car_no', reservation.car_id) // ← reservations.car_id で検索
      .single();

    if (vehicleError || !vehicle) {
      console.error('🔴 vehicles 取得エラー:', vehicleError);
      return;
    }

    // ③ ReservationConfirm に渡す形にデータをまとめる
    setReservationData({
      reservationId: reservation.reservation_id,
      car: vehicle.name,
      startDate: reservation.start_date,
      endDate: reservation.end_date,
      totalPrice: reservation.total_price,
      imageUrl: vehicle.image_url_1,
    });
  }

  return (
    <main className="p-4">
      {/* ✅ CalendarUi が予約を作成した後 reservation_id を返す */}
      <CalendarUi
        userId={userId}
        onReserveComplete={async (reservationId: string) => {
          await fetchReservation(reservationId);
        }}
      />

      {/* ✅ Supabase から取得した予約内容を表示 */}
      {reservationData && (
        <div className="mt-6">
          <ReservationConfirm reservation={reservationData} />
        </div>
      )}
    </main>
  );
}
