import React, { useState } from "react";
import { cartItems as initialCartItems } from "../cart/data/cartItems";
import CartItemCard from "./components/CartItemCard";

type CartItem = {
type CartItem = {
  id: number;
  name: string;
  color: string;
  color: string;
  image: string;
  price: number;
  quantity: number;
  mrp?: number;
};

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
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

  // Calculate detailed summary using discounted price and MRP
  const subtotal: number = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalMrp: number = cartItems.reduce((acc, item) => acc + (item.mrp ?? item.price) * item.quantity, 0);
  const savings: number = totalMrp - subtotal;
  const delivery: number = subtotal > 0 ? 0 : 0; // Free delivery for demo
  const total: number = subtotal + delivery;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="w-full rounded-2xl shadow-xl p-8 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)]">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
          🛒 Your Cart
        </h2>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty Cart" className="w-32 h-32 mb-6 opacity-80" />
            <h3 className="text-2xl font-semibold mb-2 text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Your cart is empty!</h3>
            <p className="mb-6 text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Looks like you haven't added anything yet.</p>
            <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition font-semibold">Continue Shopping</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-8">
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
            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-8 rounded-2xl shadow-lg h-fit border-2 border-blue-200 dark:border-[color:var(--color-dark1)]">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Order Summary</h3>
              </div>
              <div className="mb-3 flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                <span>Items:</span>
                <span className="font-semibold">{cartItems.length}</span>
              </div>
              <div className="mb-6 flex flex-col gap-2">
                <div className="flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  <span>Delivery Charges</span>
                  <span className="text-green-700 dark:text-green-400 font-semibold">{delivery === 0 ? 'Free' : `₹${delivery.toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  <span>Savings</span>
                  <span className="text-green-600 dark:text-green-400">₹{savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-lg mt-2 shadow">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="w-full rounded-2xl shadow-xl p-8 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)]">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
          🛒 Your Cart
        </h2>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty Cart" className="w-32 h-32 mb-6 opacity-80" />
            <h3 className="text-2xl font-semibold mb-2 text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Your cart is empty!</h3>
            <p className="mb-6 text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Looks like you haven't added anything yet.</p>
            <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition font-semibold">Continue Shopping</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-8">
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
            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-8 rounded-2xl shadow-lg h-fit border-2 border-blue-200 dark:border-[color:var(--color-dark1)]">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Order Summary</h3>
              </div>
              <div className="mb-3 flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                <span>Items:</span>
                <span className="font-semibold">{cartItems.length}</span>
              </div>
              <div className="mb-6 flex flex-col gap-2">
                <div className="flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  <span>Delivery Charges</span>
                  <span className="text-green-700 dark:text-green-400 font-semibold">{delivery === 0 ? 'Free' : `₹${delivery.toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  <span>Savings</span>
                  <span className="text-green-600 dark:text-green-400">₹{savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-lg mt-2 shadow">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button className="bg-[color:var(--color-primary)] text-[color:var(--color-text-dark)] px-6 py-3 rounded-lg w-full font-bold text-lg shadow hover:bg-[color:var(--color-primary-active)] transition-all duration-200">
                Proceed to Checkout

              <button className="bg-[color:var(--color-primary)] text-[color:var(--color-text-dark)] px-6 py-3 rounded-lg w-full font-bold text-lg shadow hover:bg-[color:var(--color-primary-active)] transition-all duration-200">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
