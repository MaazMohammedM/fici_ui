// src/components/auth/AuthDivider/AuthDivider.tsx
import { memo } from 'react';

export const AuthDivider = memo(() => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white dark:bg-dark2 text-gray-500">or</span>
    </div>
  </div>
));

AuthDivider.displayName = 'AuthDivider';
export default AuthDivider;