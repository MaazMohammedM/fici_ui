import React, { useState, useRef, useEffect } from 'react';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  placeholder?: React.ReactNode;
}

const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  placeholder
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultPlaceholder = (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center">
      <div className="text-gray-400 dark:text-gray-500">Loading...</div>
    </div>
  );

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
};

export default LazyLoadWrapper;
