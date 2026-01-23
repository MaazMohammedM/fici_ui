import React, { useCallback, useEffect } from 'react';
import { validateContact } from '../../lib/otpApi';
import { 
  getIdentity,
  isPhoneMissing,
  getPhoneVerificationHelperText,
  validateOtpIdentity,
  getOtpContact,
  type Identity
} from '../../utils/identitySource';
import { InfoBanner } from '../ui/InfoBanner';

interface OtpMethodSelectorProps {
  method: 'email' | 'phone';
  onMethodChange: (method: 'email' | 'phone') => void;
  onContactChange?: (contact: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const OtpMethodSelector: React.FC<OtpMethodSelectorProps> = ({
  method,
  onMethodChange,
  onContactChange,
  error,
  disabled = false,
  className = ''
}) => {
  const [identity, setIdentity] = React.useState<Identity | null>(null);
  const [showMissingPhoneMessage, setShowMissingPhoneMessage] = React.useState(false);

  // Load identity data on mount
  useEffect(() => {
    const currentIdentity = getIdentity();
    const shouldShowMissingPhone = isPhoneMissing();
    
    setIdentity(currentIdentity);
    setShowMissingPhoneMessage(shouldShowMissingPhone);
  }, []);

  const handleMethodChange = useCallback((newMethod: 'email' | 'phone') => {
    // Only update method, do NOT clear identity fields
    onMethodChange(newMethod);
  }, [onMethodChange]);

  const getPlaceholder = () => {
    return method === 'email' ? 'Enter your email address' : 'Enter your phone number';
  };

  const getInputType = () => {
    return method === 'email' ? 'email' : 'tel';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile OTP Info Banner - Show only for registered users without phone number */}
      {method === 'phone' && identity?.type === 'registered' && !identity?.phone && (
        <InfoBanner
          title="Mobile number not found"
          message="You don't have a mobile number registered with your account. After you verify this OTP, your mobile number will be securely added to your profile and your order will continue as normal."
          helperText="This is a one-time step."
        />
      )}

      {/* Method Selection */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleMethodChange('email')}
          disabled={disabled}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg border-2 transition-colors ${
            method === 'email'
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-400'
              : 'border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          📧 Email
        </button>
        <button
          type="button"
          onClick={() => handleMethodChange('phone')}
          disabled={disabled}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg border-2 transition-colors ${
            method === 'phone'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-400'
              : 'border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          📱 SMS
        </button>
      </div>

      {/* Contact Input */}
      <div>
        <input
          type={getInputType()}
          value={method === 'email' ? (identity?.email || '') : (identity?.phone || '')}
          readOnly
          disabled={disabled || (identity?.type === 'registered' || (identity?.type === 'guest'))}
          placeholder={getPlaceholder()}
          className={`w-full px-4 py-3 text-base border-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed ${
            error
              ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800'
          }`}
          autoComplete={method === 'email' ? 'email' : 'tel'}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {method === 'phone' && showMissingPhoneMessage && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {getPhoneVerificationHelperText()}
          </p>
        )}
      </div>

      {/* Helper Text */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {method === 'email' ? (
          <>
            We'll send a verification code to: <strong>{identity?.email}</strong>
          </>
        ) : (
          <>
            We'll send a verification code to: <strong>{identity?.phone || 'No phone number on file'}</strong>
            {showMissingPhoneMessage && (
              <>
                <br />
                <span className="text-blue-600 dark:text-blue-400">{getPhoneVerificationHelperText()}</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
