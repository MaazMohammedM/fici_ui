import React, { memo } from 'react';
type LucideIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = memo<ButtonProps>(({
  variant = 'primary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-active text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs sm:text-sm',
    md: 'px-4 py-3 text-sm sm:text-base',
    lg: 'px-6 py-4 text-base sm:text-lg'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  const isDisabled = disabled || loading;

  return (
    <button
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {typeof children === 'string' ? `${children}...` : children}
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
          {children}
          {RightIcon && <RightIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';