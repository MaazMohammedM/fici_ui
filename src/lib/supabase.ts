import { createClient } from '@supabase/supabase-js'

// Use Cloudflare worker for all operations except OAuth authorize
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase-proxy.furqhaanmohammed001.workers.dev'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Keep direct Supabase URL for OAuth authorize calls
const directSupabaseUrl = 'https://qegaebazravcwofibtry.supabase.co'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom fetch to handle domain routing with better error handling
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  
  if (urlStr && urlStr.includes('/auth/v1/authorize')) {
    return fetch(urlStr, {
      ...options,
      mode: 'cors' as RequestMode,
      credentials: 'omit' as RequestCredentials,
    });
  }
  
  if (urlStr.includes('qegaebazravcwofibtry.supabase.co')) {
    const workerUrl = urlStr.replace('https://qegaebazravcwofibtry.supabase.co', 'https://supabase-proxy.furqhaanmohammed001.workers.dev');
    
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
    
    return fetch(workerUrl, enhancedOptions);
  }
  
  if (urlStr.includes('qgeebazravcwfobithry.supabase.co')) {
    const workerUrl = urlStr.replace('https://qgeebazravcwfobithry.supabase.co', 'https://supabase-proxy.furqhaanmohammed001.workers.dev');
    
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
    
    return fetch(workerUrl, enhancedOptions);
  }
  
  // Handle api.ficishoes.com URLs
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
      
      if (!response.ok) {
        console.warn('Cloudflare API response not OK:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      
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

const supabaseOAuth = createClient(
  'https://qegaebazravcwofibtry.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZ2FlYmF6cmF2Y3dvZmlidHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODE4NzksImV4cCI6MjA2OTU1Nzg3OX0.YKP1oM0WIWzuaa47S6OTVEitBalCNqBQxgoLw0yiUg0',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true // Enable automatic session detection for OAuth callback
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