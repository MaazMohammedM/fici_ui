import React, { useState } from "react";
import cartItemsData from "../data/cartItems.json";
import styles from "./cartpage.module.css";

interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color: string;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(cartItemsData);

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
    0
  );

  return (
    <div className={styles.cartContainer}>
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Your Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {cartItems.map(item => (
            <div key={item.id} className={styles.cartCard}>
              <img
                src={item.image}
                alt={item.name}
                className={styles.cartImage}
              />
              <div className={styles.cartDetails}>
                <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-500">Price: ${item.price.toFixed(2)}</p>
                <div className="flex items-center mt-2 gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="px-2 bg-gray-200 rounded"
                  >−</button>
                  <span className="px-2">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="px-2 bg-gray-200 rounded"
                  >+</button>
                </div>
              </div>
              <div className="text-right font-semibold text-gray-700">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className={styles.removeButton}
                title="Remove Item"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div className={styles.orderSummary}>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Order Summary</h3>
          <p className="mb-2 text-gray-700">Items: {cartItems.length}</p>
          <p className="mb-4 text-gray-700 font-bold">Total: ${totalAmount.toFixed(2)}</p>
          
          <button className={styles.checkoutButton}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
