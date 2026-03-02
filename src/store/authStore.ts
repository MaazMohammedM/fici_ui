// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { orderService } from '@/services/orderService';
import type { 
  GuestSession, 
  GuestContactInfo, 
  AuthenticationState,
  GuestOrderSummary,
  GuestOrderMergeResult 
} from '../types/guest';
import type { User } from '@/lib/firebase';

interface AuthState extends AuthenticationState {
  role: string | null;
  firstName: string | null;
  userProfile: any | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  authType: 'guest' | 'user' | null;

  // OTP verification tracking (scoped to session+checkoutAttempt)
  lastVerifiedEmail: string | null;
  lastVerifiedPhone: string | null;
  lastVerifiedSessionId: string | null;
  lastVerifiedAt: string | null;
  lastVerifiedCheckoutId: string | null;

  setUser: (user: any | undefined) => void;
  setUserProfile: (profile: any | null) => void;

  setRole: (role: string | null) => void;
  setFirstName: (name: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: { firstName: string; lastName: string; email: string; mobile?: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  updatePhoneNumber: (phoneNumber: string) => Promise<void>;

  // OTP verification methods
  setOtpVerification: (email: string, phone: string | null, sessionId: string, checkoutId?: string | null) => void;
  clearOtpVerification: () => void;
  isIdentityStillVerified: (currentEmail: string, currentPhone: string | null, currentSessionId: string, currentCheckoutId?: string | null) => boolean;

  setGuestSessionFromAuth: (session: GuestSession) => void;

  createGuestSession: (contactInfo: GuestContactInfo) => Promise<any | null>;
  setGuestSession: (session: GuestSession) => void;
  updateGuestContactInfo: (contactInfo: GuestContactInfo) => void;
  validateGuestSession: () => Promise<boolean>;
  extendGuestSession: () => Promise<boolean>;
  clearGuestSession: () => void;

  mergeGuestOrders: (userId: string, guest_session_id?: string) => Promise<GuestOrderMergeResult>;

  getAuthenticationType: () => 'user' | 'guest' | 'none';
  getCurrentUserId: () => string | null;
  getCurrentSessionId: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // initial
  isAuthenticated: false,
  isGuest: false,
  user: undefined,
  guestSession: undefined,
  guestContactInfo: undefined,
  userProfile: null,

  role: null,
  firstName: null,
  loading: false,
  initialized: false,
  error: null,
  authType: null,

  // OTP verification tracking
  lastVerifiedEmail: null,
  lastVerifiedPhone: null,
  lastVerifiedSessionId: null,
  lastVerifiedAt: null,
  lastVerifiedCheckoutId: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isGuest: false,
      authType: user ? 'user' : null,
    }),

  setUserProfile: (userProfile) => set({ userProfile }),
  setRole: (role) => set({ role }),
  setFirstName: (name) => set({ firstName: name }),
  setInitialized: (initialized) => set({ initialized }),
  clearError: () => set({ error: null }),

