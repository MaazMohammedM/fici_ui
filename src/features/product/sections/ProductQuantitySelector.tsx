import React from "react";
import { Minus, Plus } from "lucide-react";

interface Props {
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  className?: string;
}

const ProductQuantitySelector: React.FC<Props> = ({
  quantity,
  maxQuantity,
  onQuantityChange,
  disabled = false,
  className = "",
}) => {
  const isMaxReached = maxQuantity > 0 && quantity >= maxQuantity;
  
  const getSafeQuantity = (requestedQuantity: number): number => {
    if (maxQuantity <= 0) return 1;
    return Math.min(Math.max(1, requestedQuantity), maxQuantity);
  };
  
  const handleDecrease = () => {
    if (!disabled && quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (!disabled && (maxQuantity === 0 || quantity < maxQuantity)) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const value = e.target.value;
    
    if (value === '') {
      onQuantityChange(1);
      return;
    }
    
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    
    const safeQuantity = getSafeQuantity(numValue);
    if (safeQuantity !== numValue) {
      return;
    }
    
    onQuantityChange(safeQuantity);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const value = parseInt(e.target.value, 10);
    
    if (isNaN(value) || value < 1) {
      onQuantityChange(1);
    } else {
      const safeQuantity = getSafeQuantity(value);
      onQuantityChange(safeQuantity);
    }
  };

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      {/* Quantity Controls */}
      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={disabled || quantity <= 1}
          className={`w-10 h-12 inline-flex items-center justify-center rounded-l-lg border-2 transition-all ${
            disabled || quantity <= 1
              ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:scale-95 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <input
          type="number"
          min="1"
          max={maxQuantity > 0 ? maxQuantity : undefined}
          value={quantity}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-14 h-12 text-center text-base font-medium border-y-2 border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          aria-label="Quantity"
        />
        
        <button
          type="button"
          onClick={handleIncrease}
          disabled={disabled || isMaxReached}
          className={`w-10 h-12 inline-flex items-center justify-center rounded-r-lg border-2 transition-all ${
            disabled || isMaxReached
              ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:scale-95 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* Stock Badge */}
      {maxQuantity > 0 ? (
        <div className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          maxQuantity <= 2 
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            : maxQuantity <= 5
            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
            : 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
            maxQuantity <= 2 
              ? 'bg-red-500' 
              : maxQuantity <= 5
              ? 'bg-amber-500'
              : 'bg-green-500'
          }`}></div>
          <span>
            {maxQuantity > 5 
              ? `In stock (${maxQuantity}+)`
              : maxQuantity === 1
              ? "Only 1 left!"
              : quantity >= maxQuantity
              ? `Max qty (${maxQuantity})`
              : `Only ${maxQuantity} left!`}
          </span>
        </div>
      ) : !disabled && (
        <div className="inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 whitespace-nowrap">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 flex-shrink-0"></div>
          <span>Out of stock</span>
        </div>
      )}
    </div>
  );
};

export default ProductQuantitySelector;