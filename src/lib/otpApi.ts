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
    // Import orderService dynamically to avoid circular dependencies
    const { orderService } = await import('@/services/orderService');
    
    const result = await orderService.sendOtp(identifier, channel, purpose);

    if (result.success) {
      // Log successful request for analytics
      if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'function') {
        const gtag = window.gtag as (...args: unknown[]) => void;
        gtag('event', 'otp_requested', {
          channel,
          purpose,
          timestamp: new Date().toISOString()
        });
      }

      return { success: true, message: result.message || 'OTP sent successfully' };
    }

    // Map error messages to OTP error types
    let otpError: OtpError = 'UNKNOWN_ERROR';
    if (result.error) {
      const errorLower = result.error.toLowerCase();
      if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
        otpError = 'RATE_LIMIT_EXCEEDED';
      } else if (errorLower.includes('email send failed')) {
        otpError = 'EMAIL_SEND_FAILED';
      } else if (errorLower.includes('sms send failed')) {
        otpError = 'SMS_SEND_FAILED';
      } else if (errorLower.includes('mobile otp not supported')) {
        otpError = 'MOBILE_OTP_NOT_SUPPORTED';
      } else if (errorLower.includes('invalid contact')) {
        otpError = 'INVALID_CONTACT';
      }
    }

    return { 
      success: false, 
      error: otpError, 
      message: result.message || OTP_ERROR_MESSAGES[otpError]
    };
  } catch (err: any) {
    console.error('OTP request failed:', err);
    return { 
      success: false, 
      error: 'NETWORK_ERROR', 
      message: 'Connection error. Please check your internet and try again.' 
    };
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
    // Import orderService dynamically to avoid circular dependencies
    const { orderService } = await import('@/services/orderService');
    
    const result = await orderService.verifyOtp(identifier, channel, otp, purpose);

    if (result.success) {
      return {
        success: true,
        codAuthToken: result.codAuthToken || `token_${Date.now()}`,
        message: result.message || 'Verification successful'
      };
    }

    // Map error messages to OTP error types
    let otpError: OtpError = 'UNKNOWN_ERROR';
    if (result.error) {
      const errorLower = result.error.toLowerCase();
      if (errorLower.includes('invalid otp') || errorLower.includes('invalid code')) {
        otpError = 'INVALID_CODE';
      } else if (errorLower.includes('no active otp')) {
        otpError = 'NO_ACTIVE_OTP';
      } else if (errorLower.includes('otp expired')) {
        otpError = 'CODE_EXPIRED';
      } else if (errorLower.includes('too many attempts')) {
        otpError = 'TOO_MANY_ATTEMPTS';
      }
    }

    return { 
      success: false, 
      error: otpError, 
      message: result.message || OTP_ERROR_MESSAGES[otpError]
    };
  } catch (err: any) {
    console.error('OTP verification failed:', err);
    return { 
      success: false, 
      error: 'NETWORK_ERROR', 
      message: 'Connection error. Please check your internet and try again.' 
    };
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
