import React, { useState } from 'react';

interface PaymentMethodsProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
  onBack: () => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ selectedMethod, onSelect, onBack }) => {
  const [localSelection, setLocalSelection] = useState(selectedMethod);

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Online Payment',
      description: 'Pay securely with Credit/Debit Card, UPI, Net Banking',
      icon: '💳',
      popular: true,
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when your order is delivered',
      icon: '💵',
      popular: false,
    },
  ];

  const handleContinue = () => {
    onSelect(localSelection);
  };

  return (
    <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
          Payment Method
        </h2>
        <button
          onClick={onBack}
          className="text-[color:var(--color-accent)] hover:underline font-medium"
        >
          ← Back to Address
        </button>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
              localSelection === method.id
                ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/5 ring-2 ring-[color:var(--color-accent)]/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-[color:var(--color-accent)]/50'
            }`}
            onClick={() => setLocalSelection(method.id)}
          >
            {method.popular && (
              <div className="absolute top-0 right-4 -translate-y-1/2">
                <span className="bg-[color:var(--color-accent)] text-white text-xs px-2 py-1 rounded-full font-medium">
                  Recommended
                </span>
              </div>
            )}
            
            <div className="flex items-start space-x-4">
              <div className="text-2xl">{method.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                    {method.name}
                  </h3>
                  <input
                    type="radio"
                    checked={localSelection === method.id}
                    onChange={() => setLocalSelection(method.id)}
                    className="text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]"
                  />
                </div>
                <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70 mt-1">
                  {method.description}
                </p>
                
                {method.id === 'razorpay' && localSelection === method.id && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-[color:var(--color-dark1)] rounded-lg">
                    <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] font-medium mb-2">
                      Accepted Payment Methods:
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                      <span className="flex items-center space-x-1">
                        <span>💳</span>
                        <span>Cards</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>📱</span>
                        <span>UPI</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>🏦</span>
                        <span>Net Banking</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>💰</span>
                        <span>Wallets</span>
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                          Secured by:
                        </span>
                        <span className="font-medium text-[color:var(--color-accent)]">
                          Razorpay 🛡️
                        </span>
                      </div>
                      <p className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-60 mt-1">
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>
                )}
                
                {method.id === 'cod' && localSelection === method.id && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-[color:var(--color-dark1)] rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 text-sm">⚠️</span>
                      <div className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                        <p className="font-medium mb-1">Cash on Delivery Guidelines:</p>
                        <ul className="space-y-1">
                          <li>• Please keep exact change ready</li>
                          <li>• COD charges may apply for orders below ₹500</li>
                          <li>• Delivery executive will collect payment</li>
                          <li>• Refunds will be processed to your bank account</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Features */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-green-600">🔒</span>
          <h4 className="font-medium text-green-800 dark:text-green-300">
            Your payment is secure
          </h4>
        </div>
        <p className="text-sm text-green-700 dark:text-green-400">
          We use industry-standard encryption to protect your payment information. 
          Your financial details are never stored on our servers.
        </p>
      </div>

      <button
        onClick={handleContinue}
        disabled={!localSelection}
        className="w-full mt-6 bg-[color:var(--color-accent)] text-white py-3 rounded-lg font-semibold hover:bg-[color:var(--color-accent)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Review
      </button>
    </div>
  );
};

export default PaymentMethods;
