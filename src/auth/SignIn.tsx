// ✅ SignIn.tsx with Zod + Zustand + Supabase + Google Auth + FirstName support
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const SignInSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

type SignInFormData = z.infer<typeof SignInSchema>;

const SignIn = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);
  const setFirstName = useAuthStore((state) => state.setFirstName);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignInFormData>({ resolver: zodResolver(SignInSchema) });

  const onSubmit = async (data: SignInFormData) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (authData.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, first_name')
        .eq('user_id', authData.user.id)
        .single();

      setRole(profile?.role || null);
      setFirstName(profile?.first_name || null);

      setUser({
        ...authData.user,
        user_metadata: {
          ...authData.user.user_metadata,
          first_name: profile?.first_name || authData.user.user_metadata?.first_name
        }
      });

      navigate('/');
    }
  };

  const handleGoogleSignIn = async () => {
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
      <h2 className='text-xl font-semibold mb-4'>Sign In</h2>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div>
          <label className='block mb-1'>Email</label>
          <input
            type='email'
            {...register('email')}
            className='w-full px-3 py-2 border rounded-md'
          />
          {errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}
        </div>
        <div>
          <label className='block mb-1'>Password</label>
          <input
            type='password'
            {...register('password')}
            className='w-full px-3 py-2 border rounded-md'
          />
          {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}
        </div>
        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full bg-primary text-white py-2 rounded-md hover:bg-accent'
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
        <div className='relative text-center my-4'>
          <span className='text-gray-500 text-sm'>or</span>
        </div>
        <button
          type='button'
          onClick={handleGoogleSignIn}
          className='w-full border border-gray-300 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-dark3'
        >
          Sign In with Google
        </button>
        <p className='text-sm mt-2'>Don't have an account? <span className='text-accent cursor-pointer' onClick={() => navigate('/auth/signup')}>Register</span></p>
      </form>
    </div>
  );
};

export default SignIn;