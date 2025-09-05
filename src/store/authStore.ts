import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { 
  GuestSession, 
  GuestContactInfo, 
  AuthenticationState,
  GuestOrderSummary,
  GuestOrderMergeResult 
} from '../types/guest';
import { persist } from 'zustand/middleware';

interface AuthState extends AuthenticationState {
  role: string | null;
  firstName: string | null;
  loading: boolean;
  error: string | null;
  
  // User authentication methods
  setUser: (user: any) => void;
  setRole: (role: string | null) => void;
  setFirstName: (name: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  clearError: () => void;
  
  // Guest session methods
  createGuestSession: (contactInfo: GuestContactInfo) => Promise<GuestSession | null>;
  setGuestSession: (session: GuestSession) => void;
  updateGuestContactInfo: (contactInfo: GuestContactInfo) => void;
  validateGuestSession: () => Promise<boolean>;
  extendGuestSession: () => Promise<boolean>;
  clearGuestSession: () => void;
  
  // Order merging methods
  checkGuestOrders: (email: string, phone?: string) => Promise<GuestOrderSummary>;
  mergeGuestOrders: (userId: string, guestSessionId?: string) => Promise<GuestOrderMergeResult>;
  
  // Utility methods
  getAuthenticationType: () => 'user' | 'guest' | 'none';
  getCurrentUserId: () => string | null;
  getCurrentSessionId: () => string | null;
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    // Authentication state
    isAuthenticated: false,
    isGuest: false,
    user: null,
    guestSession: undefined,
    guestContactInfo: undefined,
    role: null,
    firstName: null,
    loading: false,
    error: null,

    // User authentication methods
    setUser: (user) => set({ 
      user, 
      isAuthenticated: !!user, 
      isGuest: false,
      guestSession: undefined,
      guestContactInfo: undefined 
    }),
    
    setRole: (role) => set({ role }),
    setFirstName: (name) => set({ firstName: name }),

    signIn: async (email: string, password: string) => {
      set({ loading: true, error: null });
      try {
        // Check for guest orders before signing in
        const guestOrders = await get().checkGuestOrders(email);
        
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, first_name')
            .eq('user_id', data.user.id)
            .single();

          set({
            user: data.user,
            role: profile?.role || 'customer',
            firstName: profile?.first_name || data.user.user_metadata?.first_name || '',
            isAuthenticated: true,
            isGuest: false,
            loading: false
          });

          // If guest orders exist, merge them
          if (guestOrders && guestOrders.has_guest_orders) {
            await get().mergeGuestOrders(data.user.id);
            get().clearGuestSession();
          }

          // Handle redirect after login
          const redirectPath = sessionStorage.getItem("redirectAfterLogin");
          if (redirectPath) {
            sessionStorage.removeItem("redirectAfterLogin");
            // Use setTimeout to ensure state is updated before navigation
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 100);
          }
        }
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    signUp: async (userData: { firstName: string; lastName: string; email: string; password: string }) => {
      set({ loading: true, error: null });
      try {
        // Check for guest orders before signing up
        const guestOrders = await get().checkGuestOrders(userData.email);
        
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              role: 'customer',
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create user profile
          await supabase.from('user_profiles').insert({
            user_id: data.user.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: 'customer'
          });

          set({
            user: data.user,
            role: 'customer',
            firstName: userData.firstName,
            isAuthenticated: true,
            isGuest: false,
            loading: false
          });

          // If guest orders exist, merge them
          if (guestOrders && guestOrders.has_guest_orders) {
            await get().mergeGuestOrders(data.user.id);
            get().clearGuestSession();
          }

          // Handle redirect after registration
          const redirectPath = sessionStorage.getItem("redirectAfterLogin");
          if (redirectPath) {
            sessionStorage.removeItem("redirectAfterLogin");
            // Use setTimeout to ensure state is updated before navigation
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 100);
          }
        }
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    signInWithGoogle: async () => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        console.log('signInWithGoogle',data);
        if (error) throw error;
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    clearError: () => set({ error: null }),

    signOut: async () => {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        role: null, 
        firstName: null, 
        isAuthenticated: false,
        isGuest: false,
        guestSession: undefined,
        guestContactInfo: undefined
      });
    },

    // Guest session methods
    createGuestSession: async (contactInfo: GuestContactInfo) => {
      try {
        console.log('🔄 Creating guest session for:', contactInfo);
        const { data, error } = await supabase.functions.invoke('create-guest-session', {
          body: { email:  contactInfo.email, phone:contactInfo.phone, name:contactInfo.name  }
        });
        
        console.log('📡 Guest session response:', { data, error });
        
        if (error) throw error;
        
        const guestSession = data as GuestSession;
        console.log('✅ Setting guest session in store:', guestSession);
        
        set({ 
          guestSession,
          guestContactInfo: contactInfo,
          isGuest: true,
          isAuthenticated: false,
          user: null
        });
        
        return guestSession;
      } catch (error) {
        console.error('❌ Failed to create guest session:', error);
        return null;
      }
    },

    setGuestSession: (session: GuestSession) => set({ 
      guestSession: session,
      isGuest: true,
      isAuthenticated: false
    }),

    updateGuestContactInfo: (contactInfo: GuestContactInfo) => set({ 
      guestContactInfo: contactInfo 
    }),

    validateGuestSession: async () => {
      const { guestSession } = get();
      if (!guestSession) return false;
      
      try {
        const { data, error } = await supabase.functions.invoke('validate-guest-session', {
          body: { guest_session_id: guestSession.guest_session_id }
        });
        
        if (error || !data.valid) {
          get().clearGuestSession();
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Failed to validate guest session:', error);
        get().clearGuestSession();
        return false;
      }
    },

    extendGuestSession: async () => {
      const { guestSession } = get();
      if (!guestSession) return false;
      
      try {
        const { data, error } = await supabase.functions.invoke('extend-guest-session', {
          body: { guest_session_id: guestSession.guest_session_id }
        });
        
        if (error) throw error;
        
        set({ guestSession: data });
        return true;
      } catch (error) {
        console.error('Failed to extend guest session:', error);
        return false;
      }
    },

    clearGuestSession: () => set({ 
      guestSession: undefined,
      guestContactInfo: undefined,
      isGuest: false
    }),

    // Order merging methods
    checkGuestOrders: async (email: string, phone?: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('check-guest-orders', {
          body: { email, phone }
        });
        
        if (error) throw error;
        return data as GuestOrderSummary;
      } catch (error) {
        console.error('Failed to check guest orders:', error);
        return { has_guest_orders: false, guest_orders_count: 0, merge_available: false };
      }
    },

    mergeGuestOrders: async (userId: string, guestSessionId?: string) => {
      try {
        const { guestContactInfo } = get();
        const sessionId = guestSessionId || get().guestSession?.guest_session_id;
        
        const { data, error } = await supabase.functions.invoke('merge-guest-orders', {
          body: { 
            user_id: userId, 
            guest_session_id: sessionId,
            guest_contact_info: guestContactInfo
          }
        });
        
        if (error) throw error;
        return data as GuestOrderMergeResult;
      } catch (error) {
        console.error('Failed to merge guest orders:', error);
        return { 
          success: false, 
          merged_orders_count: 0, 
          total_merged_amount: 0, 
          error: (error as Error).message || 'Unknown error occurred'
        };
      }
    },

    // Utility methods
    getAuthenticationType: () => {
      const { user, isGuest } = get();
      if (user) return 'user';
      if (isGuest) return 'guest';
      return 'none';
    },

    getCurrentUserId: () => {
      const { user } = get();
      return user?.id || null;
    },

    getCurrentSessionId: () => {
      const { user, guestSession } = get();
      return user?.id || guestSession?.guest_session_id || null;
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      guestSession: state.guestSession,
      guestContactInfo: state.guestContactInfo,
      isGuest: state.isGuest
    })
  }
));