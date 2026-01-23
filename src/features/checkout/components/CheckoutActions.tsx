import React from 'react';
import { useCartStore } from '@store/cartStore';

interface CheckoutActionsProps {
  onPlaceOrder: () => void;
  isProcessing: boolean;
  selectedAddress: any;
  selectedPayment: "razorpay" | "cod";
  isIdentityVerified: boolean;
  totalAmount: number;
}

const CheckoutActions: React.FC<CheckoutActionsProps> = ({
  onPlaceOrder,
  isProcessing,
  selectedAddress,
  selectedPayment,
  isIdentityVerified,
  totalAmount
}) => {
  const { items: cartItems } = useCartStore();

  const isButtonDisabled = 
    isProcessing ||
    !selectedAddress ||
    (selectedPayment === "cod" && !isIdentityVerified);

  const getButtonText = () => {
    if (isProcessing) {
      return (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      );
    } else if (!selectedAddress) {
      return "Please select a shipping address";
    } else if (selectedPayment === "cod" && !isIdentityVerified) {
      return "Complete OTP Verification to Place Order";
    } else {
      return `Place Order  ₹${totalAmount.toLocaleString("en-IN")}`;
    }
  };

  const getButtonClassName = () => {
    const baseClasses = "w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed";
    
    if (isButtonDisabled) {
      return `${baseClasses} bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed hover:scale-100`;
    } else {
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700`;
    }
  };

  return (
    <button
      onClick={onPlaceOrder}
      disabled={isButtonDisabled}
      className={getButtonClassName()}
    >
      {getButtonText()}
    </button>
  );
};

export default CheckoutActions;
