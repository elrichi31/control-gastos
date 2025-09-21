import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
}