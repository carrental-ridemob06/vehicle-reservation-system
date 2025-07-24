import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: carrental テーブルから1件取得
export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('carrental')
    .select('*')
    .limit(1)

  console.log('Supabase test:', data, error)

  return NextResponse.json({ data, error })
}

// POST: carrental テーブルに1件挿入（テスト用データ）
export async function POST(req: NextRequest) {
  const { data, error } = await supabase
    .from('carrental')
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
    ])

  console.log('Supabase insert:', data, error)

  return NextResponse.json({ data, error })
}
