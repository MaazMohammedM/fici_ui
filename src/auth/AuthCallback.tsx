import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const setFirstName = useAuthStore((s) => s.setFirstName);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();
  
        if (sessionError || !session?.user) {
          throw new Error(sessionError?.message || 'Session not found');
        }
  
        const user = session.user;
        setUser(user);
  
        const { data: profile, error: profileError, status } = await supabase
        .from('user_profiles')
        .select('first_name, role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError && status !== 406) {
        console.error('Profile query failed:', profileError);
        throw new Error('Failed to fetch profile');
      }
      
      if (!profile) {
        const fullName = user.user_metadata?.full_name || '';
        const [firstName = ''] = fullName.split(' ');
      
        const { error: insertError, status: insertStatus } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: user.id,
              email: user.email,
              first_name: firstName,
              role: 'user'
            }
          ]);
      
        if (insertError || insertStatus !== 201) {
          console.error('Insert failed with error:', insertError);
          throw new Error('Failed to create user profile');
        }
      
        console.log('✅ New user profile inserted');
        setFirstName(firstName);
        setRole('user');
      } else {
        setFirstName(profile.first_name || '');
        setRole(profile.role || 'user');
      }
      
  
        navigate('/');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };
  
    handleAuth();
  }, [navigate, setUser, setRole, setFirstName]);
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light dark:bg-gradient-dark">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <h2 className="text-xl font-semibold text-primary dark:text-secondary mb-2">
            Completing authentication...
          </h2>
          <p className="text-sm text-primary/70 dark:text-secondary/70">
            Please wait while we sign you in
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light dark:bg-gradient-dark px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-xl shadow-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary dark:text-secondary mb-2">
              Authentication Failed
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/auth/signin')}
              className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-light dark:bg-gradient-dark">
      <div className="text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-primary dark:text-secondary mb-2">
          Authentication Successful
        </h2>
        <p className="text-sm text-primary/70 dark:text-secondary/70">
          Redirecting you now...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;