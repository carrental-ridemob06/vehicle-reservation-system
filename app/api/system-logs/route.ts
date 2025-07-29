// ✅ app/api/system-logs/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    console.log('📥 system_logs API 呼び出し');
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 system_logs 取得エラー:', error);
      return NextResponse.json({ error: 'system_logs 取得エラー' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('🔴 API エラー:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
