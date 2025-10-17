import React from 'react';
import { X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  title?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  showCancel?: boolean;
  onConfirm?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  message,
  onClose,
  title = 'Alert',
  type = 'info',
  showCancel = false,
  onConfirm
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    info: 'bg-gradient-primary',
    warning: 'bg-gradient-accent',
    error: 'bg-red-500',
    success: 'bg-green-500'
  };

  const getIconPath = (type: string) => {
    switch (type) {
      case 'success':
        return 'M5 13l4 4L19 7';
      case 'error':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-modern animate-scale-in max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${typeStyles[type]} text-white`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={getIconPath(type)}
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className={`flex ${showCancel ? 'justify-between' : 'justify-end'} p-6 border-t bg-gray-50 dark:bg-dark3`}>
          {showCancel && (
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-dark2 transition-all duration-200"
            >
              Cancel
            </button>
          )}
          <button
            onClick={showCancel && onConfirm ? onConfirm : onClose}
            className={`btn-primary px-6 py-3 font-semibold transition-all duration-200 hover:scale-105 ${
              showCancel ? 'ml-3' : ''
            }`}
          >
            {showCancel ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
