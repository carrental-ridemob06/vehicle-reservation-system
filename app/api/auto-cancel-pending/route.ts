import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelReservation } from '@/lib/cancelReservation';

// ✅ Supabase クライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    console.log('⏳ 自動キャンセル処理開始');

    // ✅ 20分前の時刻を計算
    const cutoffTime = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    // ✅ carrental から status=pending & created_at < cutoffTime を取得
    const { data: pendingReservations, error } = await supabase
      .from('carrental')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', cutoffTime);

    if (error) {
      console.error('🔴 Supabase 取得エラー:', error);
      return NextResponse.json({ error: '予約の取得に失敗' }, { status: 500 });
    }

    if (!pendingReservations || pendingReservations.length === 0) {
      console.log('✅ 自動キャンセル対象なし');
      return NextResponse.json({ message: '対象なし', count: 0 });
    }

    console.log(`🚨 対象予約数: ${pendingReservations.length}`);

    // ✅ キャンセル処理を順番に実行
    const results = [];
    for (const reservation of pendingReservations) {
      const res = await cancelReservation(reservation.id, 'auto-cancel');
      results.push({ id: reservation.id, ...res });
    }

    console.log(`✅ 自動キャンセル完了: ${results.length}件`);
    return NextResponse.json({ message: '自動キャンセル完了', count: results.length, results });

  } catch (err) {
    console.error('🔴 自動キャンセルAPIエラー:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
