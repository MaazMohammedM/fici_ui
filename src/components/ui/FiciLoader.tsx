import React from 'react';

interface FiciLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const FiciLoader: React.FC<FiciLoaderProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const logoSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Spinning border */}
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
      
      {/* FICI logo in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`font-bold text-primary ${logoSizeClasses[size]} tracking-wider`}>
          FICI
        </div>
      </div>
    </div>
  );
};

export default FiciLoader;
