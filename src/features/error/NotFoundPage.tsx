import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../.././auth/ui';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-light dark:bg-gradient-dark p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary dark:text-secondary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => navigate('/')}
          className="px-6 py-3 text-base"
        >
          Go to Homepage
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
