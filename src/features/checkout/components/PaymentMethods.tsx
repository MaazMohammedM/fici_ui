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
}

const PaymentMethods: React.FC<Props> = ({ selected, onSelect, prepaidDiscount = 200 }) => {
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

            {m.id === 'razorpay' && local === 'razorpay' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <span className="text-lg">🎉</span>
                  <p className="text-sm font-semibold">Get ₹{prepaidDiscount} OFF on prepaid orders!</p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Accepted: Cards • UPI • Netbanking • Wallets</p>
                <div className="mt-2 text-xs text-gray-600">Secured by Razorpay</div>
              </div>
            )}

            {m.id === 'cod' && local === 'cod' && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-dark2 rounded">
                <p className="text-xs">Keep exact change ready. COD charges may apply.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
