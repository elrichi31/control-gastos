import { createClient } from '@supabase/supabase-js'

// Server-only service-role client. Callers must bind every query to an authenticated user id.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
