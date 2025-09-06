import { useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import { GuestService } from '@lib/services/guestService';
import type { GuestContactInfo } from '@lib/validation/checkout';

export const useGuestSession = () => {
  const guestSession = useAuthStore((state) => state.guestSession);
  const guestContactInfo = useAuthStore((state) => state.guestContactInfo);
  const setGuestSession = useAuthStore((state) => state.setGuestSession);
  const clearGuestSession = useAuthStore((state) => state.clearGuestSession);

  const createSession = useCallback(async (contactInfo: GuestContactInfo) => {
    try {
      const session = await GuestService.createSession(contactInfo);
      if (session) {
        setGuestSession(session);
        return session;
      }
      return null;
    } catch (error) {
      console.error('Failed to create guest session:', error);
      return null;
    }
  }, [setGuestSession]);

  const validateSession = useCallback(async () => {
    if (!guestSession?.guest_session_id) return false;
    return await GuestService.validateSession(guestSession.guest_session_id);
  }, [guestSession?.guest_session_id]);

  const extendSession = useCallback(async () => {
    if (!guestSession?.guest_session_id) return false;
    return await GuestService.extendSession(guestSession.guest_session_id);
  }, [guestSession?.guest_session_id]);

  const getSessionId = useCallback(() => {
    return guestSession?.guest_session_id || null;
  }, [guestSession?.guest_session_id]);

  return {
    guestSession,
    guestContactInfo,
    sessionId: getSessionId(),
    createSession,
    validateSession,
    extendSession,
    clearSession: clearGuestSession
  };
};
