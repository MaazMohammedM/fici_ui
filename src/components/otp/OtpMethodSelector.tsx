import React, { useState, useCallback } from 'react';
import { validateContact } from '../../lib/otpApi';

interface OtpMethodSelectorProps {
  method: 'email' | 'phone';
  onMethodChange: (method: 'email' | 'phone') => void;
  contact: string;
  onContactChange: (contact: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const OtpMethodSelector: React.FC<OtpMethodSelectorProps> = ({
  method,
  onMethodChange,
  contact,
  onContactChange,
  error,
  disabled = false,
  className = ''
}) => {
  const [localContact, setLocalContact] = useState(contact);
  const [isValid, setIsValid] = useState(true);

  const handleMethodChange = useCallback((newMethod: 'email' | 'phone') => {
    onMethodChange(newMethod);
    setLocalContact('');
    onContactChange('');
    setIsValid(true);
  }, [onMethodChange, onContactChange]);

  const handleContactChange = useCallback((value: string) => {
    setLocalContact(value);
    onContactChange(value);

    // Validate contact format
    if (value.trim()) {
      setIsValid(validateContact(value, method));
    } else {
      setIsValid(true); // Empty is valid until user starts typing
    }
  }, [method, onContactChange]);

  const getPlaceholder = () => {
    return method === 'email' ? 'Enter your email address' : 'Enter your phone number';
  };

  const getInputType = () => {
    return method === 'email' ? 'email' : 'tel';
  };

  return (
    <div className={`space-y-4 ${className}`}>
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
          value={localContact}
          onChange={(e) => handleContactChange(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={disabled}
          className={`w-full px-4 py-3 text-base border-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error || !isValid
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
        {!isValid && localContact.trim() && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Please enter a valid {method === 'email' ? 'email address' : 'phone number'}
          </p>
        )}
      </div>

      {/* Helper Text */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {method === 'email' ? (
          <>
            We'll send a verification code to your email address.
            <br />
            <strong>Example:</strong> user@example.com
          </>
        ) : (
          <>
            We'll send a verification code to your phone number.
            <br />
            <strong>Example:</strong> +91 9876543210
          </>
        )}
      </div>
    </div>
  );
};
