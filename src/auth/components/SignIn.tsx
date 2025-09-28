// src/components/auth/SignIn/SignIn.tsx
import { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

import { useAuthStore } from '@store/authStore';

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

  // Redirect after successful login (store will set `user`)
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

  const onSubmit = async (data: SignInFormData) => {
    try {
      clearError();
      await signIn(data.email, data.password);
      // redirect handled by store -> user update -> useEffect above
    } catch (err) {
      // store already sets the error state; keep here for debug only
      // console.error('Sign in error (component):', err);
    }
  };

  const goToSignUp = () => {
    navigate('/auth/signup');
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account to continue">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {error && <ErrorAlert message={error.message || 'An error occurred'} onDismiss={clearError} />}

        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          leftIcon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          loading={isSubmitting || isLoading}
          rightIcon={ArrowRight}
          className="w-full"
        >
          Sign In
        </Button>

        <AuthDivider />

        <GoogleAuthButton onClick={signInWithGoogle} loading={isLoading} mode="signin" />

        <div className="text-center">
          <Link to="/auth/forgot-password" className="text-sm text-primary hover:text-primary-active font-medium">
            Forgot your password?
          </Link>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button type="button" onClick={goToSignUp} className="text-primary hover:text-primary-active font-medium">
            Sign up here
          </button>
        </p>
      </form>
    </AuthLayout>
  );
});

SignIn.displayName = 'SignIn';
export default SignIn;