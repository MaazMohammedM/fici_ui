// src/components/auth/PasswordField/PasswordField.tsx
import React, { memo, useState, forwardRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui';

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const PasswordField = memo(forwardRef<HTMLInputElement, PasswordFieldProps>(({
  label = 'Password',
  error,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      label={label}
      error={error}
      leftIcon={Lock}
      rightIcon={
        <button
          type="button"
          onClick={togglePassword}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      }
      {...props}
    />
  );
}));

PasswordField.displayName = 'PasswordField';
export default PasswordField;