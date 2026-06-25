// ===== PART 5: REGISTER COMPONENT =====

// src/components/auth/Register/Register.tsx
import { memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';

// Store
import { useAuthStore } from '@store/authStore';

// UI Components
import { Input, Button, ErrorAlert } from '../ui';
import { 
  AuthLayout, 
  PasswordField, 
  AuthDivider, 
  GoogleAuthButton 
} from '@auth/index'

// Schemas
import { SignUpSchema, type SignUpFormData } from '../../lib/validation/schemas';
import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Connectivity
import { AuthConnectivityGuard, useAuthConnectivity } from './AuthConnectivityGuard';

const Register = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldBlockAction } = useAuthConnectivity();
  const { 
    loading: isLoading, 
    error, 
    clearError, 
    signUp, 
    signInWithGoogle
  } = useAuthStore();
  
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<SignUpFormData>({ 
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: prefilledEmail,
      mobile: '',
      password: '',
      confirmPassword: ''
    }
  });
  

  const onSubmit = async (data: SignUpFormData) => {
    if (shouldBlockAction) {
      return;
    }
    
    await signUp({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobile: data.mobile,
      password: data.password
    });
  };

  const handleNavigation = () => {
    clearError(); // Clear error before navigating to prevent it from showing in SignIn page
    navigate('/auth/signin');
  };

  // Handle email prefill from guest checkout
  useEffect(() => {
    const guestEmail = location.state?.guestEmail || sessionStorage.getItem('guestEmail');
    if (guestEmail) {
      setPrefilledEmail(guestEmail);
      setValue('email', guestEmail);
      sessionStorage.removeItem('guestEmail');
    }
  }, [location.state, setValue]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Scroll to top when error occurs
  useEffect(() => {
    if (error) {
      // Scroll to very top of page to show error near "Create Account" title
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Enhanced error message handler
  const getErrorMessage = (error: string | { message: string } | null) => {
    if (!error) return null;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Check for user already registered error
    if (errorMessage.toLowerCase().includes('user already registered') || 
        errorMessage.toLowerCase().includes('already registered') ||
        errorMessage.toLowerCase().includes('already been registered') ||
        errorMessage.toLowerCase().includes('duplicate')) {
      return 'User already registered, Kindly Log In';
    }
    
    return errorMessage;
  };

  // Check if error is user already registered
  const isUserAlreadyRegisteredError = (error: string | { message: string } | null) => {
    if (!error) return false;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return errorMessage.toLowerCase().includes('user already registered') || 
           errorMessage.toLowerCase().includes('already registered') ||
           errorMessage.toLowerCase().includes('already been registered') ||
           errorMessage.toLowerCase().includes('duplicate');
  };

  return (
    <AuthConnectivityGuard>
      <AuthLayout 
        title="Create Account" 
        subtitle="Join us and start shopping today"
      >
      {/* Error Display - Moved outside form to appear near title */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm text-red-800">
                {isUserAlreadyRegisteredError(error) ? (
                  <div>
                    <span>User already registered, Kindly</span>
                    <button
                      type="button"
                      onClick={handleNavigation}
                      className="ml-1 text-primary hover:text-primary-active font-medium underline transition-colors"
                    >
                      Log In
                    </button>
                  </div>
                ) : (
                  getErrorMessage(error)
                )}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={clearError}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={formRef}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="First name"
              leftIcon={User}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              leftIcon={User}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          {/* Email Field */}
          <Input
            type="email"
            label="Email Address"
            placeholder={prefilledEmail ? prefilledEmail : "Enter your email"}
            leftIcon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />
          
          {/* Email prefill indicator */}
          {prefilledEmail && (
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              Email pre-filled from your guest checkout
            </p>
          )}

          {/* Mobile Field */}
          <Input
            type="tel"
            label="Mobile Number (Optional)"
            placeholder="Enter your mobile number"
            leftIcon={Phone}
            error={errors.mobile?.message}
            {...register('mobile')}
          />

          {/* Password Fields */}
          <div className="space-y-4">
            <PasswordField
              label="Password"
              placeholder="Create a password"
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordField
              label="Confirm Password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            loading={isSubmitting || isLoading}
            rightIcon={ArrowRight}
            className="w-full"
          >
            Create Account
          </Button>

          {/* Divider */}
          <AuthDivider />

          {/* Google Sign Up */}
          <GoogleAuthButton 
            onClick={signInWithGoogle}
            loading={isLoading}
            mode="signup"
          />

          {/* Sign In Link */}
          <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={handleNavigation}
              className="text-primary hover:text-primary-active font-medium transition-colors"
            >
              Sign in here
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
    </AuthConnectivityGuard>
);
});

Register.displayName = 'Register';
export default Register;