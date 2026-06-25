import React from 'react';
import PaymentMethods from './PaymentMethods';
import { useThemeStore } from '@store/themeStore';

interface CheckoutPaymentSectionProps {
  selectedPayment: "razorpay" | "cod";
  onPaymentSelect: (id: "razorpay" | "cod") => void;
  prepaidDiscount: number;
  onCodOtpRequired: () => void;
  codAvailable: boolean;
  codFee?: number;
  codFeesApplicable?: boolean;
  isIdentityVerified: boolean;
  checkoutSessionId: string | null;
  isPincodeServiceable: boolean;
  checkoutRule: any;
  checkoutOfferLabel: string;
  subtotal: number;
  codConfirmOpen: boolean;
  setCodConfirmOpen: (open: boolean) => void;
  codWarningShown: boolean;
  setCodWarningShown: (shown: boolean) => void;
  showAlert: (message: string, type: "info" | "warning" | "error" | "success") => void;
}

const CheckoutPaymentSection: React.FC<CheckoutPaymentSectionProps> = ({
  selectedPayment,
  onPaymentSelect,
  prepaidDiscount,
  onCodOtpRequired,
  codAvailable,
  codFee = 0,
  codFeesApplicable = false,
  isIdentityVerified,
  checkoutSessionId,
  isPincodeServiceable,
  checkoutRule,
  checkoutOfferLabel,
  subtotal,
  codConfirmOpen,
  setCodConfirmOpen,
  codWarningShown,
  setCodWarningShown,
  showAlert
}) => {
  const { mode } = useThemeStore();

  const handlePaymentSelection = (id: "razorpay" | "cod") => {
    if (
      id === "cod" &&
      !codWarningShown &&
      prepaidDiscount > 0
    ) {
      setCodConfirmOpen(true);
    }
    onPaymentSelect(id);
  };

  return (
    <>
      {/* Checkout offer banner (prepaid rule) */}
      {checkoutRule && checkoutOfferLabel && (
        <div className="bg-green-50 dark:bg-dark3 border border-green-200 dark:border-green-700/50 rounded-xl p-4 sm:p-5 flex items-start gap-3 shadow-sm mb-6">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-200">
              {checkoutOfferLabel}
            </p>
            {checkoutRule.min_order &&
              subtotal < Number(checkoutRule.min_order) && (
                <p className="mt-1 text-xs sm:text-sm text-green-700 dark:text-green-300">
                  Add ₹
                  {Math.max(
                    0,
                    Number(checkoutRule.min_order) - subtotal
                  ).toLocaleString("en-IN")}{" "}
                  more to unlock {checkoutOfferLabel}.
                </p>
              )}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <PaymentMethods
        selected={selectedPayment}
        onSelect={handlePaymentSelection}
        prepaidDiscount={prepaidDiscount}
        onCodOtpRequired={onCodOtpRequired}
        codAvailable={codAvailable}
        codFee={codFee}
        codFeesApplicable={codFeesApplicable}
        isIdentityVerified={isIdentityVerified}
        checkoutSessionId={checkoutSessionId}
        isPincodeServiceable={isPincodeServiceable}
      />
    </>
  );
};

export default CheckoutPaymentSection;
