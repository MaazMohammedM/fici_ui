import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '../auth/ui';
import { requestOtp, verifyOtp, validateContact, OTP_ERROR_MESSAGES, type OtpError } from '../lib/otpApi';
import { supabase } from '../lib/supabase';

const PhoneUpdateSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
});

type PhoneUpdateFormData = z.infer<typeof PhoneUpdateSchema>;

interface PhoneUpdateWithOtpProps {
  initialPhone?: string;
  onSuccess: (newPhone: string) => void;
  variant?: 'modal' | 'inline';
  triggerLabel?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const PhoneUpdateWithOtp: React.FC<PhoneUpdateWithOtpProps> = ({
  initialPhone = '',
  onSuccess,
  variant = 'modal',
  triggerLabel = 'Update Phone Number',
  isOpen: controlledOpen,
  onClose
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const isOpenControlled = controlledOpen !== undefined;
  const isActuallyOpen = isOpenControlled ? controlledOpen : isModalOpen;

  const form = useForm<PhoneUpdateFormData>({
    resolver: zodResolver(PhoneUpdateSchema),
    defaultValues: {
      phone: initialPhone
    }
  });

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const resetForm = () => {
    setOtpSent(false);
    setOtpValue('');
    setError(null);
    setSuccess(null);
    setAttempts(0);
    setResendTimer(0);
    form.reset();
  };

  const handleClose = () => {
    resetForm();
    if (isOpenControlled && onClose) {
      onClose();
    } else {
      setIsModalOpen(false);
    }
  };

  const handleOpen = () => {
    if (isOpenControlled && onClose) {
      // For controlled modal, parent controls opening
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSendOtp = async (data: PhoneUpdateFormData) => {
    if (!validateContact(data.phone, 'phone')) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSendingOtp(true);
    setError(null);

    try {
      const result = await requestOtp(data.phone, 'phone', 'phone_update');
      
      if (result.success) {
        setPhoneNumber(data.phone);
        setOtpSent(true);
        setResendTimer(60);
        setSuccess('OTP sent successfully!');
      } else {
        const errorMessage = OTP_ERROR_MESSAGES[result.error || 'UNKNOWN_ERROR'];
        setError(errorMessage);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    setIsVerifyingOtp(true);
    setError(null);

    try {
      const result = await verifyOtp(phoneNumber, 'phone', otpValue);
      
      if (result.success) {
        setSuccess('Phone number verified successfully!');
        
        // Update user_profiles table
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ phone_number: phoneNumber })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating phone number:', updateError);
            setError('Failed to update phone number. Please try again.');
            return;
          }
        }

        onSuccess(phoneNumber);
        setTimeout(() => handleClose(), 1500);
      } else {
        const errorMessage = OTP_ERROR_MESSAGES[result.error || 'UNKNOWN_ERROR'];
        setError(errorMessage);
        setAttempts(attempts + 1);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsSendingOtp(true);
    setError(null);

    try {
      const result = await requestOtp(phoneNumber, 'phone', 'phone_update');
      
      if (result.success) {
        setResendTimer(60);
        setSuccess('OTP resent successfully!');
      } else {
        const errorMessage = OTP_ERROR_MESSAGES[result.error || 'UNKNOWN_ERROR'];
        setError(errorMessage);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const ModalContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Update Phone Number
        </h3>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="h-4 w-4 text-green-500" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {!otpSent ? (
        <form onSubmit={form.handleSubmit(handleSendOtp)} className="space-y-4">
          <div>
            <Input
              type="tel"
              label="Phone Number"
              placeholder="Enter your phone number"
              leftIcon={Phone}
              error={form.formState.errors.phone?.message}
              {...form.register('phone')}
              required
            />
          </div>
          <Button
            type="submit"
            loading={isSendingOtp}
            className="w-full"
          >
            Send OTP
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              OTP sent to <span className="font-medium">{phoneNumber}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-800 dark:text-white"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleVerifyOtp}
              loading={isVerifyingOtp}
              className="flex-1"
            >
              Verify OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || isSendingOtp}
              className="flex-1"
            >
              {isSendingOtp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : resendTimer > 0 ? (
                `Resend (${resendTimer}s)`
              ) : (
                'Resend OTP'
              )}
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOtpSent(false);
              setOtpValue('');
            }}
            className="w-full"
          >
            Change Phone Number
          </Button>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <ModalContent />
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        size="sm"
      >
        {triggerLabel}
      </Button>

      {isActuallyOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <ModalContent />
          </div>
        </div>
      )}
  </>
  );
};

export default PhoneUpdateWithOtp;
