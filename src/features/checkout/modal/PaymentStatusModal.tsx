import React from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@store/cartStore';

interface PaymentStatusModalProps {
  status: 'success' | 'failed' | 'pending';
  orderId?: string;
  message?: string;
  onClose: () => void;
  onRetry?: () => void;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  status,
  orderId,
  message,
  onClose,
  onRetry
}) => {
  const navigate = useNavigate();
  const { items: cartItems, getCartTotal, getCartSavings, clearCart } = useCartStore();

  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const total = subtotal;

  const closePaymentModal = () => {
    const wasSuccess = status === 'success';
    if (wasSuccess) {
      clearCart(); // This will clear the cart after successful payment
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Payment Successful!',
          subtitle: message || 'Your order has been placed successfully',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Payment Failed',
          subtitle: 'Your payment was not completed. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          icon: <AlertCircle className="w-16 h-16 text-yellow-500" />,
          title: 'Payment Pending',
          subtitle: 'Your payment is being processed',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const config = getStatusConfig();

  const handleViewOrders = () => {
    closePaymentModal();
    navigate('/orders');
    onClose();
  };

  const handleContinueShopping = () => {
    closePaymentModal();
    navigate('/');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto ${config.bgColor} ${config.borderColor} border-2`}>
        {/* Header */}
        <div className="text-center p-4 sm:p-8">
          {config.icon}
          <h2 className={`text-xl sm:text-2xl font-bold mt-4 ${config.color}`}>
            {config.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            {config.subtitle}
          </p>
        </div>

        {/* Order Details - Only show for success */}
        {status === 'success' && orderId && (
          <div className="px-4 sm:px-8 pb-4 sm:pb-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                Order Details
              </h3>
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                  <span className="font-medium text-gray-900 dark:text-white break-all">{orderId}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Savings:</span>
                  <span className="font-medium text-green-600">₹{savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total:</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 sm:px-8 pb-4 sm:pb-8 space-y-3 sm:space-y-4">
          {status === 'success' && (
            <>
              <button
                onClick={handleViewOrders}
                className="w-full bg-blue-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Truck className="w-4 sm:w-5 h-4 sm:h-5" />
                View My Orders
              </button>
              <button
                onClick={handleContinueShopping}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                Continue Shopping
              </button>
            </>
          )}

          {status === 'failed' && onRetry && (
            <>
              <button
                onClick={onRetry}
                className="w-full bg-red-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5" />
                Retry Payment
              </button>
              <button
                onClick={handleContinueShopping}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                Continue Shopping
              </button>
            </>
          )}

          {status === 'pending' && (
            <button
              onClick={handleViewOrders}
              className="w-full bg-yellow-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-yellow-700 transition-colors text-sm sm:text-base"
            >
              Check Order Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusModal;