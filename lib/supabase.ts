// lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

// 型は自動生成した場合は import するけど、今は any でOK
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
