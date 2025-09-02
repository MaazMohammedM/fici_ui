import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { supabase } from '@lib/supabase';

interface UseAuthReturn {
  isLoading: boolean;
  error: string;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setUser, setRole, setFirstName } = useAuthStore();

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
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
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setUser, setRole, setFirstName]);

  const signUp = useCallback(async (userData: SignUpData) => {
    setIsLoading(true);
    setError('');

    try {
      const fullName = `${userData.firstName} ${userData.lastName}`;
      const { data: authData, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: fullName,
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (authData.user) {
        setUser({
          ...authData.user,
          user_metadata: {
            ...authData.user.user_metadata,
            first_name: userData.firstName
          }
        });
        
        await supabase.from('user_profiles').insert({
          user_id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'user'
        });
        
        setRole('user');
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setUser, setRole]);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    signIn,
    signUp,
    signInWithGoogle
  };
};