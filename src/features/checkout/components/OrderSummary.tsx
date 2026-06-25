// components/checkout/OrderSummary.tsx
import React from "react";
import type { CartItem } from "@store/cartStore";
import { Tag, Percent } from "lucide-react";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  savings?: number;
  prepaidDiscount?: number;
  checkoutDiscount?: number;
  productDiscount?: number; // Add product discount prop
  mrpTotal?: number;
  totalItems?: number;
  darkMode?: boolean;
  productDiscounts?: Record<string, any>; // Add product discount details
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  items, 
  subtotal, 
  shipping, 
  tax, 
  total, 
  savings = 0, 
  prepaidDiscount = 0,
  checkoutDiscount = 0,
  productDiscount = 0,
  mrpTotal = subtotal + savings, // Default to subtotal + savings if not provided
  totalItems = items.reduce((sum, item) => sum + item.quantity, 0), // Calculate total items if not provided
  darkMode = false,
  productDiscounts = {}
}) => {
  return (
    <div className={`bg-white dark:bg-dark2 p-6 sm:p-8 rounded-2xl shadow-lg h-fit border border-gray-200 dark:border-gray-700 transition-colors duration-200`}>
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Order Summary
        </h3>
      </div>

      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div className="flex-shrink-0">
              <img
                src={item.thumbnail_url || item.image || '/placeholder.png'}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {item.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.color && `Color: ${item.color}`}
                </span>
                {item.size && (
                  <>
                    <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Size: {item.size}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {(item.mrp && item.mrp > (item.discount_price || item.price)) && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      ₹{item.mrp.toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ₹{(item.discount_price || item.price).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Qty: {item.quantity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 text-sm sm:text-base">
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>MRP ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
          <span>₹{mrpTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>Discounted Price</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {savings > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>You Save</span>
            <span>₹{savings.toLocaleString("en-IN")}</span>
          </div>
        )}

        {prepaidDiscount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Prepaid Discount</span>
            <span>-₹{prepaidDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {checkoutDiscount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Checkout Discount</span>
            <span>-₹{checkoutDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {productDiscount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Product Discount</span>
            <span>-₹{productDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Tax</span>
            <span>₹{tax.toLocaleString("en-IN")}</span>
          </div>
        )}
        
        <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

        <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-dark3 px-4 py-3 rounded-lg shadow-sm">
          <span>Total Amount</span>
          <span className="text-green-700 dark:text-green-400">₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;