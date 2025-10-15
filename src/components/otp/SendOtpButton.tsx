import React from 'react';
import { Loader2 } from 'lucide-react';

interface SendOtpButtonProps {
  onSend: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  cooldownRemaining?: number;
  canResend?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const SendOtpButton: React.FC<SendOtpButtonProps> = ({
  onSend,
  disabled = false,
  isLoading = false,
  cooldownRemaining = 0,
  canResend = true,
  variant = 'primary',
  className = ''
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonText = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      );
    }

    if (cooldownRemaining > 0) {
      return `Resend in ${formatTime(cooldownRemaining)}`;
    }

    if (!canResend) {
      return 'Too many requests';
    }

    return 'Send OTP';
  };

  const isDisabled = disabled || isLoading || cooldownRemaining > 0 || !canResend;

  const buttonClasses = `
    w-full py-3 px-4 text-base font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300'
      : 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-300'
    }
    ${className}
  `.trim();

  return (
    <button
      onClick={onSend}
      disabled={isDisabled}
      className={buttonClasses}
      type="button"
    >
      {getButtonText()}
    </button>
  );
};
