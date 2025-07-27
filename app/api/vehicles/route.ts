import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🚗 GET: すべての車両データ取得
 */
export async function GET() {
  const { data, error } = await supabase.from('vehicles').select('*')
  return NextResponse.json(error ? { error } : data)
}

/**
 * 🚗 POST: 新しい車両データ追加
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('vehicles').insert([body])
  return NextResponse.json(error ? { error } : data)
}

/**
 * 🚗 PUT: 既存車両データを更新
 */
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { car_no, ...updates } = body
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('car_no', car_no)
  return NextResponse.json(error ? { error } : data)
}

/**
 * 🚗 DELETE: 車両データを削除
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { car_no } = body
  const { data, error } = await supabase.from('vehicles').delete().eq('car_no', car_no)
  return NextResponse.json(error ? { error } : data)
}
