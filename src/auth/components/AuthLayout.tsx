// src/components/auth/AuthLayout/AuthLayout.tsx
import React, { memo } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout = memo<AuthLayoutProps>(({ title, subtitle, children }) => (
  <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4 py-8">
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-secondary mb-2">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-6 sm:p-8">
        {children}
      </div>
    </div>
  </div>
));

AuthLayout.displayName = 'AuthLayout';
export default AuthLayout;