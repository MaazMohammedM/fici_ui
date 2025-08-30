import React, { useState } from 'react';

export type PaymentMethod = {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
};

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const PaymentMethods: React.FC<Props> = ({ selected, onSelect }) => {
  const [local, setLocal] = useState(selected);

  const methods: PaymentMethod[] = [
    { id: 'razorpay', name: 'Online Payment', description: 'Cards, UPI, Netbanking', icon: '💳' },
    { id: 'cod', name: 'Cash on Delivery', description: 'Pay on delivery', icon: '💵' }
  ];

  const continueClicked = () => {
    setLocal(local);
    onSelect(local);
  };

  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Payment Method</h2>
      </div>

      <div className="space-y-3">
        {methods.map(m => (
          <div key={m.id} onClick={() => setLocal(m.id)} className={`p-4 border rounded-lg cursor-pointer ${local === m.id ? 'border-accent bg-accent/5' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{m.icon}</div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{m.name}</h3>
                    <input type="radio" checked={local === m.id} onChange={() => setLocal(m.id)} />
                  </div>
                  <p className="text-sm text-gray-600">{m.description}</p>
                </div>
              </div>
            </div>

            {m.id === 'razorpay' && local === 'razorpay' && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-dark2 rounded">
                <p className="text-xs">Accepted: Cards • UPI • Netbanking • Wallets</p>
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

      <button onClick={continueClicked} disabled={!local} className="w-full mt-6 bg-accent text-white py-2 rounded-lg">
        Continue
      </button>
    </div>
  );
};

export default PaymentMethods;
