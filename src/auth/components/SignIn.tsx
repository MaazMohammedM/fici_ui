// ===== PART 4: SIGNIN COMPONENT =====

// src/components/auth/SignIn/SignIn.tsx
import { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { supabase } from '@lib/supabase';

// Store
import { useAuthStore } from '../../store/authStore';

// UI Components
import { Input, Button, ErrorAlert } from '../ui';
import { 
  AuthLayout, 
  PasswordField, 
  AuthDivider, 
  GoogleAuthButton 
} from '@auth/index';

// Schemas
import { SignInSchema, type SignInFormData } from '../../lib/validation/schemas';
const SignIn = memo(() => {
  const navigate = useNavigate();
  const { 
    loading: isLoading, 
    error, 
    signIn, 
    signInWithGoogle,
    clearError,
    user
  } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignInFormData>({ 
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Handle redirect after successful login
  useEffect(() => {
    if (user) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const checkGuestOrders = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-guest-orders', {
        body: { email }
      });
      
      if (error) {
        console.error('Error checking guest orders:', error);
        return;
      }
      
      if (data?.hasGuestData) {
        // Store guest data for potential merging
        sessionStorage.setItem('pendingGuestData', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error checking guest orders:', error);
    }
  };

  const onSubmit = async (data: SignInFormData) => {
    // Check for guest orders before signing in
    await checkGuestOrders(data.email);
    await signIn(data.email, data.password);
  };

  const handleNavigation = () => {
    navigate('/auth/signup');
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Error Display */}
        {error && <ErrorAlert message={error} onDismiss={clearError} />}
        

        {/* Email Field */}
        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          leftIcon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password Field */}
        <PasswordField
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          loading={isSubmitting || isLoading}
          rightIcon={ArrowRight}
          className="w-full"
        >
          Sign In
        </Button>

        {/* Divider */}
        <AuthDivider />

        {/* Google Sign In */}
        <GoogleAuthButton 
          onClick={signInWithGoogle}
          loading={isLoading}
          mode="signin"
        />

        {/* Forgot Password Link */}
        <div className="text-center">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-primary hover:text-primary-active font-medium transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={handleNavigation}
            className="text-primary hover:text-primary-active font-medium transition-colors"
          >
            Sign up here
          </button>
        </p>
      </form>
    </AuthLayout>
  );
});

SignIn.displayName = 'SignIn';
export default SignIn;