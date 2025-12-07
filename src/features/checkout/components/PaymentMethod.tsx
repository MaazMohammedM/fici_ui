import React from 'react';

interface PaymentMethodProps {
  value: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  value,
  label,
  checked,
  onChange,
  icon,
  disabled = false,
}) => {
  return (
    <label 
      className={`flex items-center p-4 border rounded-lg transition-colors ${
        disabled 
          ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300' 
          : 'cursor-pointer hover:bg-gray-50 border-gray-200 dark:border-gray-700'
      }`}
    >
      <input
        type="radio"
        name="payment-method"
        value={value}
        checked={checked}
        onChange={() => !disabled && onChange(value)}
        className="sr-only"
        disabled={disabled}
      />
      <div className="flex items-center">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
          checked 
            ? 'border-blue-600' 
            : disabled 
              ? 'border-gray-400' 
              : 'border-gray-300'
        }`}>
          {checked && (
            <div className={`w-2.5 h-2.5 rounded-full ${
              disabled ? 'bg-gray-400' : 'bg-blue-600'
            }`}></div>
          )}
        </div>
        {icon && <div className={`mr-3 ${disabled ? 'opacity-50' : ''}`}>{icon}</div>}
        <div className={`text-sm font-medium ${disabled ? 'text-gray-500' : ''}`}>{label}</div>
      </div>
    </label>
  );
};

export default PaymentMethod;
