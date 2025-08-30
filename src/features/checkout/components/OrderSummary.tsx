// components/checkout/OrderSummary.tsx
import React from "react";
import type { CartItem } from "@store/cartStore";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, subtotal, shipping, tax, total }) => {
  return (
    <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-8 rounded-2xl shadow-lg h-fit border-2 border-blue-200 dark:border-[color:var(--color-dark1)]">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-2xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
          Order Summary
        </h3>
      </div>

      <div className="mb-3 flex justify-between text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
        <span>Items:</span>
        <span className="font-semibold">{items.length}</span>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>₹{tax.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-xl font-bold text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-lg mt-2 shadow">
          <span>Total</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
