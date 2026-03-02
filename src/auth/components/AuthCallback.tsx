import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from '../../lib/firebase';
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
    setStep('loading');

    const auth = getAuth();
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setStep('success');
        
        // Redirect after a short delay
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError('Authentication failed');
        setStep('error');
      }
    });

    // Cleanup subscription
    return unsubscribe;
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