  updatePhoneNumber: async (phoneNumber: string) => {
    const { user } = get();
    if (!user) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await authService.updatePhoneNumber(user.uid, phoneNumber);

      // Update local state
      const currentProfile = get().userProfile;
      if (currentProfile) {
        set({
          userProfile: {
            ...currentProfile,
            phone_number: phoneNumber,
            phone_verified: true
          }
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update phone number' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Improved signIn: handle both immediate user return and session fallback
  signIn: async (email: string, password: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signIn(email, password);

      if (user) {
        // fetch profile
        const profile = await authService.getUserProfile(user.uid);

        set({
          user,
          role: profile?.role || 'user',
          firstName: profile?.first_name || user.displayName?.split(' ')[0] || '',
          userProfile: profile,
          isAuthenticated: true,
          authType: 'user',
          isGuest: false,
          loading: false,
        });

        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 100);
        }
      } else {
        set({ loading: false });
      }
    } catch (err: any) {
      set({ error: err?.message || String(err) || 'Sign in failed', loading: false });
      throw err;
    }
  },

  signUp: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
    password: string;
  }) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signUp(userData);

      if (user) {
        // Get profile
        const profile = await authService.getUserProfile(user.uid);

        set({
          user,
          role: profile?.role || 'user',
          firstName: userData.firstName,
          userProfile: profile,
          isAuthenticated: true,
          authType: 'user',
          isGuest: false,
          loading: false,
        });

        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 100);
        }
      } else {
        set({ loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      await authService.signInWithGoogle();
      // Auth state change will be handled by onAuthStateChanged listener
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({
      user: undefined,
      role: null,
      firstName: null,
      userProfile: null,
      isAuthenticated: false,
      isGuest: false,
      authType: null,
      guestSession: undefined,
      guestContactInfo: undefined,
    });
  },

  // guest helpers & other methods (unchanged) ...
  setGuestSessionFromAuth: (session: GuestSession) =>
    set({
      authType: 'guest',
      guestSession: session,
      guestContactInfo: {
        email: session.email,
        name: session.name,
        phone: session.phone,
      },
      isAuthenticated: false,
      isGuest: true,
      user: undefined,
    }),

  createGuestSession: async (contactInfo: GuestContactInfo): Promise<any | null> => {
    try {
      // Create guest session using order service
      const session = await orderService.createGuestSession(contactInfo as any);
      if (!session) return null;

      set({ 
        guestSession: { 
          ...session, 
          is_active: true,
          created_at: session.created_at || new Date().toISOString(),
          expires_at: session.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, 
        guestContactInfo: contactInfo, 
        isGuest: true,
        isAuthenticated: false,
        authType: 'guest'
      });

      // Store in sessionStorage for current session only
      if (session.guest_session_id) {
        sessionStorage.setItem('guest_session_id', session.guest_session_id);
      }

      return session;
    } catch (error) {
      console.error('Error creating guest session:', error);
      return null;
    }
  },

  setGuestSession: (session: GuestSession) =>
    set({
      guestSession: session,
      isGuest: true,
      isAuthenticated: false,
      authType: 'guest',
    }),

  updateGuestContactInfo: (contactInfo: GuestContactInfo) => set({ guestContactInfo: contactInfo }),

  validateGuestSession: async () => {
    const { guestSession } = get();
    if (!guestSession) return false;
    try {
      const isValid = await orderService.validateGuestSession(guestSession.guest_session_id);
      if (!isValid) {
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

  extendGuestSession: async (): Promise<boolean> => {
    const { guestSession } = get();
    if (!guestSession) return false;
    try {
      const extendedSession = await orderService.extendGuestSession(guestSession.guest_session_id);
      set({ 
        guestSession: { 
          ...extendedSession, 
          is_active: true,
          created_at: extendedSession.created_at || new Date().toISOString(),
          expires_at: extendedSession.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        } 
      });
      return true;
    } catch (error) {
      console.error('Failed to extend guest session:', error);
      return false;
    }
  },

  clearGuestSession: () => {
    // Clear sessionStorage data
    sessionStorage.removeItem('guest_session_id');
    
    set({
      guestSession: undefined,
      guestContactInfo: undefined,
      isGuest: false,
      authType: get().user ? 'user' : null,
      // Clear OTP verification when guest session is cleared
      lastVerifiedEmail: null,
      lastVerifiedPhone: null,
      lastVerifiedSessionId: null,
      lastVerifiedAt: null,
    });
  },

  // OTP verification methods
  setOtpVerification: (email: string, phone: string | null, sessionId: string, checkoutId?: string | null) =>
    set({
      lastVerifiedEmail: email,
      lastVerifiedPhone: phone,
      lastVerifiedSessionId: sessionId,
      lastVerifiedAt: new Date().toISOString(),
      lastVerifiedCheckoutId: checkoutId || null,
    }),

  clearOtpVerification: () =>
    set({
      lastVerifiedEmail: null,
      lastVerifiedPhone: null,
      lastVerifiedSessionId: null,
      lastVerifiedAt: null,
      lastVerifiedCheckoutId: null,
    }),

  isIdentityStillVerified: (currentEmail: string, currentPhone: string | null, currentSessionId: string, currentCheckoutId?: string | null) => {
    const state = get();
    // Must have all verification data
    if (!state.lastVerifiedEmail || !state.lastVerifiedSessionId || !state.lastVerifiedAt) {
      return false;
    }

    // Check if session ID matches (most important)
    if (state.lastVerifiedSessionId !== currentSessionId) {
      return false;
    }

    // If we have a checkout-scoped verification, enforce checkoutId match
    if (state.lastVerifiedCheckoutId && currentCheckoutId && state.lastVerifiedCheckoutId !== currentCheckoutId) {
      return false;
    }

    // Check if email matches
    if (state.lastVerifiedEmail !== currentEmail) {
      return false;
    }

    // Check if phone matches (if phone was verified)
    if (state.lastVerifiedPhone && state.lastVerifiedPhone !== currentPhone) {
      return false;
    }

    // Check if verification is recent (within 1 hour for guests, 24 hours for registered users)
    const verificationTime = new Date(state.lastVerifiedAt);
    const now = new Date();
    const timeDiff = now.getTime() - verificationTime.getTime();
    const maxAge = state.isGuest ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour vs 24 hours
    
    if (timeDiff > maxAge) {
      return false;
    }

    return true;
  },


  mergeGuestOrders: async (userId: string, guest_session_id?: string) => {
    try {
      const { guestContactInfo } = get();
      const sessionId = guest_session_id || get().guestSession?.guest_session_id;
      const result = await orderService.mergeGuestOrders(userId, sessionId, guestContactInfo);
      return result;
    } catch (error: any) {
      console.error('Failed to merge guest orders:', error);
      return {
        success: false,
        merged_orders_count: 0,
        total_merged_amount: 0,
        error: error?.message || 'Unknown error occurred',
      };
    }
  },

  getAuthenticationType: () => {
    const { user, isGuest } = get();
    if (user) return 'user';
    if (isGuest) return 'guest';
    return 'none';
  },

  getCurrentUserId: () => {
    const { user } = get();
    return user?.uid || null;
  },

  getCurrentSessionId: () => {
    const state = get();
    // First check for guest session in state
    if (state.guestSession?.guest_session_id) {
      return state.guestSession.guest_session_id;
    }
    // Check for guest session in sessionStorage as fallback
    const storedSessionId = sessionStorage.getItem('guest_session_id');
    if (storedSessionId) {
      return storedSessionId;
    }
    // Fall back to user ID if authenticated
    if (state.isAuthenticated && state.user?.uid) {
      return state.user.uid;
    }
    return null;
  }
}));

// Initialize store user from Firebase and subscribe to auth changes
let authStoreInitialized = false;

(async () => {
  if (authStoreInitialized) {
    return;
  }

  authStoreInitialized = true;

  try {
    // Check if we're in an auth callback context - if so, let the callback handle it
    const urlParams = new URLSearchParams(window.location.search);
    const isAuthCallback = urlParams.has('code') || urlParams.has('error') || window.location.pathname.includes('/auth/callback');

    if (isAuthCallback) {
      // Set up auth state listener for callback scenarios
      authService.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const profile = await authService.getUserProfile(user.uid);
            useAuthStore.getState().setUser(user);
            useAuthStore.getState().setUserProfile(profile);
            useAuthStore.getState().setRole(profile?.role || 'user');
            useAuthStore.getState().setFirstName(profile?.first_name || user.displayName?.split(' ')[0] || '');
          } catch (error) {
            console.error('Error ensuring profile during auth change:', error);
          }
        } else {
          useAuthStore.getState().setUser(undefined);
        }
      });
      // Mark as initialized for callback scenarios
      useAuthStore.getState().setInitialized(true);
      return;
    }

    // For non-callback scenarios, proceed with normal initialization
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      try {
        const profile = await authService.getUserProfile(currentUser.uid);
        useAuthStore.getState().setUser(currentUser);
        useAuthStore.getState().setUserProfile(profile);
        useAuthStore.getState().setRole(profile?.role || 'user');
        useAuthStore.getState().setFirstName(profile?.first_name || currentUser.displayName?.split(' ')[0] || '');
      } catch (error) {
        console.error('Error ensuring profile during init:', error);
      }
    }

    // Subscribe to auth state changes
    authService.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const profile = await authService.getUserProfile(user.uid);
          useAuthStore.getState().setUser(user);
          useAuthStore.getState().setUserProfile(profile);
          useAuthStore.getState().setRole(profile?.role || 'user');
          useAuthStore.getState().setFirstName(profile?.first_name || user.displayName?.split(' ')[0] || '');
        } catch (error) {
          console.error('Error ensuring profile during auth change:', error);
        }
      } else {
        useAuthStore.getState().setUser(undefined);
        useAuthStore.getState().setUserProfile(null);
        useAuthStore.getState().setRole(null);
        useAuthStore.getState().setFirstName(null);
      }
    });
  } catch (err) {
    console.error('Auth store initialization failed:', err);
    // Ensure we have a clean state on failure
    useAuthStore.getState().setUser(undefined);
  } finally {
    // Mark initialization as complete
    useAuthStore.getState().setInitialized(true);
  }
})();