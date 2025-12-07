import React, { useState, useEffect } from 'react';

export type PaymentMethod = {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
};

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  prepaidDiscount?: number;
  onCodOtpRequired?: () => void;
  otpVerified?: boolean;
  codAvailable?: boolean; // Add this prop
}

const PaymentMethods: React.FC<Props> = ({
  selected,
  onSelect,
  prepaidDiscount = 0,
  onCodOtpRequired,
  otpVerified = false,
  codAvailable = true,
}) => {
  const [local, setLocal] = useState(selected);

  // Keep local in sync with parent selection
  useEffect(() => {
    setLocal(selected);
  }, [selected]);

  const methods: PaymentMethod[] = [
    {
      id: 'razorpay',
      name: 'Online Payment',
      description: 'Pay instantly with Cards, UPI, Netbanking, Wallets',
      icon: '💳',
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay in cash when your order arrives',
      icon: '💵',
    },
  ];

  const handleMethodSelect = (methodId: string) => {
    // Prevent selecting COD if not available
    if (methodId === 'cod' && !codAvailable) {
      return;
    }
    setLocal(methodId);
    onSelect(methodId);
  };

  const hasPrepaidOffer = prepaidDiscount > 0;

  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Payment Method</h2>
        {hasPrepaidOffer && (
          <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 text-xs font-medium">
            Save ₹{prepaidDiscount.toLocaleString('en-IN')} on prepaid
          </span>
        )}
      </div>

      <div className="space-y-3">
        {methods.map((m) => {
          const isSelected = local === m.id;
          const isOnline = m.id === 'razorpay';
          const isCOD = m.id === 'cod';
          const isDisabled = isCOD && !codAvailable;

          return (
            <div
              key={m.id}
              onClick={() => handleMethodSelect(m.id)}
              className={`relative p-4 border rounded-xl transition-all duration-150 ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-100'
                  : isSelected
                    ? 'border-accent bg-accent/5 shadow-sm cursor-pointer'
                    : 'border-gray-200 dark:border-gray-700 hover:border-accent/70 hover:bg-accent/5 cursor-pointer'
              }`}
            >
              {/* Top ribbon for best value */}
              {isOnline && hasPrepaidOffer && (
                <div className="absolute -top-2 right-3 rounded-full bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm">
                  Best value
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">{m.icon}</div>
                  <div>
                    <div className="flex items-center gap-3 mb-0.5">
                      <h3 className="font-semibold">{m.name}</h3>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleMethodSelect(m.id)}
                        className="w-4 h-4 accent-accent"
                        disabled={isDisabled}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {m.description}
                    </p>

                    {/* Extra message for Online payment */}
                    {isOnline && hasPrepaidOffer && (
                      <p className="mt-2 text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
                        Get instant discount of ₹
                        {prepaidDiscount.toLocaleString('en-IN')} on this order.
                      </p>
                    )}

                    {/* Message when COD is not available */}
                    {isCOD && isDisabled && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                        Cash on Delivery is not available for this pincode. Please choose online payment.
                      </p>
                    )}

                    {/* Gentle note for COD when prepaid offer exists */}
                    {isCOD && !isDisabled && hasPrepaidOffer && (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                        Note: Prepaid orders get an extra discount of ₹
                        {prepaidDiscount.toLocaleString(
                          'en-IN'
                        )}. COD will not include this offer.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra content for Online Payment */}
              {isOnline && isSelected && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Accepted: Cards • UPI • Netbanking • Wallets
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Payments are processed securely via Razorpay.
                  </p>
                </div>
              )}

              {/* COD OTP needed */}
              {isCOD && isSelected && !otpVerified && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-white text-xs">i</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        OTP Verification Required
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        For Cash on Delivery orders, we verify your contact details to
                        ensure smooth delivery and avoid failed attempts.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCodOtpRequired && onCodOtpRequired();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    Verify OTP
                  </button>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    You’ll be redirected back here after verification.
                  </p>
                </div>
              )}

              {/* COD OTP complete */}
              {isCOD && isSelected && otpVerified && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                        OTP Verification Complete
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your contact information is verified. You can now place your
                        Cash on Delivery order.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethods;
