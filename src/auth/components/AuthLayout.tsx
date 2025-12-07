// src/components/auth/AuthLayout/AuthLayout.tsx
import React, { memo } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout = memo<AuthLayoutProps>(({ title, subtitle, children }) => {
  const { mode } = useThemeStore();
  
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${
      mode === 'dark' ? 'bg-gray-900' : 'bg-gradient-light'
    }`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            mode === 'dark' ? 'text-secondary' : 'text-primary'
          }`}>
            {title}
          </h1>
          <p className={`text-sm sm:text-base ${
            mode === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {subtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className={`rounded-2xl shadow-xl p-6 sm:p-8 ${
          mode === 'dark' ? 'bg-dark2' : 'bg-white'
        }`}>
          {children}
        </div>
      </div>
    </div>
  );
});

AuthLayout.displayName = 'AuthLayout';
export default AuthLayout;