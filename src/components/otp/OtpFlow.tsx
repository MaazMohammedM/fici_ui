import React, { useState, useEffect } from 'react';
import { useOtp } from '../../hooks/useOtp';
import { OtpMethodSelector } from './OtpMethodSelector';
import { SendOtpButton } from './SendOtpButton';
import { OtpInput } from './OtpInput';
import { ResendLink } from './ResendLink';
import { OTP_ERROR_MESSAGES } from '../../lib/otpApi';

interface OtpFlowProps {
  purpose?: 'cod_verification';
  onVerified: (codAuthToken: string) => void;
  onCancel?: () => void;
  prefilledContact?: string;
  prefilledMethod?: 'email' | 'phone';
  className?: string;
  userType?: 'guest' | 'registered';
}

export const OtpFlow: React.FC<OtpFlowProps> = ({
  purpose = 'cod_verification',
  onVerified,
  onCancel,
  prefilledContact = '',
  prefilledMethod = 'email',
  className = '',
  userType = 'guest'
}) => {
  const [contact, setContact] = useState(prefilledContact);
  const [method, setMethod] = useState<'email' | 'phone'>(prefilledMethod);
  const [step, setStep] = useState<'method' | 'otp' | 'success'>('method');

  const otp = useOtp({
    maxAttempts: 3,
    cooldownDuration: 60,
    maxResends: 3
  });

  // Auto-populate contact when component mounts
  useEffect(() => {
    if (prefilledContact && step === 'method') {
      setContact(prefilledContact);
    }
  }, [prefilledContact, step]);

  // Handle successful verification
  useEffect(() => {
    if (otp.isVerified && otp.codAuthToken) {
      onVerified(otp.codAuthToken);
      setStep('success');
    }
  }, [otp.isVerified, otp.codAuthToken, onVerified]);

  const handleSendOtp = async () => {
    if (!contact.trim()) return;

    const success = await otp.requestOtp(contact, method, purpose);
    if (success) {
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp.otpValue;
    if (!contact.trim() || codeToVerify.length !== 6) return;

    const success = await otp.verifyOtp(contact, method, codeToVerify, purpose);
    if (success && otp.codAuthToken) {
      // Verification successful, onVerified will be called via useEffect
    }
  };

  const handleResendOtp = async () => {
    if (!contact.trim()) return;

    await otp.requestOtp(contact, method, purpose);
  };

  const handleBackToMethod = () => {
    otp.reset();
    setStep('method');
  };

  const getErrorMessage = () => {
    if (otp.requestError) {
      return OTP_ERROR_MESSAGES[otp.requestError];
    }
    if (otp.verifyError) {
      return OTP_ERROR_MESSAGES[otp.verifyError];
    }
    return null;
  };

  if (step === 'success') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Verification Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your {userType === 'guest' ? 'guest' : 'registered'} order has been verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {step === 'method' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Verify Your Order
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We'll send you a verification code to confirm your COD order.
            </p>
          </div>

          <OtpMethodSelector
            method={method}
            onMethodChange={setMethod}
            contact={contact}
            onContactChange={setContact}
            error={getErrorMessage()}
          />

          <SendOtpButton
            onSend={handleSendOtp}
            disabled={!contact.trim() || otp.isRequesting}
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
                {method === 'email' ? contact : `+91 ${contact.slice(-10)}`}
              </span>
            </p>
          </div>

          <OtpInput
            value={otp.otpValue}
            onChange={otp.handleOtpChange}
            onComplete={(value) => handleVerifyOtp(value)}
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
