// Error types for better error handling
export type OtpError =
  | 'INVALID_CONTACT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_CODE'
  | 'CODE_EXPIRED'
  | 'TOO_MANY_ATTEMPTS'
  | 'NO_ACTIVE_OTP'
  | 'EMAIL_SEND_FAILED'
  | 'SMS_SEND_FAILED'
  | 'NETWORK_ERROR'
  | 'MOBILE_OTP_NOT_SUPPORTED'
  | 'UNKNOWN_ERROR';

// Error messages (generic to avoid enumeration attacks)
export const OTP_ERROR_MESSAGES: Record<OtpError, string> = {
  INVALID_CONTACT: 'Please check your email/phone and try again.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment before trying again.',
  INVALID_CODE: 'Invalid OTP. Please try again.',
  CODE_EXPIRED: 'OTP expired. Please request a new code.',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later.',
  NO_ACTIVE_OTP: 'No active OTP found. Please request a new code.',
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again.',
  SMS_SEND_FAILED: 'Failed to send SMS. Please try again.',
  MOBILE_OTP_NOT_SUPPORTED: 'OTP via mobile number is not supported yet. Please use email OTP.',
  NETWORK_ERROR: 'Connection issue. Please check internet and try again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.'
};

// Request OTP API call
export async function requestOtp(
  identifier: string,
  channel: 'email' | 'phone',
  purpose: 'cod_verification' | 'phone_update' | 'cancel' | 'replacement' = 'cod_verification'
): Promise<{
  success: boolean;
  error?: OtpError;
  message?: string;
}> {
  try {
    // Use direct fetch to call the specific endpoint with correct path
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verify-otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        identifier,
        channel
      })
    });

    if (response.ok) {
      // Log successful request for analytics
      if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'function') {
        const gtag = window.gtag as (...args: unknown[]) => void;
        gtag('event', 'otp_requested', {
          channel,
          purpose,
          timestamp: new Date().toISOString()
        });
      }

      return { success: true, message: 'OTP sent successfully' };
    }

    // Handle specific error responses
    if (response.status === 429) {
      return { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many OTP requests, try again later' };
    }

    // Try to parse error response
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Unknown error occurred';
    console.error('OTP request backend error:', errorMessage);

    // Map common errors to generic messages
    if (response.status === 400) {
      if (errorData.error === 'rate_limited') {
        return { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please wait before trying again' };
      }
      if (errorData.error === 'email_send_failed') {
        return { success: false, error: 'EMAIL_SEND_FAILED', message: 'Failed to send verification email' };
      }
      if (errorData.error === 'sms_send_failed') {
        return { success: false, error: 'SMS_SEND_FAILED', message: 'Failed to send verification SMS' };
      }
      if (errorData.error === 'mobile_otp_not_supported') {
        return { success: false, error: 'MOBILE_OTP_NOT_SUPPORTED', message: 'OTP via mobile number is not supported yet. Please use email OTP.' };
      }
      return { success: false, error: 'INVALID_CONTACT', message: errorMessage };
    }

    return { success: false, error: 'NETWORK_ERROR', message: errorMessage };
  } catch (err) {
    console.error('OTP request failed:', err);
    return { success: false, error: 'NETWORK_ERROR', message: 'Connection error. Please check your internet and try again.' };
  }
}

// Verify OTP API call
export async function verifyOtp(
  identifier: string,
  channel: 'email' | 'phone',
  otp: string,
  purpose?: 'cod_verification' | 'phone_update' | 'cancel' | 'replacement'
): Promise<{
  success: boolean;
  error?: OtpError;
  codAuthToken?: string;
  message?: string;
}> {
  try {
    // Use direct fetch to call the specific endpoint with correct path
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verify-otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        identifier,
        channel,
        otp
      })
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        codAuthToken: data.codAuthToken || `token_${Date.now()}`,
        message: 'Verification successful'
      };
    }

    // Handle specific error responses
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error === 'invalid_otp') {
        return { success: false, error: 'INVALID_CODE', message: 'Invalid OTP' };
      }
      if (errorData.error === 'no_active_otp') {
        return { success: false, error: 'NO_ACTIVE_OTP', message: 'No active OTP session' };
      }
      if (errorData.error === 'otp_expired') {
        return { success: false, error: 'CODE_EXPIRED', message: 'OTP expired' };
      }
      return { success: false, error: 'INVALID_CODE', message: 'Invalid OTP' };
    }

    if (response.status === 429) {
      return { success: false, error: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts' };
    }

    // Try to parse error response
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Unknown error occurred';
    console.error('OTP verification backend error:', errorMessage);

    // Handle specific backend errors
    if (errorData.error === 'too_many_attempts') {
      return { success: false, error: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts' };
    }
    if (errorData.error === 'no_active_otp') {
      return { success: false, error: 'NO_ACTIVE_OTP', message: 'No active OTP session' };
    }
    if (errorData.error === 'otp_expired') {
      return { success: false, error: 'CODE_EXPIRED', message: 'OTP expired' };
    }

    return { success: false, error: 'NETWORK_ERROR', message: errorMessage };
  } catch (err) {
    console.error('OTP verification failed:', err);
    return { success: false, error: 'NETWORK_ERROR', message: 'Connection error. Please check your internet and try again.' };
  }
}

// Utility function to check if contact is valid
export function validateContact(identifier: string, channel: 'email' | 'phone'): boolean {
  if (channel === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }

  if (channel === 'phone') {
    // Basic phone validation (libphonenumber-js would be better here)
    const phoneRegex = /^[+]?[0-9\-()\s]{10,15}$/;
    return phoneRegex.test(identifier.replace(/\s/g, ''));
  }

  return false;
}
