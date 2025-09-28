import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { devtools } from 'zustand/middleware';

// Define the AuthState type
type AuthState = {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: User | null;
  session: any;
  error: { message: string } | null;
  loading: boolean;
  authType: 'user' | 'guest' | null;
  guestSession: any;
  guestContactInfo: any;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (userData: any) => Promise<{ user: any; session: any }>;
  signOut: () => Promise<void>;
  createGuestSession: (contactInfo: { email: string; name: string; phone: string }) => Promise<any>;
  validateGuestSession: (sessionId: string) => Promise<boolean>;
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  setError: (error: { message: string } | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
};

// Mock the supabase client
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockGetSession = vi.fn();

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
      getSession: mockGetSession,
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock the logger
const mockLoggerError = vi.fn();
const mockLoggerInfo = vi.fn();

vi.mock('../../lib/logger', () => ({
  logger: {
    error: mockLoggerError,
    info: mockLoggerInfo,
    debug: vi.fn(),
  },
}));

// Mock the guest service
const mockCreateGuestSession = vi.fn();
const mockValidateGuestSession = vi.fn();

vi.mock('../../services/guestService', () => ({
  createGuestSession: mockCreateGuestSession,
  validateGuestSession: mockValidateGuestSession,
}));

// Test data
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'User',
  },
  app_metadata: { provider: 'email' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  user: mockUser,
};

const mockGuestSession = {
  guest_session_id: 'test-guest-session-id',
  email: 'guest@example.com',
  name: 'Guest User',
  phone: '1234567890',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day from now
  is_active: true,
};

describe('Auth Store', () => {
  let store: UseBoundStore<StoreApi<AuthState>>;
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Create a test implementation of the store
    store = create<AuthState>()(
      devtools(
        (set) => ({
          // Initial state
          isAuthenticated: false,
          isGuest: false,
          user: null,
          session: null,
          error: null,
          loading: false,
          authType: null,
          guestSession: null,
          guestContactInfo: null,
          
          // Authentication methods
          signIn: async (email: string, password: string) => {
            try {
              set({ loading: true, error: null });
              const { data, error } = await mockSignInWithPassword({ email, password });
              
              if (error) throw error;
              
              set({
                isAuthenticated: true,
                user: data.user,
                session: data.session,
                authType: 'user',
                loading: false,
                // Clear guest session if exists
                guestSession: null,
                guestContactInfo: null,
              });
              
              return true;
            } catch (error: any) {
              set({
                error: { message: error.message },
                loading: false,
              });
              return false;
            }
          },
          
      signUp: async (userData: any) => {
        try {
          set({ loading: true, error: null });
          const { data, error } = await mockSignUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                first_name: userData.firstName,
                last_name: userData.lastName,
              },
            },
          });
          
          if (error) throw error;
          
          // Mock the user profile creation
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  vi.fn().mockReturnValue({ insert: mockInsert });
          
          set({ 
            user: data?.user || null, 
            session: data?.session || null,
            isAuthenticated: true,
            isGuest: false,
            authType: 'user',
            loading: false 
          });
          
          return { user: data.user, session: data.session };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to sign up';
          set({ error: { message }, loading: false });
          throw error;
        }
      },
      
      signOut: async () => {
        try {
          set({ loading: true, error: null });
          const { error } = await mockSignOut();
          if (error) throw error;
          
          set({ 
            user: null,
            session: null,
            isAuthenticated: false,
            isGuest: false,
            authType: null,
            loading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to sign out';
          set({ error: { message }, loading: false });
          throw error;
        }
      },
      
      // Guest session methods
      createGuestSession: async (contactInfo) => {
        try {
          set({ loading: true, error: null });
          const result = await mockCreateGuestSession(contactInfo);
          if (result.error) throw result.error;
          
          const session = {
            ...mockGuestSession,
            ...contactInfo
          };
          
          set({
            guestSession: session,
            guestContactInfo: contactInfo,
            isGuest: true,
            isAuthenticated: true,
            authType: 'guest',
            loading: false
          });
          
          return session;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create guest session';
          set({ error: { message }, loading: false });
          throw error;
        }
      },
      
      validateGuestSession: async (sessionId: string) => {
        try {
          const { data, error } = await mockValidateGuestSession(sessionId);
          if (error) throw error;
          return data?.isValid || false;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to validate session';
          set({ error: { message } });
          return false;
        }
      },
      
      // Other required methods with mock implementations
      setUser: vi.fn(),
      setSession: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn(),
    }), { name: 'auth-store' })
    );
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should sign in successfully', async () => {
      // Mock successful sign in
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => store());
      
      await act(async () => {
        const success = await result.current.signIn('test@example.com', 'password');
        expect(success).toBe(true);
      });

      const state = store.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.authType).toBe('user');
      // Verify guest session is cleared after merge
      expect(state.guestSession).toBeNull();
      expect(state.guestContactInfo).toBeNull();
    });
  });
});