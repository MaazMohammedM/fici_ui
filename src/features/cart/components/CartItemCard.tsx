// src/components/CartItemCard.tsx
import React from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import type { CartItem } from "@store/cartStore";
import { useCartStore } from "@store/cartStore";

interface CartItemCardProps {
  item: CartItem;
  onQuantityChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onQuantityChange, onRemove }) => {
  const { updateSize } = useCartStore();

  const handleSizeChange = (newSize: string) => {
    updateSize(item.id, newSize);
  };


  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex gap-4 mb-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
          </div>
          
          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1 line-clamp-2">
              {item.name}
            </h3>
            <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Color: {item.color}</span>
              <div className="flex items-center gap-2">
                <span>Size:</span>
                {item.availableSizes && item.availableSizes.length > 1 ? (
                  <select
                    value={item.size}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="bg-white dark:bg-dark2 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {item.availableSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm">{item.size}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 line-through">₹{item.mrp}</span>
              <span className="text-lg font-bold text-primary">₹{item.price}</span>
              {item.discount_percentage > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  {item.discount_percentage}% OFF
                </span>
              )}
            </div>
          </div>
          
          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors h-fit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        
        {/* Quantity and Total Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => onQuantityChange(item.id, -1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-base font-semibold">{item.quantity}</span>
            <button
              onClick={() => onQuantityChange(item.id, 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-6">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
            {item.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Color: {item.color}</span>
            <div className="flex items-center gap-2">
              <span>Size:</span>
              {item.availableSizes && item.availableSizes.length > 1 ? (
                <select
                  value={item.size}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  className="bg-white dark:bg-dark2 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {item.availableSizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm">{item.size}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 line-through">₹{item.mrp}</span>
            <span className="text-lg font-bold text-primary">₹{item.price}</span>
            {item.discount_percentage > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                {item.discount_percentage}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => onQuantityChange(item.id, -1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-lg font-semibold">{item.quantity}</span>
            <button
              onClick={() => onQuantityChange(item.id, 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Total Price */}
        <div className="text-right">
          <div className="text-lg font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
