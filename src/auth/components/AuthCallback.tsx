import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '@store/authStore';
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui';

type CallbackStep = 'loading' | 'success' | 'error';

const AuthCallback = memo(() => {
  const [step, setStep] = useState<CallbackStep>('loading');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { setUser, setRole, setFirstName } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setStep('loading');

        // Check for OAuth tokens in URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const error_description = hashParams.get('error_description');
        
        if (error) {
          throw new Error(error_description || `OAuth error: ${error}`);
        }

        let session = null;

        if (access_token && refresh_token) {
          // Create direct Supabase client for session establishment
          const supabaseDirect = createClient(
            'https://qegaebazravcwofibtry.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZ2FlYmF6cmF2Y3dvZmlidHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODE4NzksImV4cCI6MjA2OTU1Nzg3OX0.YKP1oM0WIWzuaa47S6OTVEitBalCNqBQxgoLw0yiUg0',
            {
              auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
              }
            }
          );

          const { data: { session: directSession }, error: sessionError } = await supabaseDirect.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (sessionError) {
            throw new Error(`Session setting error: ${sessionError.message}`);
          }
          
          session = directSession;

          // Now sync the session to the main Supabase client
          try {
            await supabase.auth.setSession({
              access_token,
              refresh_token
            });
          } catch (syncError) {
            // Continue anyway, as the auth store will handle the user
          }
        } else {
          // Try to get session from main Supabase client
          const { data: { session: mainSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw new Error(`Session retrieval error: ${sessionError.message}`);
          }
          
          session = mainSession;
        }

        if (!session?.user) {
          throw new Error('No user session found after OAuth callback');
        }

        const user = session.user;
        console.log('AuthCallback: Setting user in store:', user.id);

        // Set user in store - profile will be handled by auth store automatically
        setUser(user);

        // Wait a bit for profile to be created by auth store
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStep('success');

        // Clean up URL by removing OAuth tokens from hash
        if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token'))) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Redirect after a short delay
        setTimeout(() => navigate('/'), 1500);

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStep('error');
      }
    };

    handleAuth();
  }, [navigate, setUser, setRole, setFirstName]);

  // Loading State
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

  // Error State
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
              <Button
                onClick={() => navigate('/auth/signin')}
                rightIcon={ArrowRight}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success State
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
});

AuthCallback.displayName = 'AuthCallback';
export default AuthCallback;