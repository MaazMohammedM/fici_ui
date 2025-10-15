import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  length?: number;
  autoFocus?: boolean;
  showVerifyButton?: boolean;
  onVerify?: () => void;
  isVerifying?: boolean;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  length = 6,
  autoFocus = true,
  showVerifyButton = true,
  onVerify,
  isVerifying = false,
  className = ''
}) => {
  const [showCode, setShowCode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Handle input change
  const handleInputChange = useCallback((index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '');

    if (digit.length > 1) {
      // Handle paste
      const digits = digit.slice(0, length).split('');
      const newValue = [...value];

      digits.forEach((d, i) => {
        if (index + i < length) {
          newValue[index + i] = d;
        }
      });

      const fullValue = newValue.join('');
      onChange(fullValue);

      // Focus next available input
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (fullValue.length === length && onComplete) {
        onComplete(fullValue);
      }
    } else {
      // Single digit input
      const newValue = [...value];
      newValue[index] = digit;
      const fullValue = newValue.join('');

      onChange(fullValue);

      // Auto-focus next input if current is filled
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Call onComplete when all digits are filled
      if (fullValue.length === length && onComplete) {
        onComplete(fullValue);
      }
    }
  }, [value, onChange, onComplete, length]);

  // Handle key down for backspace navigation
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Navigate left with arrow key
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      // Navigate right with arrow key
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }, [value, length]);

  // Handle paste event
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);

    if (digits.length > 0) {
      const newValue = [...value];
      digits.split('').forEach((digit, i) => {
        if (i < length) {
          newValue[i] = digit;
        }
      });

      const fullValue = newValue.join('');
      onChange(fullValue);

      if (fullValue.length === length && onComplete) {
        onComplete(fullValue);
      }

      // Focus the next empty input or the last one
      const nextIndex = Math.min(digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  }, [value, onChange, onComplete, length]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const inputs = Array.from({ length }, (_, index) => (
    <input
      key={index}
      ref={(el) => {
        inputRefs.current[index] = el;
      }}
      type={showCode ? 'text' : 'password'}
      value={value[index] || ''}
      onChange={(e) => handleInputChange(index, e.target.value)}
      onKeyDown={(e) => handleKeyDown(index, e)}
      onPaste={handlePaste}
      onFocus={() => setFocusedIndex(index)}
      disabled={disabled}
      maxLength={1}
      className={`
        w-12 h-12 text-center text-lg font-mono border-2 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        ${error
          ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800'
        }
        ${focusedIndex === index ? 'border-blue-500' : ''}
      `}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
    />
  ));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* OTP Input Grid */}
      <div className="flex justify-center gap-2">
        {inputs}
      </div>

      {/* Toggle Visibility */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          disabled={disabled}
        >
          {showCode ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide code
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show code
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
      )}

      {/* Verify Button */}
      {showVerifyButton && value.length === length && (
        <div className="flex justify-center">
          <button
            onClick={onVerify}
            disabled={disabled || isVerifying}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Verify Code
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
