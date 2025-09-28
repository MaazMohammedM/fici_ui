/**
 * Manages guest session storage and retrieval
 */

const GUEST_SESSION_KEY = 'guest_session_id';

/**
 * Get the current guest session ID
 */
export const getGuestSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GUEST_SESSION_KEY);
};

/**
 * Create or retrieve a guest session ID
 */
export const ensureGuestSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  }
  
  return sessionId;
};

/**
 * Clear the guest session ID
 */
export const clearGuestSession = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_SESSION_KEY);
};

/**
 * Get headers with guest session for API requests
 */
export const getGuestHeaders = (): HeadersInit => {
  const headers: HeadersInit = {};
  const guestSessionId = getGuestSessionId();
  
  if (guestSessionId) {
    headers['x-guest-session-id'] = guestSessionId;
  }
  
  return headers;
};
