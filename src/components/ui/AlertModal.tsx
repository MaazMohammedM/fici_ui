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
    info:    'bg-gradient-primary',
    warning: 'bg-gradient-accent',
    error:   'bg-red-500',
    success: 'bg-green-500',
  };

  const getIconPath = (t: string) => {
    switch (t) {
      case 'success':
        return 'M5 13l4 4L19 7';
      case 'error':
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  const isCartVerification = cartItems.length > 0;

  return (
    /*
     * Overlay
     * ───────
     * items-end on mobile so the sheet rises from the bottom (thumb-friendly).
     * sm:items-center centres it on larger screens.
     */
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">

      {/*
       * Modal shell
       * ───────────
       * flex flex-col  → header / content / footer stack vertically
       * max-h-[90dvh]  → never taller than 90% of the *dynamic* viewport
       *                  (dvh accounts for mobile browser chrome correctly)
       * w-full + rounded-t → full-width sheet on mobile
       * sm:max-w-lg + sm:rounded → centred card on tablet/desktop
       */}
      <div className="
        flex flex-col
        w-full max-h-[90dvh] max-w-lg
        rounded-2xl
        bg-white dark:bg-gray-900
        shadow-2xl
        animate-scale-in
        overflow-hidden
      ">

        {/* ── HEADER (never scrolls away) ─────────────────────────────── */}
        <div className={`flex-shrink-0 flex items-center justify-between px-4 py-4 sm:px-6 ${typeStyles[type]} text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(type)} />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold leading-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-2 rounded-full hover:bg-white/20 transition-all duration-200 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SCROLLABLE CONTENT (takes remaining space) ──────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {!isCartVerification ? (
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {message}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-lg text-sm">
                <p className="text-yellow-700 dark:text-yellow-300">{message}</p>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <img
                      src={item.thumbnail_url || item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {item.color} · {item.size} · Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => onMoveToWishlist?.(item)}
                        className="p-1.5 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                        title="Move to Wishlist"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveFromCart?.(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

        {/* ── FOOTER — always pinned at the bottom, never hidden ──────── */}
        <div className="
          flex-shrink-0
          flex flex-row gap-3
          px-4 py-4 sm:px-6
          border-t border-gray-200 dark:border-gray-700
          bg-gray-50 dark:bg-gray-800
        ">
          {showCancel && (
            <button
              onClick={onClose}
              className="
                flex-1 min-w-0
                px-4 py-3
                rounded-xl border border-gray-300 dark:border-gray-600
                text-gray-700 dark:text-gray-300
                font-semibold text-sm sm:text-base
                bg-white dark:bg-gray-700
                hover:bg-gray-100 dark:hover:bg-gray-600
                transition-colors duration-200
                truncate
              "
            >
              {cancelText || 'Cancel'}
            </button>
          )}

          <button
            onClick={
              isCartVerification
                ? onProceedToCheckout
                : showCancel && onConfirm
                  ? onConfirm
                  : onClose
            }
            className="
              flex-1 min-w-0
              flex items-center justify-center gap-2
              px-4 py-3
              rounded-xl
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold text-sm sm:text-base
              transition-colors duration-200
              truncate
            "
          >
            {isCartVerification ? (
              <>
                <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Checkout ({cartItems.length})</span>
              </>
            ) : (
              <span className="truncate">
                {showCancel ? (confirmText || 'Confirm') : (confirmText || 'OK')}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AlertModal;