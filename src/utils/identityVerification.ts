import { useAuthStore } from '@store/authStore';
import { getIdentity } from './identitySource';

/**
 * Check if current identity is still verified for OTP
 * This function verifies that the OTP verification is still valid for the current session and identity
 */
export function isCurrentIdentityVerified(checkoutId?: string | null): boolean {
  const authStore = useAuthStore.getState();
  const currentIdentity = getIdentity();
  
  // Get current session ID
  const currentSessionId = authStore.getCurrentSessionId();
  
  if (!currentSessionId || !currentIdentity.email) {
    return false;
  }
  
  return authStore.isIdentityStillVerified(
    currentIdentity.email,
    currentIdentity.phone || null,
    currentSessionId,
    checkoutId || null
  );
}

/**
 * Mark current identity as OTP verified
 * This should be called after successful OTP verification
 */
export function markCurrentIdentityVerified(checkoutId?: string | null): void {
  const authStore = useAuthStore.getState();
  const currentIdentity = getIdentity();
  const currentSessionId = authStore.getCurrentSessionId();
  
  if (currentSessionId && currentIdentity.email) {
    authStore.setOtpVerification(
      currentIdentity.email,
      currentIdentity.phone || null,
      currentSessionId,
      checkoutId || null
    );
  }
}

/**
 * Clear OTP verification for current identity
 * This should be called when identity changes or session expires
 */
export function clearIdentityVerification(): void {
  useAuthStore.getState().clearOtpVerification();
}

/**
 * Check if OTP verification should be required based on identity and session changes
 * Returns true if OTP verification is needed
 */
export function shouldRequireOtpVerification(checkoutId?: string | null): boolean {
  const authStore = useAuthStore.getState();
  const currentIdentity = getIdentity();
  const currentSessionId = authStore.getCurrentSessionId();
  
  // Always require OTP for guests without verification
  if (authStore.isGuest && !isCurrentIdentityVerified(checkoutId)) {
    return true;
  }
  
  // For registered users, only require OTP if phone is missing
  if (!authStore.isGuest && currentIdentity.isPhoneMissing) {
    return true;
  }
  
  // If no session ID, require OTP
  if (!currentSessionId) {
    return true;
  }
  
  // If identity is not verified, require OTP
  return !isCurrentIdentityVerified(checkoutId);
}

/**
 * Get verification status details for debugging
 */
export function getVerificationStatus(): {
  isVerified: boolean;
  lastVerifiedEmail: string | null;
  lastVerifiedPhone: string | null;
  lastVerifiedSessionId: string | null;
  lastVerifiedAt: string | null;
  currentEmail: string;
  currentPhone: string | null;
  currentSessionId: string | null;
  isGuest: boolean;
} {
  const authStore = useAuthStore.getState();
  const currentIdentity = getIdentity();
  const currentSessionId = authStore.getCurrentSessionId();
  
  return {
    isVerified: isCurrentIdentityVerified(),
    lastVerifiedEmail: authStore.lastVerifiedEmail,
    lastVerifiedPhone: authStore.lastVerifiedPhone,
    lastVerifiedSessionId: authStore.lastVerifiedSessionId,
    lastVerifiedAt: authStore.lastVerifiedAt,
    currentEmail: currentIdentity.email,
    currentPhone: currentIdentity.phone || null,
    currentSessionId,
    isGuest: authStore.isGuest,
  };
}
