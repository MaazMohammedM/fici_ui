// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@lib/supabase';
import { GuestService } from '../lib/services/guestService';
import type { 
  GuestSession, 
  GuestContactInfo, 
  AuthenticationState,
  GuestOrderSummary,
  GuestOrderMergeResult 
} from '../types/guest';


interface AuthState extends AuthenticationState {
  role: string | null;
  firstName: string | null;
  userProfile: any | null;
  loading: boolean;
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

  createGuestSession: (contactInfo: GuestContactInfo) => Promise<GuestSession | null>;
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

export const useAuthStore = create<AuthState>()((set, get) => ({
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
      clearError: () => set({ error: null }),

      updatePhoneNumber: async (phoneNumber: string) => {
        const { user } = get();
        if (!user) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ loading: true, error: null });
        try {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              phone_number: phoneNumber,
              phone_verified: true 
            })
            .eq('user_id', user.id);

          if (updateError) throw updateError;

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
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });

          if (error) {
            set({ error: error.message || 'Sign in failed', loading: false });
            throw error;
          }

          let user = data?.user ?? null;

          if (!user) {
            const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr) {
              console.warn('getSession error after signIn:', sessionErr);
            }
            user = sessionData?.session?.user!;
          }

          if (user) {
            // fetch profile (if any)
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('role, first_name')
              .eq('user_id', user.id)
              .single();

            // Handle different error scenarios
            if (profileError) {
              if (profileError.code === 'PGRST116') {
                // Profile doesn't exist, create it
              } else {
                console.error('Profile query failed in signIn:', profileError);
                set({ error: profileError.message || 'Profile query failed', loading: false });
                throw profileError;
              }
            }

            // Create profile if it doesn't exist
            if (!profile) {
              const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';

              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: user.id,
                  email: user.email,
                  first_name: firstName || 'User',
                  role: 'user'
                });

              if (insertError) {
                console.error('Profile creation failed in signIn:', insertError);
                // Don't throw error if profile already exists (duplicate key)
                if (insertError.code !== '23505') {
                  set({ error: insertError.message || 'Profile creation failed', loading: false });
                  throw insertError;
                }
              } else {
              }
            } else {
            }

            set({
              user,
              role: profile?.role || 'user', // ✅ Use correct default role
              firstName: profile?.first_name || user.user_metadata?.first_name || '',
              isAuthenticated: true,
              authType: 'user',
              isGuest: false,
              loading: false,
            });

            // Guest order checking disabled

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
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                first_name: userData.firstName,
                last_name: userData.lastName,
                mobile: userData.mobile || null,
                role: 'user',
              },
            },
          });
          if (error) throw error;

          if (data.user) {
            // Create profile for new user
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: data.user.id,
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone_number: userData.mobile || null,
                role: 'user' // ✅ Use correct default role
              });

            if (insertError) {
              console.error('Profile creation failed in signUp:', insertError);
              // Don't throw error if profile already exists (duplicate key)
              if (insertError.code !== '23505') {
                set({ error: insertError.message || 'Profile creation failed', loading: false });
                throw insertError;
              }
            }

            set({
              user: data.user,
              role: 'user', // ✅ Use correct default role
              firstName: userData.firstName,
              isAuthenticated: true,
              authType: 'user',
              isGuest: false,
              loading: false,
            });

            // Guest order checking disabled

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
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
          if (error) throw error;
          // session will be handled by callback route
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: undefined,
          role: null,
          firstName: null,
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

      createGuestSession: async (contactInfo: GuestContactInfo) => {
        try {
          // Always use edge function to create or fetch a valid guest session
          const session = await GuestService.createSession(contactInfo as any);
          if (!session) return null;

          set({ 
            guestSession: session, 
            guestContactInfo: contactInfo, 
            isGuest: true,
            // Keep isAuthenticated false for guest; use authType to identify context
            isAuthenticated: false,
            authType: 'guest'
          });

          // Store in sessionStorage for current session only
          if (session.guest_session_id) {
            sessionStorage.setItem('guest_session_id', session.guest_session_id);
          }

          return session;
        } catch (error) {
          console.error('Error creating guest session (edge):', error);
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
          const { data, error } = await supabase.functions.invoke('validate-guest-session', {
            body: { guest_session_id: guestSession.guest_session_id },
          });
          if (error || !data?.valid) {
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
            body: { guest_session_id: guestSession.guest_session_id },
          });
          if (error) throw error;
          set({ guestSession: data as GuestSession });
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
          const { data, error } = await supabase.functions.invoke('merge-guest-orders', {
            body: { user_id: userId, guest_session_id: sessionId, guest_contact_info: guestContactInfo },
          });
          if (error) throw error;
          return data as GuestOrderMergeResult;
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
        return user?.id || null;
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
        if (state.isAuthenticated && state.user?.id) {
          return state.user.id;
        }
        return null;
      },
    })
);

const ensureUserProfile = async (user: any) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile query failed:', profileError);
      return;
    }

    if (!profile) {
      // Create new profile for users (OAuth or email/password)
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const firstName = user.user_metadata?.first_name || user.user_metadata?.given_name || fullName.split(' ')[0] || '';

      try {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: user.id,
              email: user.email,
              first_name: firstName || 'User',
              role: 'user'
            }
          ]);

        if (insertError) {
          if (insertError.code !== '23505') {
            return;
          }
        } else {
          useAuthStore.getState().setFirstName(firstName);
          useAuthStore.getState().setRole('user');
        }
      } catch (insertError) {
        console.error('Profile insert failed:', insertError);
        return;
      }
    } else {
      // Update store with existing profile data
      useAuthStore.getState().setFirstName(profile.first_name || '');
      useAuthStore.getState().setRole(profile.role || 'user');
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    // Don't let profile errors break auth flow
  }
};

// Initialize store user from Supabase and subscribe to auth changes
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
      supabase.auth.onAuthStateChange(async (_event, session) => {

        const user = session?.user;
        if (user) {
          ensureUserProfile(user).catch(error => {
            console.error('Error ensuring profile during auth change:', error);
          });
          useAuthStore.getState().setUser(user);
        } else {
          useAuthStore.getState().setUser(undefined);
        }
      });
      return;
    }

    // For non-callback scenarios, proceed with normal initialization
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      // Ensure user profile exists for authenticated users (non-blocking)
      ensureUserProfile(data.user).catch(error => {
        console.error('Error ensuring profile during init:', error);
      });
      useAuthStore.getState().setUser(data.user);
    }

    // subscribe to changes so your UI syncs with Supabase auth state
    supabase.auth.onAuthStateChange(async (_event, session) => {

      const user = session?.user;
      if (user) {
        // Ensure user profile exists when auth state changes (non-blocking)
        ensureUserProfile(user).catch(error => {
          console.error('Error ensuring profile during auth change:', error);
        });
        useAuthStore.getState().setUser(user);
      } else {
        useAuthStore.getState().setUser(undefined);
      }
    });
  } catch (err) {
    console.error('Auth store initialization failed:', err);
    // Ensure we have a clean state on failure
    useAuthStore.getState().setUser(undefined);
  }
})();