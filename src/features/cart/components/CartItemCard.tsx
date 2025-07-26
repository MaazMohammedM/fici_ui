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
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-md">
      <img
        src={item.image}
        alt={item.name}
        className="w-24 h-24 object-cover rounded-md"
      />
      <div className="flex-1 w-full">
        <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
        <p className="text-sm text-gray-500">Color: {item.color}</p>
        <p className="text-sm text-gray-500">Price: ${item.price.toFixed(2)}</p>

        <div className="flex items-center mt-2 gap-2">
          <button
            onClick={() => onQuantityChange(item.id, -1)}
            className="px-2 py-1 bg-gray-200 rounded text-lg"
          >
            −
          </button>
          <span className="px-2">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.id, 1)}
            className="px-2 py-1 bg-gray-200 rounded text-lg"
          >
            +
          </button>
        </div>
      </div>

      <div className="text-right text-gray-700 font-semibold">
        ${(item.price * item.quantity).toFixed(2)}
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="text-red-600 hover:text-red-800 text-xl"
        title="Remove Item"
      >
        🗑️
      </button>
    </div>
  );
};

export default CartItemCard;
