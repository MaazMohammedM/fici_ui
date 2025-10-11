// components/checkout/OrderSummary.tsx
import React from "react";
import type { CartItem } from "@store/cartStore";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  savings?: number;
  prepaidDiscount?: number;
  mrpTotal?: number;
  totalItems?: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  items, 
  subtotal, 
  shipping, 
  tax, 
  total, 
  savings = 0, 
  prepaidDiscount = 0,
  mrpTotal = subtotal + savings, // Default to subtotal + savings if not provided
  totalItems = items.reduce((sum, item) => sum + item.quantity, 0) // Calculate total items if not provided
}) => {
  return (
    <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-8 rounded-2xl shadow-lg h-fit border-2 border-blue-200 dark:border-[color:var(--color-dark1)]">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-2xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
          Order Summary
        </h3>
      </div>

        <div className="flex justify-between">
          <span>MRP Price ({totalItems})</span>
          <span>₹{mrpTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span>Discounted Price</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {prepaidDiscount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Prepaid Discount</span>
            <span>-₹{prepaidDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
        </div>

        <div className="flex justify-between">
          <span>Tax</span>
          <span>₹{tax.toLocaleString("en-IN")}</span>
        </div>
        {savings > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>You Save</span>
            <span>₹{savings.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-xl font-bold text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-lg mt-2 shadow">
          <span>Total</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>
  );
};

export default OrderSummary;
