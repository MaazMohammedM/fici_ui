// ===== PART 4: SIGNIN COMPONENT =====

// src/components/auth/SignIn/SignIn.tsx
import  { memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

// UI Components
import { Input, Button, ErrorAlert } from '../ui';
import { 
  AuthLayout, 
  PasswordField, 
  AuthDivider, 
  GoogleAuthButton 
} from '@auth/index';

// Hooks and Schemas
import { useAuth } from '../../lib/hooks/useAuth';
import { SignInSchema } from '../../lib/schema/authSchema';
import type { SignInFormData } from '../../lib/schema/authSchema';
const SignIn = memo(() => {
  const navigate = useNavigate();
  const { isLoading, error, clearError, signIn, signInWithGoogle } = useAuth();

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

  const onSubmit = async (data: SignInFormData) => {
    await signIn(data.email, data.password);
  };

  const handleNavigation = () => navigate('/auth/signup');

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