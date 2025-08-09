import React from 'react';
import type { CartItem } from '@store/cartStore';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  shipping,
  tax,
  total,
}) => {
  const savings = items.reduce((sum, item) => sum + ((item.mrp - item.price) * item.quantity), 0);

  return (
    <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-lg p-6 sticky top-8">
      <h3 className="text-lg font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-4">
        Order Summary
      </h3>
      
      {/* Items */}
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] truncate">
                {item.name}
              </h4>
              <p className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                {item.color} | {item.size} | Qty: {item.quantity}
              </p>
            </div>
            <div className="text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </div>
          </div>
        ))}
      </div>
      
      {/* Totals */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
            Subtotal ({items.length} items)
          </span>
          <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
        
        {savings > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
              Discount
            </span>
            <span className="text-green-600 font-medium">
              -₹{savings.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
            Shipping
          </span>
          <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
            {shipping === 0 ? (
              <span className="text-green-600 font-medium">FREE</span>
            ) : (
              `₹${shipping}`
            )}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
            Tax (GST)
          </span>
          <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
            ₹{tax.toLocaleString('en-IN')}
          </span>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
              Total
            </span>
            <span className="text-xl font-bold text-[color:var(--color-accent)]">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          {savings > 0 && (
            <p className="text-xs text-green-600 mt-1">
              You saved ₹{savings.toLocaleString('en-IN')} on this order!
            </p>
          )}
        </div>
      </div>
      
      {/* Free Shipping Info */}
      {shipping > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">🚚</span>
            <span className="text-sm text-blue-800 dark:text-blue-300">
              Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for FREE shipping
            </span>
          </div>
        </div>
      )}
      
      {/* Security Badge */}
      <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-60">
        <span>🔒</span>
        <span>SSL Secured Payment</span>
      </div>
    </div>
  );
};

export default OrderSummary;
