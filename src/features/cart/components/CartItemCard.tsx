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
    <div className="relative flex flex-col md:flex-row gap-4 bg-[color:var(--color-light1)] dark:bg-[#23272f] p-4 rounded-xl shadow-md border border-[color:var(--color-secondary)] dark:border-[#32363e]">
      {/* Delete Icon Button at top right */}
      <div className="flex flex-col items-end min-w-[120px] h-full absolute right-3 top-3">
        <button
          onClick={() => onRemove(item.id)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-[#3a2323] border border-red-200 dark:border-red-500 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-[#5a2a2a] shadow transition"
          title="Remove from cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" />
          </svg>
        </button>
        <div className="mt-14 text-right font-semibold text-base px-3 py-1 rounded shadow-sm text-[color:var(--color-accent)] bg-[color:var(--color-secondary)] dark:bg-[#2d313a]/80">
          Subtotal: ₹{(item.price * item.quantity).toLocaleString("en-IN")}
        </div>
      </div>
      {/* Product Image */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center rounded-xl border border-[color:var(--color-secondary)] dark:border-[#32363e] bg-white/60 dark:bg-[#23272f]/60 shadow-lg backdrop-blur-sm p-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
      </div>
      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--color-text-light)] dark:text-gray-100">
            {item.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Color: {item.color}
          </p>
          <div className="flex items-center gap-2 mb-1">
            {item.mrp && item.mrp > item.price && (
              <span className="text-base line-through text-gray-400 dark:text-gray-500">
                ₹{item.mrp.toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-lg font-bold text-[color:var(--color-accent)]">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
            {discount > 0 && (
              <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                {discount}% Off
              </span>
            )}
          </div>
        </div>
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onQuantityChange(item.id, -1)}
            className="px-2 py-1 bg-gray-200 dark:bg-[#32363e] rounded text-lg font-bold hover:bg-gray-300 dark:hover:bg-[#444857] transition"
            disabled={item.quantity <= 1}
          >
            −
          </button>
          <span className="px-3 font-semibold text-[color:var(--color-text-light)] dark:text-gray-100">
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.id, 1)}
            className="px-2 py-1 bg-gray-200 dark:bg-[#32363e] rounded text-lg font-bold hover:bg-gray-300 dark:hover:bg-[#444857] transition"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
