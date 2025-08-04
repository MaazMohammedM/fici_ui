import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [ _,setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();

  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const setFirstName = useAuthStore((s) => s.setFirstName);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setStep('loading');
        
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error(sessionError?.message || 'Authentication failed');
        }

        const user = session.user;
        setUser(user);

        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile query failed:', profileError);
          throw new Error('Failed to fetch user profile');
        }

        if (!profile) {
          // Create new profile for OAuth users
          const fullName = user.user_metadata?.full_name || '';
          const [firstName = ''] = fullName.split(' ');

          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: user.id,
                email: user.email,
                first_name: firstName,
                role: 'user'
              }
            ]);

          if (insertError) {
            console.error('Profile creation failed:', insertError);
            throw new Error('Failed to create user profile');
          }

          console.log('✅ New user profile created');
          setFirstName(firstName);
          setRole('user');
        } else {
          setFirstName(profile.first_name || '');
          setRole(profile.role || 'user');
        }

        setStep('success');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStep('error');
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [navigate, setUser, setRole, setFirstName]);

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-3">
            Completing Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Please wait while we set up your account and redirect you to the dashboard
          </p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Authentication Failed
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/auth/signin')}
                className="w-full bg-primary hover:bg-primary-active text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Try Again
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 dark:border-gray-600 py-3 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-3">
          Welcome!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your account has been successfully created. Redirecting you now...
        </p>
        <div className="flex items-center justify-center gap-2 text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecting...</span>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;