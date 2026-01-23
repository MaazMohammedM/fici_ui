import { useAuthStore } from '@store/authStore';
import { useGuestSession } from '@lib/guestSession';
import type { GuestContactInfo } from '../types/guest';

export interface OtpIdentity {
  email: string;
  phone?: string;
  name?: string;
  isRegistered: boolean;
  userId?: string;
}

export interface IdentityFields {
  email: {
    value: string;
    readOnly: boolean;
    disabled: boolean;
  };
  phone: {
    value: string;
    readOnly: boolean;
    disabled: boolean;
  };
  name?: {
    value: string;
    readOnly: boolean;
    disabled: boolean;
  };
}

/**
 * Get OTP identity data for the current user (registered or guest)
 */
export function getOtpIdentity(): OtpIdentity {
  const { user, userProfile } = useAuthStore.getState();
  const { session: guestSession } = useGuestSession.getState();

  if (user && userProfile) {
    // Registered user
    return {
      email: user.email || userProfile.email || '',
      phone: userProfile.phone_number || undefined,
      name: userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : undefined,
      isRegistered: true,
      userId: user.id
    };
  } else if (guestSession) {
    // Guest user
    return {
      email: guestSession.email || '',
      phone: guestSession.phone || undefined,
      name: guestSession.name || undefined,
      isRegistered: false
    };
  }

  // Fallback - should not happen in normal flow
  return {
    email: '',
    phone: undefined,
    name: undefined,
    isRegistered: false
  };
}

/**
 * Check if user has missing phone number
 */
export function shouldShowMissingPhoneMessage(userProfile?: any): boolean {
  const { user, userProfile: storeProfile } = useAuthStore.getState();
  const profile = userProfile || storeProfile;
  
  return !!(user && profile && !profile.phone_number);
}

/**
 * Get non-editable identity fields for OTP forms
 */
export function getNonEditableIdentityFields(): IdentityFields {
  const identity = getOtpIdentity();

  return {
    email: {
      value: identity.email,
      readOnly: true,
      disabled: true
    },
    phone: {
      value: identity.phone || '',
      readOnly: true,
      disabled: true
    },
    ...(identity.name && {
      name: {
        value: identity.name,
        readOnly: true,
        disabled: true
      }
    })
  };
}

/**
 * Get display text for missing phone number scenario
 */
export function getMissingPhoneMessage(): string {
  return "This verified number will be added to your FICI account as your registered mobile number.";
}

/**
 * Get message for phone verification when phone is missing
 */
export function getPhoneVerificationMessage(): string {
  return "We will verify this number and save it to your account.";
}

/**
 * Validate OTP identity before sending OTP
 */
export function validateOtpIdentity(identity: OtpIdentity, method: 'email' | 'phone'): {
  isValid: boolean;
  error?: string;
} {
  if (method === 'email' && !identity.email) {
    return { isValid: false, error: 'Email address is required' };
  }

  if (method === 'phone' && !identity.phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Basic email validation
  if (method === 'email' && identity.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identity.email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
  }

  // Basic phone validation
  if (method === 'phone' && identity.phone) {
    const phoneRegex = /^[+]?[0-9\-()\s]{10,15}$/;
    if (!phoneRegex.test(identity.phone)) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }
  }

  return { isValid: true };
}

/**
 * Get contact identifier for OTP API calls
 */
export function getOtpContact(identity: OtpIdentity, method: 'email' | 'phone'): string {
  return method === 'email' ? identity.email : (identity.phone || '');
}
