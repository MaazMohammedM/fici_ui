import { Minus, Plus } from "lucide-react";
import React from "react";

interface ProductQuantitySelectorProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  maxQuantity?: number;
  minQuantity?: number;
}

const ProductQuantitySelector: React.FC<ProductQuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  maxQuantity = 10,
  minQuantity = 1,
}) => {
  const increase = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  const decrease = () => {
    if (quantity > minQuantity) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= minQuantity && value <= maxQuantity) {
      onQuantityChange(value);
    } else if (e.target.value === "") {
      onQuantityChange(minQuantity);
    }
  };

  const isMaxReached = quantity >= maxQuantity;
  const isMinReached = quantity <= minQuantity;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Quantity
      </h3>
      <div className="flex items-center w-max border rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={decrease}
          disabled={isMinReached}
          className={`p-2 rounded-l-xl transition ${
            isMinReached
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <input
          type="number"
          min={minQuantity}
          max={maxQuantity}
          value={quantity}
          onChange={handleInputChange}
          className="w-16 px-2 py-2 text-center border-x border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-accent/50"
          aria-label="Quantity"
        />
        
        <button
          type="button"
          onClick={increase}
          disabled={isMaxReached}
          className={`p-2 rounded-r-xl transition ${
            isMaxReached
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {/* {maxQuantity > 0 && (
        <p className="text-xs text-gray-500">
          {maxQuantity} available
        </p>
      )} */}
    </div>
  );
};

export default ProductQuantitySelector;