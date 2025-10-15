import React, { useState, useCallback, useRef } from 'react';
import { requestOtp, verifyOtp, validateContact, type OtpError } from '../lib/otpApi';

export interface OtpState {
  // Request state
  isRequesting: boolean;
  requestError: OtpError | null;

  // Verification state
  isVerifying: boolean;
  verifyError: OtpError | null;

  // Timer state
  cooldownRemaining: number;
  canResend: boolean;

  // Attempt tracking
  attemptsLeft: number;
  maxAttempts: number;

  // Success state
  isVerified: boolean;
  codAuthToken: string | null;
  otpValue: string;
}

export interface UseOtpOptions {
  maxAttempts?: number;
  cooldownDuration?: number; // in seconds
  maxResends?: number;
}

export interface UseOtpReturn extends OtpState {
  otpValue: string;

  // Actions
  requestOtp: (contact: string, method: 'email' | 'phone', purpose?: 'cod_verification') => Promise<boolean>;
  verifyOtp: (contact: string, method: 'email' | 'phone', code: string, purpose?: 'cod_verification') => Promise<boolean>;
  reset: () => void;
  clearErrors: () => void;
  handleOtpChange: (value: string) => void;
}

const DEFAULT_OPTIONS: UseOtpOptions = {
  maxAttempts: 3,
  cooldownDuration: 60, // 60 seconds
  maxResends: 3
};

export function useOtp(options: UseOtpOptions = {}): UseOtpReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resendCountRef = useRef(0);

  const [state, setState] = useState<OtpState>({
    isRequesting: false,
    requestError: null,
    isVerifying: false,
    verifyError: null,
    cooldownRemaining: 0,
    canResend: true,
    attemptsLeft: opts.maxAttempts!,
    maxAttempts: opts.maxAttempts!,
    isVerified: false,
    codAuthToken: null,
    otpValue: ''
  });

  // Start cooldown timer
  const startCooldown = useCallback(() => {
    setState(prev => ({ ...prev, cooldownRemaining: opts.cooldownDuration!, canResend: false }));

    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setInterval(() => {
      setState(prev => {
        const newRemaining = prev.cooldownRemaining - 1;
        if (newRemaining <= 0) {
          clearInterval(cooldownTimerRef.current!);
          cooldownTimerRef.current = null;
          return { ...prev, cooldownRemaining: 0, canResend: true };
        }
        return { ...prev, cooldownRemaining: newRemaining };
      });
    }, 1000);
  }, [opts.cooldownDuration]);

  // Request OTP function
  const requestOtpHandler = useCallback(async (
    contact: string,
    method: 'email' | 'phone',
    purpose: 'cod_verification' = 'cod_verification'
  ): Promise<boolean> => {
    // Validate contact format
    if (!validateContact(contact, method)) {
      setState(prev => ({ ...prev, requestError: 'INVALID_CONTACT' }));
      return false;
    }

    // Check resend limits
    if (resendCountRef.current >= opts.maxResends!) {
      setState(prev => ({ ...prev, requestError: 'RATE_LIMIT_EXCEEDED' }));
      return false;
    }

    setState(prev => ({
      ...prev,
      isRequesting: true,
      requestError: null,
      canResend: false
    }));

    try {
      const result = await requestOtp(contact, method, purpose);

      if (result.success) {
        resendCountRef.current++;
        startCooldown();
        return true;
      } else {
        setState(prev => ({
          ...prev,
          requestError: result.error || 'UNKNOWN_ERROR'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        requestError: 'NETWORK_ERROR'
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isRequesting: false }));
    }
  }, [startCooldown, opts.maxResends]);

  // Verify OTP function
  const verifyOtpHandler = useCallback(async (
    contact: string,
    method: 'email' | 'phone',
    code: string,
    purpose: 'cod_verification' = 'cod_verification'
  ): Promise<boolean> => {
    if (code.length !== 6) {
      setState(prev => ({ ...prev, verifyError: 'INVALID_CODE' }));
      return false;
    }

    setState(prev => ({
      ...prev,
      isVerifying: true,
      verifyError: null
    }));

    try {
      const result = await verifyOtp(contact, method, code, purpose);

      if (result.success && result.codAuthToken) {
        setState(prev => ({
          ...prev,
          isVerified: true,
          codAuthToken: result.codAuthToken,
          verifyError: null,
          attemptsLeft: opts.maxAttempts!
        }));
        return true;
      } else {
        const newAttemptsLeft = state.attemptsLeft - 1;
        setState(prev => ({
          ...prev,
          verifyError: result.error || 'INVALID_CODE',
          attemptsLeft: Math.max(0, newAttemptsLeft)
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        verifyError: 'NETWORK_ERROR'
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isVerifying: false }));
    }
  }, [state.attemptsLeft, opts.maxAttempts]);

  // Reset function
  const reset = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }

    resendCountRef.current = 0;

    setState({
      isRequesting: false,
      requestError: null,
      isVerifying: false,
      verifyError: null,
      cooldownRemaining: 0,
      canResend: true,
      attemptsLeft: opts.maxAttempts!,
      maxAttempts: opts.maxAttempts!,
      isVerified: false,
      codAuthToken: null,
      otpValue: ''
    });
  }, [opts.maxAttempts]);

  // Clear errors function
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      requestError: null,
      verifyError: null
    }));
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  // Handle OTP input change
  const handleOtpChange = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      otpValue: value,
      verifyError: null // Clear error when user types
    }));
  }, []);

  return {
    ...state,
    otpValue: state.otpValue,
    requestOtp: requestOtpHandler,
    verifyOtp: verifyOtpHandler,
    reset,
    clearErrors,
    handleOtpChange
  };
}
