import React, { useState } from "react";
import { cartItems as initialCartItems } from "../cart/data/cartItems";
import type { CartItem } from "../cart/data/cartItems";
import CartItemCard from "./components/CartItemCard";

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

  const handleRemove = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: number, delta: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Your Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map(item => (
            <CartItemCard
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-100 p-6 rounded-lg shadow-md h-fit">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Order Summary</h3>
          <p className="mb-2 text-gray-700">Items: {cartItems.length}</p>
          <p className="mb-4 text-gray-700 font-bold">Total: ${totalAmount.toFixed(2)}</p>

          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
