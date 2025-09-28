import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

export interface GuestSession {
  guest_session_id: string;
  email: string;
  phone?: string;
  name?: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface GuestContactInfo {
  email: string;
  phone?: string;
  name?: string;
}

interface GuestSessionStore {
  session: GuestSession | null;
  contactInfo: GuestContactInfo | null;
  isGuest: boolean;
  createSession: (contactInfo: GuestContactInfo) => Promise<GuestSession | null>;
  updateContactInfo: (info: Partial<GuestContactInfo>) => void;
  clearSession: () => void;
  validateSession: () => Promise<boolean>;
  getSessionId: () => string | null;
}

export const useGuestSession = create<GuestSessionStore>()(
  persist(
    (set, get) => ({
      session: null,
      contactInfo: null,
      isGuest: false,

      createSession: async (contactInfo) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-guest-session', {
            body: contactInfo
          });

          if (error || !data) {
            console.error('Failed to create guest session:', error);
            return null;
          }

          const session = data as GuestSession;
          set({
            session,
            contactInfo: {
              email: session.email,
              phone: session.phone || contactInfo.phone,
              name: session.name || contactInfo.name
            },
            isGuest: true
          });

          return session;
        } catch (error) {
          console.error('Error creating guest session:', error);
          return null;
        }
      },

      updateContactInfo: (info) => {
        const { contactInfo } = get();
        if (contactInfo) {
          set({
            contactInfo: { ...contactInfo, ...info }
          });
        }
      },

      clearSession: () => {
        set({
          session: null,
          contactInfo: null,
          isGuest: false
        });
      },

      validateSession: async () => {
        const { session } = get();
        if (!session) return false;

        try {
          const { data } = await supabase.functions.invoke('validate-guest-session', {
            body: { session_id: session.guest_session_id }
          });
          return data?.is_valid === true;
        } catch (error) {
          console.error('Error validating session:', error);
          return false;
        }
      },

      getSessionId: () => {
        const { session } = get();
        return session?.guest_session_id || null;
      }
    }),
    {
      name: 'guest-session-storage',
      partialize: (state) => ({
        session: state.session,
        contactInfo: state.contactInfo,
        isGuest: state.isGuest
      })
    }
  )
);
