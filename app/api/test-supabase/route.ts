import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('carrental') // ← ここを carrental に！
    .select('*')
    .limit(1);

  console.log('Supabase test:', data, error);

  return NextResponse.json({ data, error });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('carrental') // ← ここも carrental に！
    .insert([
      {
        user_id: 'test-user-id',
        vehicle_id: 'test-vehicle-id',
        calendar_event_id: 'test-event-id',
        start_date: '2025-07-15',
        end_date: '2025-07-17',
        status: 'confirmed',
        created_at: new Date().toISOString(),
      },
    ]);

  console.log('Supabase insert:', data, error);

  return NextResponse.json({ data, error });
}
