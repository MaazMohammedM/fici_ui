// src/components/CartItemCard.tsx
import React from "react";
import type { CartItem } from "../data/cartItems";

interface CartItemCardProps {
  item: CartItem;
  onQuantityChange: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onQuantityChange,
  onRemove,
}) => {
  const discount =
    item.mrp && item.mrp > item.price
      ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
      : 0;

  return (
    <div className="relative bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] rounded-xl shadow-sm border border-[color:var(--color-secondary)] dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="flex items-start space-x-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-[color:var(--color-secondary)] dark:bg-gray-700 flex items-center justify-center">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
                {item.name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>Size: Large</span>
                <span>Color: {item.color}</span>
              </div>
              
              {/* Price Display */}
              <div className="flex items-center space-x-3 mb-4">
                {item.mrp && item.mrp > item.price && (
                  <span className="text-lg line-through text-gray-400 dark:text-gray-500">
                    ₹{item.mrp.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-xl font-bold text-[color:var(--color-accent)]">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
                {discount > 0 && (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-[color:var(--color-secondary)] dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => onQuantityChange(item.id, -1)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-[color:var(--color-text-light)] dark:hover:text-[color:var(--color-text-dark)] transition-colors disabled:opacity-50"
                    disabled={item.quantity <= 1}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="px-4 py-2 font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] min-w-[3rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item.id, 1)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-[color:var(--color-text-light)] dark:hover:text-[color:var(--color-text-dark)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(item.id)}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
              title="Remove from cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
