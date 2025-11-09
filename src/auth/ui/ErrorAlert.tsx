// src/components/ui/ErrorAlert/ErrorAlert.tsx
import  { memo } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string | { message: string; code?: string };
  onDismiss?: () => void;
}

export const ErrorAlert = memo<ErrorAlertProps>(({ message, onDismiss }) => {
  const errorMessage = typeof message === 'string' ? message : message.message;
  const errorCode = typeof message === 'object' && 'code' in message ? message.code : undefined;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1">
        {errorMessage}
        {errorCode && <div className="text-xs mt-1">Error code: {errorCode}</div>}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
});

ErrorAlert.displayName = 'ErrorAlert';