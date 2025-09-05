// ===== PART 5: REGISTER COMPONENT =====

// src/components/auth/Register/Register.tsx
import { memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { User, Mail, ArrowRight } from 'lucide-react';

// Store
import { useAuthStore } from '../../store/authStore';

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
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Register = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    loading: isLoading, 
    error, 
    clearError, 
    signUp, 
    signInWithGoogle
  } = useAuthStore();
  
  const [prefilledEmail, setPrefilledEmail] = useState('');

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
      password: '',
      confirmPassword: ''
    }
  });
  

  const onSubmit = async (data: SignUpFormData) => {
    await signUp({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password
    });
  };

  const handleNavigation = () => {
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