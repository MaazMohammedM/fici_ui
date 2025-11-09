import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ficiLogo from '../../assets/fici_transparent.png';

export interface FiciLoaderProps {
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  /** Optional message to display below the loader */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

const FiciLoader: React.FC<FiciLoaderProps> = ({ 
  size = 'md',
  message,
  className = '',
  'aria-label': ariaLabel = 'Loading...'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    fullscreen: 'w-32 h-32'
  };

  const loader = (
    <div 
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <motion.div
        className={`relative ${sizeClasses[size]}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.img
          src={ficiLogo}
          alt="" // Intentionally empty as it's decorative
          className="w-full h-full object-contain"
          aria-hidden="true"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
      {message && (
        <motion.p 
          className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          role="status"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (size === 'fullscreen') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          >
            {loader}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return isVisible ? loader : null;
};

export default FiciLoader;
