import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, carId, startDate, endDate, totalPrice } = await req.json();

    // ✅ 新しい予約IDを作成
    const reservationId = 'A' + Math.floor(Math.random() * 1000000);

    // ✅ Supabaseに予約を保存
    const { error } = await supabase.from('reservations').insert({
      reservation_id: reservationId,
      user_id: userId,
      car_id: carId,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
    });

    if (error) {
      console.error('🔴 Supabase insert error:', error);
      return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ reservation_id: reservationId });
  } catch (err) {
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
