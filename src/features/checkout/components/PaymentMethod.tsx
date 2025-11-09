import React from 'react';

interface PaymentMethodProps {
  value: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  value,
  label,
  checked,
  onChange,
  icon,
}) => {
  return (
    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
      <input
        type="radio"
        name="payment-method"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <div className="flex items-center">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
          checked ? 'border-blue-600' : 'border-gray-300'
        }`}>
          {checked && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          )}
        </div>
        {icon && <div className="mr-3">{icon}</div>}
        <div className="text-sm font-medium">{label}</div>
      </div>
    </label>
  );
};

export default PaymentMethod;
