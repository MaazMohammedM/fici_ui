import React from 'react';
import { Info } from 'lucide-react';

interface InfoBannerProps {
  title: string;
  message: string;
  helperText?: string;
  className?: string;
  visible?: boolean;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  title,
  message,
  helperText,
  className = '',
  visible = true
}) => {
  if (!visible) return null;

  return (
    <div 
      className={`bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-lg ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
            {title}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            {message}
          </p>
          {helperText && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
              {helperText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
