import React from "react";
import { Minus, Plus } from "lucide-react";

interface Props {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

const ProductQuantitySelector: React.FC<Props> = ({
  quantity,
  onQuantityChange,
}) => {
  const decrease = () => onQuantityChange(Math.max(1, quantity - 1));
  const increase = () => onQuantityChange(quantity + 1);

  return (
    <div>
      <h3 className="text-lg font-semibold text-primary dark:text-secondary mb-2">
        Quantity
      </h3>
      <div className="flex items-center w-max border rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <button
          onClick={decrease}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-xl transition"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-6 py-2 text-lg font-medium select-none">
          {quantity}
        </span>
        <button
          onClick={increase}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProductQuantitySelector;