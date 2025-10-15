import React from 'react';

interface ResendLinkProps {
  onResend: () => void;
  disabled?: boolean;
  cooldownRemaining?: number;
  canResend?: boolean;
  attemptsLeft?: number;
  maxAttempts?: number;
  className?: string;
}

export const ResendLink: React.FC<ResendLinkProps> = ({
  onResend,
  disabled = false,
  cooldownRemaining = 0,
  canResend = true,
  attemptsLeft = 3,
  maxAttempts = 3,
  className = ''
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResendText = () => {
    if (cooldownRemaining > 0) {
      return `Resend OTP in ${formatTime(cooldownRemaining)}`;
    }

    if (!canResend) {
      return 'Too many requests. Please try again later.';
    }

    if (attemptsLeft <= 0) {
      return 'Maximum resend attempts reached';
    }

    return 'Resend OTP';
  };

  const isDisabled = disabled || cooldownRemaining > 0 || !canResend || attemptsLeft <= 0;

  return (
    <div className={`text-center ${className}`}>
      <button
        onClick={onResend}
        disabled={isDisabled}
        className={`
          text-sm font-medium transition-colors
          ${isDisabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
          }
        `}
        type="button"
      >
        {getResendText()}
      </button>

      {/* Attempts remaining info */}
      {attemptsLeft < maxAttempts && attemptsLeft > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {attemptsLeft} resend{attemptsLeft !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  );
};
