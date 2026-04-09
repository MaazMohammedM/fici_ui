import { createClient } from '@supabase/supabase-js'

// Use environment variable or fallback to Cloudflare proxy URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase-proxy.furqhaanmohammed001.workers.dev'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom fetch to handle domain fallback with better error handling
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  if (urlStr.includes('api.ficishoes.com')) {
    try {
      
      // Add proper headers for Supabase
      const enhancedOptions = {
        ...options,
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials,
        headers: {
          ...options?.headers,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };
      
      const response = await fetch(urlStr, enhancedOptions);
      
      // Check if response is OK
      if (!response.ok) {
        console.warn('Cloudflare API response not OK:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      
      // Immediately fallback to Cloudflare proxy on any error
      const fallbackUrl = urlStr.replace('https://api.ficishoes.com', 'https://supabase-proxy.furqhaanmohammed001.workers.dev');
      
      const fallbackOptions = {
        ...options,
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials,
        headers: {
          ...options?.headers,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };
      
      return fetch(fallbackUrl, fallbackOptions);
    }
  }
  
  return fetch(urlStr, {
    ...options,
    mode: 'cors' as RequestMode,
    credentials: 'omit' as RequestCredentials,
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    },
    fetch: customFetch
  },
  db: {
    schema: 'public'
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