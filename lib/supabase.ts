// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// 🌐 Supabase URL（必須）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
if (!supabaseUrl) {
  throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is not defined')
}

// 🔑 キーを二段構えで用意
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 🚨 エラーチェック
if (!anonKey && !serviceRoleKey) {
  throw new Error('❌ Supabase API key is not defined (Anon or Service Role)')
}

// ✅ **管理操作（CRUD/画像アップロード）では serviceRoleKey を優先**
const supabaseKey = serviceRoleKey || anonKey

// 📦 Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseKey)
