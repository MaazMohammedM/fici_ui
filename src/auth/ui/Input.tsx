// src/components/ui/Input/Input.tsx
import React, { forwardRef } from 'react';
type LucideIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightIcon?: React.JSX.Element;
  variant?: 'default' | 'error';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const inputClasses = `
    w-full pr-4 py-3 border rounded-lg transition-colors text-sm sm:text-base
    focus:ring-2 focus:ring-primary focus:border-transparent
    dark:bg-gray-800 dark:text-white
    ${LeftIcon ? 'pl-10 sm:pl-10' : 'pl-4'}
    ${rightIcon ? 'pr-12' : 'pr-4'}
    ${variant === 'error' 
      ? 'border-red-300 dark:border-red-500' 
      : 'border-gray-300 dark:border-gray-600'
    }
    ${className}
  `.trim();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-white">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <LeftIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs sm:text-sm">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';