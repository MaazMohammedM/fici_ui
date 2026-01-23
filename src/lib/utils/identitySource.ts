import { useAuthStore } from '../../store/authStore';

export interface Identity {
  name?: string;
  email: string;
  phone?: string;
  type: 'guest' | 'registered';
  userId?: string;
  isPhoneMissing?: boolean;
}

export interface LockedIdentityFields {
  name?: {
    value: string;
    readOnly: boolean;
    disabled: boolean;
  };
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
}

/**
 * Get current identity from auth store or guest session
 */
export function getIdentity(): Identity {
  const { user, userProfile, guestSession } = useAuthStore.getState();

  if (user && userProfile) {
    // Registered user
    return {
      name: userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : undefined,
      email: user.email || userProfile.email || '',
      phone: userProfile.phone_number || undefined,
      type: 'registered',
      userId: user.id,
      isPhoneMissing: !userProfile.phone_number
    };
  } else if (guestSession) {
    // Guest user
    return {
      name: guestSession.name,
      email: guestSession.email,
      phone: guestSession.phone,
      type: 'guest'
    };
  }

  // Fallback
  return {
    email: '',
    type: 'guest'
  };
}

/**
 * Check if phone number is missing for registered user
 */
export function isPhoneMissing(): boolean {
  const { user, userProfile } = useAuthStore.getState();
  return !!(user && userProfile && !userProfile.phone_number);
}

/**
 * Check if guest identity is locked (session exists)
 */
export function isGuestIdentityLocked(): boolean {
  const { guestSession } = useAuthStore.getState();
  return !!(guestSession && guestSession.is_active);
}

/**
 * Get locked identity fields for forms
 */
export function getLockedIdentityFields(): LockedIdentityFields {
  const identity = getIdentity();
  const isGuestLocked = isGuestIdentityLocked();

  return {
    ...(identity.name && {
      name: {
        value: identity.name,
        readOnly: identity.type === 'registered' || isGuestLocked,
        disabled: identity.type === 'registered' || isGuestLocked
      }
    }),
    email: {
      value: identity.email,
      readOnly: identity.type === 'registered' || isGuestLocked,
      disabled: identity.type === 'registered' || isGuestLocked
    },
    phone: {
      value: identity.phone || '',
      readOnly: identity.type === 'registered' || isGuestLocked,
      disabled: identity.type === 'registered' || isGuestLocked
    }
  };
}

/**
 * Get helper text for phone verification when phone is missing
 */
export function getPhoneVerificationHelperText(): string {
  return "To complete checkout, verify your mobile number. This will be saved to your FICI account.";
}

/**
 * Get helper text for guest identity locked
 */
export function getGuestLockedHelperText(): string {
  return "Click Change Info to edit guest details.";
}

/**
 * Get helper text for delivery phone vs account phone
 */
export function getDeliveryPhoneHelperText(): string {
  return "Delivery phone number is used only by courier for delivery updates.";
}

/**
 * Validate OTP identity for verification
 */
export function validateOtpIdentity(identity: Identity, method: 'email' | 'phone'): { isValid: boolean; error?: string; requiresPhoneAddition?: boolean } {
  if (!identity.email) {
    return { isValid: false, error: 'Email is required for verification' };
  }
  
  if (method === 'phone' && !identity.phone) {
    // For registered users without phone, allow them to add phone number
    if (identity.type === 'registered') {
      return { 
        isValid: false, 
        error: 'Phone number is required for SMS verification. Please add your phone number to continue.',
        requiresPhoneAddition: true 
      };
    }
    return { isValid: false, error: 'Phone number is required for SMS verification' };
  }
  
  if (identity.type === 'registered' && !identity.userId) {
    return { isValid: false, error: 'User ID is required for registered users' };
  }
  
  return { isValid: true };
}

/**
 * Get OTP contact based on method and identity
 */
export function getOtpContact(identity: Identity, method: 'email' | 'phone'): string | null {
  if (method === 'email') {
    return identity.email || null;
  }
  return identity.phone || null;
}
