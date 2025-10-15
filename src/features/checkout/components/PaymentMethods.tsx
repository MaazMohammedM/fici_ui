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
  prepaidDiscount?: number; // ✅ Add prepaid discount prop
  onCodOtpRequired?: () => void; // Add callback for COD OTP requirement
  otpVerified?: boolean; // Add otpVerified prop
}

const PaymentMethods: React.FC<Props> = ({ selected, onSelect, prepaidDiscount = 200, onCodOtpRequired, otpVerified = false }) => {
  const [local, setLocal] = useState(selected);

  // Update local state when selected prop changes
  useEffect(() => {
    setLocal(selected);
  }, [selected]);

  const methods: PaymentMethod[] = [
    { id: 'razorpay', name: 'Online Payment', description: 'Cards, UPI, Netbanking', icon: '💳' },
    { id: 'cod', name: 'Cash on Delivery', description: 'Pay on delivery', icon: '💵' }
  ];

  const handleMethodSelect = (methodId: string) => {
    setLocal(methodId);
    onSelect(methodId); // ✅ Immediately call onSelect to update parent state
  };

  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Payment Method</h2>
      </div>

      <div className="space-y-3">
        {methods.map(m => (
          <div key={m.id} onClick={() => handleMethodSelect(m.id)} className={`p-4 border rounded-lg cursor-pointer transition-colors ${local === m.id ? 'border-accent bg-accent/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{m.icon}</div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{m.name}</h3>
                    <input type="radio" checked={local === m.id} onChange={() => handleMethodSelect(m.id)} />
                  </div>
                  <p className="text-sm text-gray-600">{m.description}</p>
                </div>
              </div>
            </div>

            {m.id === 'razorpay' && local === 'razorpay' && prepaidDiscount > 0 && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <span className="text-lg">🎉</span>
                  <p className="text-sm font-semibold">Get ₹{prepaidDiscount} OFF on prepaid orders!</p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Accepted: Cards • UPI • Netbanking • Wallets</p>
                <div className="mt-2 text-xs text-gray-600">Secured by Razorpay</div>
              </div>
            )}

            {m.id === 'cod' && local === 'cod' && !otpVerified && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-white text-xs">i</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      OTP Verification Required
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      For Cash on Delivery orders, we need to verify your contact information to ensure smooth delivery and communication.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCodOtpRequired}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Verify OTP
                </button>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Keep exact change ready. COD charges may apply.
                </p>
              </div>
            )}

            {m.id === 'cod' && local === 'cod' && otpVerified && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      OTP Verification Complete
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your contact information has been verified. You can now place your COD order.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
