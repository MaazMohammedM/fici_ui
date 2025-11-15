import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
})

// Types for authentication
export type AuthUser = {
  id: string
  user_metadata?: {
    name?: string
    full_name?: string
    avatar_url?: string
    provider_id?: string
  }
}

export type AuthSession = {
  access_token: string
  refresh_token: string
  user: AuthUser
}