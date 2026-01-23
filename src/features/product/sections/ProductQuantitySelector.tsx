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
  
  // Defensive quantity calculation - ensures quantity is always within valid bounds
  const getSafeQuantity = (requestedQuantity: number): number => {
    if (maxQuantity <= 0) return 1; // No stock limit, default to 1
    return Math.min(Math.max(1, requestedQuantity), maxQuantity);
  };
  
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (maxQuantity === 0 || quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input (will be handled on blur)
    if (value === '') {
      onQuantityChange(1);
      return;
    }
    
    const numValue = parseInt(value, 10);
    
    // Validate the input
    if (isNaN(numValue) || numValue < 1) {
      // Don't update for invalid input, let blur handle it
      return;
    }
    
    // Use defensive validation to ensure quantity is within bounds
    const safeQuantity = getSafeQuantity(numValue);
    if (safeQuantity !== numValue) {
      // Input exceeds max quantity, don't update
      return;
    }
    
    // Valid input, update quantity
    onQuantityChange(safeQuantity);
  };

  // Handle blur - reset to valid bounds
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    
    if (isNaN(value) || value < 1) {
      onQuantityChange(1);
    } else {
      // Always use defensive validation on blur
      const safeQuantity = getSafeQuantity(value);
      onQuantityChange(safeQuantity);
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Quantity Selector */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="flex items-center max-w-xs sm:max-w-none">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={disabled || quantity <= 1}
            className={`w-8 h-8 sm:w-10 sm:h-12 flex items-center justify-center rounded-l-lg border transition-all duration-200 ${
              disabled || quantity <= 1
                ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-95 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500"
            }`}
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          
          <div className="relative flex-1 min-w-0">
            <input
              type="number"
              min="1"
              max={maxQuantity > 0 ? maxQuantity : undefined}
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={disabled}
              className="w-full h-8 sm:h-12 text-center text-sm sm:text-base font-medium border-t border-b border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-accent/40"
              aria-label="Quantity"
            />
            <div className="absolute inset-0 pointer-events-none border border-transparent hover:border-accent/20 transition-colors duration-200"></div>
          </div>
          
          <button
            type="button"
            onClick={handleIncrease}
            disabled={disabled || isMaxReached}
            className={`w-8 h-8 sm:w-10 sm:h-12 flex items-center justify-center rounded-r-lg border transition-all duration-200 ${
              disabled || isMaxReached
                ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-95 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500"
            }`}
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      
      {/* Stock Information */}
      <div className="flex items-center justify-center sm:justify-start">
        {maxQuantity > 0 ? (
          <div className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium max-w-full truncate ${
            maxQuantity <= 2 
              ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
              : maxQuantity <= 5
              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
              : 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
          }`}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 flex-shrink-0 ${
              maxQuantity <= 2 
                ? 'bg-red-500' 
                : maxQuantity <= 5
                ? 'bg-amber-500'
                : 'bg-green-500'
            }`}></div>
            <span className="truncate">
              {maxQuantity > 5 
                ? `In stock (${maxQuantity}+)`
                : maxQuantity === 1
                ? "Only 1 left!"
                : quantity >= maxQuantity
                ? `Maximum quantity reached (${maxQuantity})`
                : `Only ${maxQuantity} left!`}
            </span>
          </div>
        ) : !disabled && (
          <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mr-1.5 sm:mr-2 flex-shrink-0"></div>
            <span className="truncate">Out of stock</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductQuantitySelector;