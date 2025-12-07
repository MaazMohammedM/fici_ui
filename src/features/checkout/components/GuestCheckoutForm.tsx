import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Phone, User, ArrowRight } from 'lucide-react';
import { Input, Button } from '../../../auth/ui';
import type { GuestContactInfo } from '../../../types/guest';
import { GuestContactSchema, type GuestContactInfo as GuestContactFormData } from '../../../lib/validation/schemas';
import { useThemeStore } from '../../../store/themeStore';

interface GuestCheckoutFormProps {
  onGuestInfoSubmit: (contactInfo: GuestContactInfo) => Promise<void>;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  loading?: boolean;
  initialEmail?: string;
}

const GuestCheckoutForm: React.FC<GuestCheckoutFormProps> = ({
  onGuestInfoSubmit,
  onSignInClick,
  onSignUpClick,
  loading = false,
  initialEmail = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mode } = useThemeStore(); // Add theme store to respond to theme changes

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<GuestContactFormData>({
    resolver: zodResolver(GuestContactSchema),
    defaultValues: {
      email: initialEmail,
      phone: '',
      name: ''
    }
  });

  const onSubmit = async (data: GuestContactFormData) => {
    setIsSubmitting(true);
    try {
      await onGuestInfoSubmit({
        email: data.email,
        phone: data.phone,
        name: data.name
      });
    } catch (error) {
      console.error('Guest checkout form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`rounded-2xl shadow-lg p-6 ${mode === 'dark' ? 'bg-dark2' : 'bg-white'}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Checkout Options
        </h2>
        <p className=" text-sm text-gray-600 dark:text-gray-400">
          Choose how you'd like to proceed with your order
        </p>
      </div>

      {/* Sign In Option */}
      <div className={`mb-3 rounded-2xl border px-4 py-4 shadow-sm sm:px-6 sm:py-5 ${
        mode === 'dark' 
          ? 'border-gray-700 bg-dark2/80' 
          : 'border-gray-200 bg-white/80'
      }`}>
        <div className="flex items-center justify-between gap-4">
          {/* Text block */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
              Already have an account?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Sign in to access your saved addresses and order history.
            </p>
          </div>
          {/* Sign In Button */}
          <Button
            onClick={onSignInClick}
            variant="outline"
            size="sm"
            className="flex-shrink-0 whitespace-nowrap"
          >
            Sign In
          </Button>
        </div>
      </div>
      
      {/* Sign Up Option */}
      <p className="mb-6 text-center text-md text-gray-600 dark:text-gray-400 md:text-md">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSignUpClick}
          className="font-medium text-primary hover:text-primary-active"
        >
          Sign up here
        </button>
      </p>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className={`px-2 text-sm ${
            mode === 'dark' 
              ? 'bg-dark2 text-gray-400' 
              : 'bg-white text-gray-500'
          }`}>
            Or continue as guest
          </span>
        </div>
      </div>

      {/* Guest Checkout Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Guest Checkout
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You can checkout without creating an account. We'll save your order details 
                and you can create an account later to manage your orders.
              </p>
            </div>
          </div>
        </div>

        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email address"
          leftIcon={Mail}
          error={errors.email?.message}
          {...register('email')}
          required
        />

        <Input
          label="Full Name"
          placeholder="Enter your full name"
          leftIcon={User}
          error={errors.name?.message}
          {...register('name')}
          required
        />

        <Input
          type="tel"
          label="Phone Number (Optional)"
          placeholder="Enter your phone number"
          leftIcon={Phone}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Create account later:</strong> After placing your order, you can create 
            an account to save your order history and manage future purchases.
          </p>
        </div>

        <Button
          type="submit"
          loading={isSubmitting || loading}
          rightIcon={ArrowRight}
          className="w-full"
        >
          Continue as Guest
        </Button>
      </form>
    </div>
  );
};

export default GuestCheckoutForm;
