import { memo } from 'react';
import { Button, GoogleIcon } from '../ui';

interface GoogleAuthButtonProps {
  onClick: () => void;
  loading?: boolean;
  mode?: 'signin' | 'signup';
}

export const GoogleAuthButton = memo<GoogleAuthButtonProps>(({ 
  onClick, 
  loading = false, 
}) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    loading={loading}
    className="w-full"
  >
    <div className="flex items-center gap-3">
      <GoogleIcon />
      Continue with Google
    </div>
  </Button>
));

GoogleAuthButton.displayName = 'GoogleAuthButton';
export default GoogleAuthButton;