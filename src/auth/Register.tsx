// ✅ Register.tsx with Zod + Zustand + Supabase + Google Auth
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const RegisterSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
});

type RegisterFormData = z.infer<typeof RegisterSchema>;

const Register = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    const fullName = `${data.firstName} ${data.lastName}`;
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: fullName,
          first_name: data.firstName,
          last_name: data.lastName
        }
      }
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (authData.user) {
      setUser({
        ...authData.user,
        user_metadata: {
          ...authData.user.user_metadata,
          first_name: data.firstName
        }
      });
      await supabase.from('user_profiles').insert({
        user_id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: fullName,
        role: 'user'
      });
      setRole('user');
      navigate('/');
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) alert(error.message);
  };

  return (
    <div className='max-w-md mx-auto mt-20 p-6 bg-white dark:bg-dark2 rounded-xl shadow-md'>
      <h2 className='text-xl font-semibold mb-4'>Register</h2>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div>
          <label className='block mb-1'>First Name</label>
          <input {...register('firstName')} className='w-full px-3 py-2 border rounded-md' />
          {errors.firstName && <p className='text-red-500 text-sm'>{errors.firstName.message}</p>}
        </div>
        <div>
          <label className='block mb-1'>Last Name</label>
          <input {...register('lastName')} className='w-full px-3 py-2 border rounded-md' />
          {errors.lastName && <p className='text-red-500 text-sm'>{errors.lastName.message}</p>}
        </div>
        <div>
          <label className='block mb-1'>Email</label>
          <input type='email' {...register('email')} className='w-full px-3 py-2 border rounded-md' />
          {errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}
        </div>
        <div>
          <label className='block mb-1'>Password</label>
          <input type='password' {...register('password')} className='w-full px-3 py-2 border rounded-md' />
          {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}
        </div>
        <div>
          <label className='block mb-1'>Confirm Password</label>
          <input type='password' {...register('confirmPassword')} className='w-full px-3 py-2 border rounded-md' />
          {errors.confirmPassword && <p className='text-red-500 text-sm'>{errors.confirmPassword.message}</p>}
        </div>
        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full bg-primary text-white py-2 rounded-md hover:bg-accent'
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
        <div className='relative text-center my-4'>
          <span className='text-gray-500 text-sm'>or</span>
        </div>
        <button
          type='button'
          onClick={handleGoogleSignUp}
          className='w-full border border-gray-300 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-dark3'
        >
          Sign Up with Google
        </button>
        <p className='text-sm mt-2'>Already have an account? <span className='text-accent cursor-pointer' onClick={() => navigate('/auth/signin')}>Sign In</span></p>
      </form>
    </div>
  );
};

export default Register;