import React from 'react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import type { CartItem } from '@store/cartStore';

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  title?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  showCancel?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  // Cart verification props
  cartItems?: CartItem[];
  onMoveToWishlist?: (item: CartItem) => void;
  onRemoveFromCart?: (item: CartItem) => void;
  onProceedToCheckout?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  message,
  onClose,
  title = 'Alert',
  type = 'info',
  showCancel = false,
  onConfirm,
  confirmText,
  cancelText,
  cartItems = [],
  onMoveToWishlist,
  onRemoveFromCart,
  onProceedToCheckout
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

  const isCartVerification = cartItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-modern animate-scale-in max-w-2xl w-full max-h-[90vh] overflow-hidden">
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
        <div className="p-6 max-h-96 overflow-y-auto">
          {!isCartVerification ? (
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {message}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-lg text-sm">
                <p className="text-yellow-700 dark:text-yellow-300">
                  {message}
                </p>
              </div>
              
              {/* Cart Items List */}
              <div className="space-y-3 mt-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <img
                      src={item.thumbnail_url || item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.color} • {item.size} • Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onMoveToWishlist?.(item)}
                        className="p-2 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                        title="Move to Wishlist"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveFromCart?.(item)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from Cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex ${showCancel ? 'justify-between' : 'justify-end'} p-6 border-t bg-gray-50 dark:bg-dark3`}>
          {showCancel && (
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-dark2 transition-all duration-200"
            >
              {cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={isCartVerification ? onProceedToCheckout : (showCancel && onConfirm ? onConfirm : onClose)}
            className={`btn-primary px-6 py-3 font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
              showCancel ? 'ml-3' : ''
            }`}
          >
            {isCartVerification ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                Proceed to Checkout ({cartItems.length} items)
              </>
            ) : (
              showCancel ? (confirmText || 'Confirm') : (confirmText || 'OK')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
