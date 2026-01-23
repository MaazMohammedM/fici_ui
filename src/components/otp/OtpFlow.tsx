import React, { useState, useEffect, useCallback } from 'react';
import { useOtp } from '../../hooks/useOtp';
import { OtpMethodSelector } from './OtpMethodSelector';
import { SendOtpButton } from './SendOtpButton';
import { OtpInput } from './OtpInput';
import { ResendLink } from './ResendLink';
import { OTP_ERROR_MESSAGES } from '../../lib/otpApi';
import { useAuthStore } from '@store/authStore';
import { getIdentity, isPhoneMissing, getOtpContact, validateOtpIdentity } from '../../utils/identitySource';
import { getVerificationStatus, isCurrentIdentityVerified, shouldRequireOtpVerification, markCurrentIdentityVerified } from '../../utils/identityVerification';

interface OtpFlowProps {
  purpose?: 'cod_verification' | 'phone_update' | 'cancel' | 'replacement';
  onVerified: (codAuthToken: string) => void;
  onCancel?: () => void;
  prefilledMethod?: 'email' | 'phone';
  className?: string;
  userType?: 'guest' | 'registered';
  initialEmail?: string;
  initialPhone?: string;
  checkoutSessionId?: string | null;
}

export const OtpFlow: React.FC<OtpFlowProps> = ({
  purpose = 'cod_verification',
  onVerified,
  onCancel,
  prefilledMethod = 'email',
  className = '',
  userType = 'guest',
  initialEmail,
  initialPhone,
  checkoutSessionId
}) => {
  const [method, setMethod] = useState<'email' | 'phone'>(prefilledMethod);
  const [step, setStep] = useState<'method' | 'otp' | 'phone_addition' | 'success'>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState(() => {
    const base = getIdentity();
    const identityWithPhone = {
      ...base,
      email: initialEmail || base.email,
      phone: initialPhone || base.phone
    };
    // Ensure phone is always a string for the state (convert undefined to empty string)
    return {
      ...identityWithPhone,
      phone: identityWithPhone.phone || ''
    };
  });
  const [verificationStatus, setVerificationStatus] = useState(getVerificationStatus());
  const [isOtpRequired, setIsOtpRequired] = useState(true);
  const [initialMethodSet, setInitialMethodSet] = useState(false);
  
  const { userProfile, updatePhoneNumber } = useAuthStore();

  const otp = useOtp({
    maxAttempts: 3,
    cooldownDuration: 60,
    maxResends: 3
  });

  // Initialize state from auth store and verification status
  useEffect(() => {
    const baseIdentity = getIdentity();
    const currentIdentity = {
      ...baseIdentity,
      email: initialEmail || baseIdentity.email,
      phone: initialPhone || baseIdentity.phone
    };
    // Ensure phone is always a string for the state (convert undefined to empty string)
    const identityForState = {
      ...currentIdentity,
      phone: currentIdentity.phone || ''
    };
    const currentVerificationStatus = getVerificationStatus();
    
    setIdentity(identityForState);
    setVerificationStatus(currentVerificationStatus);
    setIsOtpRequired(shouldRequireOtpVerification(checkoutSessionId));
    
    if (userProfile?.phone_number) {
      setPhoneNumber(userProfile.phone_number);
    }
    
    // CRITICAL: Check if OTP is verified for THIS specific checkout session
    // This prevents showing success state for old sessions
    const isVerifiedForThisSession = isCurrentIdentityVerified(checkoutSessionId);
    
    if (isVerifiedForThisSession) {
      setStep('success');
      return;
    }
    
    // Set initial method based on prefilled method
    if (!initialMethodSet) {
      // Always start with method selection first
      setStep('method');
      
      // Set the method based on prefilledMethod if provided
      if (prefilledMethod) {
        setMethod(prefilledMethod);
        
        // If phone is selected but no phone number exists, show phone addition
        if (prefilledMethod === 'phone' && !currentIdentity.phone) {
          setStep('phone_addition');
        }
      }
      
      setInitialMethodSet(true);
    }
  }, [prefilledMethod, userProfile?.phone_number, initialMethodSet, initialEmail, initialPhone, checkoutSessionId]);

  // Handle successful verification
  useEffect(() => {
    if (otp.isVerified && otp.codAuthToken) {
      // Only proceed to success step if we're not in the middle of phone addition
      if (step !== 'phone_addition') {
        // Scope verification to this checkout session
        markCurrentIdentityVerified(checkoutSessionId);
        onVerified(otp.codAuthToken);
        setStep('success');
      }
    }
  }, [otp.isVerified, otp.codAuthToken, onVerified, step, checkoutSessionId]);

  const handlePhoneAddition = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setError(null);
      await updatePhoneNumber(phoneNumber);
      // Refresh identity after updating phone
      const updatedIdentity = getIdentity();
      // Ensure phone is always a string for the state (convert undefined to empty string)
      const identityForState = {
        ...updatedIdentity,
        phone: updatedIdentity.phone || ''
      };
      setIdentity(identityForState);
      
      // Proceed to send OTP
      const contact = getOtpContact(updatedIdentity, 'phone');
      if (contact) {
        const success = await otp.requestOtp(contact, 'phone', purpose);
        if (success) {
          setStep('otp');
        }
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      setError('Failed to update phone number. Please try again.');
    }
  };

 const handleSendOtp = useCallback(async () => {
  setError(null);
  
  // If we're in phone addition step, handle that first
  if (step === 'phone_addition') {
    await handlePhoneAddition();
    return true;
  }

  // Get contact information based on the selected method
  const contact = getOtpContact(identity, method);
  
  // Validate contact information
  if (!contact) {
    setError(method === 'email' 
      ? 'Email address is required' 
      : 'Phone number is required');
    return false;
  }

  // For phone method, ensure phone number is valid
  if (method === 'phone' && !/^[0-9]{10}$/.test(contact)) {
    setError('Please enter a valid 10-digit phone number');
    return false;
  }

  // For email method, ensure email is valid
  if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    setError('Please enter a valid email address');
    return false;
  }

  try {
    // Request OTP
    const success = await otp.requestOtp(contact, method, purpose);
    if (success) {
      setStep('otp');
    }
    return success;
  } catch (err) {
    console.error('Error sending OTP:', err);
    setError('Failed to send OTP. Please try again.');
    return false;
  }
}, [step, handlePhoneAddition, identity, method, otp, purpose]);

  const handleVerifyOtp = async (otpValue?: string) => {
    const contact = getOtpContact(identity, method);
    if (!contact) return;

    const codeToVerify = otpValue || otp.otpValue;
    if (codeToVerify.length !== 6) return;

    await otp.verifyOtp(contact, method, codeToVerify, purpose);
  };

  const handleResendOtp = async () => {
    const contact = getOtpContact(identity, method);
    if (!contact) return;

    await otp.requestOtp(contact, method, purpose);
  };

  const handleBackToMethod = () => {
    otp.reset();
    setStep('method');
  };

  const handleMethodChange = (newMethod: 'email' | 'phone') => {
    if (newMethod !== method) {
      otp.reset();
      setMethod(newMethod);
      setError(null);
      
      if (newMethod === 'phone' && isPhoneMissing()) {
        setStep('phone_addition');
      } else {
        const contact = getOtpContact(identity, newMethod);
        if (!contact) {
          setStep('method');
        }
      }
    }
  };

  const getErrorMessage = () => {
    return error || 
           (otp.requestError && OTP_ERROR_MESSAGES[otp.requestError]) || 
           (otp.verifyError && OTP_ERROR_MESSAGES[otp.verifyError]) || 
           null;
  };

  if (step === 'success') {
    // Double-check that OTP verification is still valid for this checkout session
    // This prevents showing success state when session has changed
    const isStillValid = isCurrentIdentityVerified(checkoutSessionId);
    
    if (!isStillValid) {
      // Session has changed, force re-verification
      return (
        <div className={`max-w-md mx-auto ${className}`}>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verify Your Order
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your verification session has expired. Please verify again to continue.
              </p>
            </div>
            <button
              onClick={() => setStep('method')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Verify OTP Again
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Verification Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your {userType === 'guest' ? 'guest' : 'registered'} order has been verified.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Verification is valid for this checkout session only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {step === 'phone_addition' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Add Phone Number
            </h2>
            {/* Show different messages based on user type and phone existence */}
            {userType === 'registered' && !userProfile?.phone_number ? (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-lg" role="status" aria-live="polite">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                        Mobile number not found
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        You don't have a mobile number registered with your account.
                        After you verify this OTP, your mobile number will be securely added to your profile and your order will continue as normal.
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                        This is a one-time step.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Please enter your phone number to receive the verification code.
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Please enter your phone number to receive the verification code.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your 10-digit phone number"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <button
              onClick={handlePhoneAddition}
              disabled={!phoneNumber || phoneNumber.length < 10 || otp.isRequesting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {otp.isRequesting ? 'Sending...' : 'Send Verification Code'}
            </button>

            <button
              onClick={() => {
                setMethod('email');
                setStep('method');
                setError(null);
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Use email instead
            </button>
          </div>
        </div>
      )}

      {step === 'method' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Verify Your Order
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We'll send you a verification code to confirm your {purpose === 'cancel' ? 'cancellation' : purpose === 'replacement' ? 'replacement request' : purpose === 'cod_verification' ? 'COD ' : ''}order.
            </p>
          </div>

 <OtpMethodSelector
            method={method}
            onMethodChange={handleMethodChange}
            error={getErrorMessage()}
          />

          <SendOtpButton
            onSend={handleSendOtp}
            disabled={!getOtpContact(identity, method)}
            isLoading={otp.isRequesting}
            cooldownRemaining={otp.cooldownRemaining}
            canResend={otp.canResend}
          />

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Enter Verification Code
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a 6-digit code to{' '}
              <span className="font-medium">
                {method === 'email' 
                  ? identity.email 
                  : identity.phone 
                    ? `+91 ${identity.phone.slice(-10)}` 
                    : 'your phone'}
              </span>
            </p>
          </div>

          <OtpInput
            value={otp.otpValue}
            onChange={otp.handleOtpChange}
            onComplete={handleVerifyOtp}
            error={getErrorMessage()}
            disabled={otp.isVerifying}
            showVerifyButton={purpose !== 'cod_verification'}
            onVerify={() => handleVerifyOtp()}
            isVerifying={otp.isVerifying}
          />

          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToMethod}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              ← Change contact method
            </button>

            <ResendLink
              onResend={handleResendOtp}
              disabled={otp.isRequesting}
              cooldownRemaining={otp.cooldownRemaining}
              canResend={otp.canResend}
              attemptsLeft={otp.attemptsLeft}
              maxAttempts={otp.maxAttempts}
            />
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};