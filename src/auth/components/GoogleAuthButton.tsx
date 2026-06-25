import { memo } from 'react';
import { Button, GoogleIcon } from '../ui';
import { useAuthStore } from '@store/authStore';

interface GoogleAuthButtonProps {
  onClick: () => void;
  loading?: boolean;
  mode?: 'signin' | 'signup';
}

export const GoogleAuthButton = memo<GoogleAuthButtonProps>(({ 
  onClick, 
  loading = false, 
  mode = 'signin'
}) => {
  const { signInWithGoogle } = useAuthStore();

  const handleClick = () => {
    signInWithGoogle();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      loading={loading}
      className="w-full"
    >
      <div className="flex items-center gap-3">
        <GoogleIcon />
        {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
      </div>
    </Button>
  );
});

GoogleAuthButton.displayName = 'GoogleAuthButton';
export default GoogleAuthButton;