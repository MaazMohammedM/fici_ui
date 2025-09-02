// ===== PART 5: REGISTER COMPONENT =====

// src/components/auth/Register/Register.tsx
import { memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { User, Mail, ArrowRight } from 'lucide-react';

// UI Components
import { Input, Button, ErrorAlert } from '../ui';
import { 
  AuthLayout, 
  PasswordField, 
  AuthDivider, 
  GoogleAuthButton 
} from '@auth/index'

// Hooks and Schemas
import { useAuth } from '../../lib/hooks/useAuth';
import { RegisterSchema } from '../../lib/schema/authSchema';
import type {RegisterFormData}  from '../../lib/schema/authSchema';

const Register = memo(() => {
  const navigate = useNavigate();
  const { isLoading, error, clearError, signUp, signInWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({ 
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    await signUp({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password
    });
  };

  const handleNavigation = () => navigate('/auth/signin');

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join us and start shopping today"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Error Display */}
        {error && <ErrorAlert message={error} onDismiss={clearError} />}

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
          placeholder="Enter your email"
          leftIcon={Mail}
          error={errors.email?.message}
          {...register('email')}
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
    </AuthLayout>
  );
});

Register.displayName = 'Register';
export default Register;