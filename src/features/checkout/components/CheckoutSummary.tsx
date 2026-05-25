import React from 'react';
import { ShoppingCart, Truck, Shield } from 'lucide-react';
import { useCartStore } from '@store/cartStore';
import { useThemeStore } from '@store/themeStore';
import razorpayPayments from '../../../assets/razorpay-with-all-cards-upi-seeklogo.png';

interface CheckoutSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  savings: number;
  prepaidDiscount: number;
  checkoutDiscount: number;
  productDiscount: number;
  mrpTotal: number;
  darkMode: boolean;
  productDiscounts: Record<string, any>;
  codFee?: number;
  selectedPayment?: 'razorpay' | 'cod';
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  subtotal,
  shipping,
  tax,
  total,
  savings,
  prepaidDiscount,
  checkoutDiscount,
  productDiscount,
  mrpTotal,
  darkMode,
  productDiscounts,
  codFee = 0,
  selectedPayment = 'razorpay'
}) => {
  const { items: cartItems } = useCartStore();
  const { mode } = useThemeStore();

  return (
    <>
      {/* Order Summary */}
      <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            Order Summary
          </h3>
        </div>

        {/* Items List */}
        <div className="space-y-3 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark3 rounded-lg">
              <img
                src={item.thumbnail_url || item.image}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Size: {item.size} • Qty: {item.quantity}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  ₹{(item.discount_price || item.price).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total MRP</span>
            <span className="text-gray-900 dark:text-white">₹{mrpTotal.toLocaleString('en-IN')}</span>
          </div>
          
          {savings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Total Savings</span>
              <span className="text-green-600 dark:text-green-400">-₹{savings.toLocaleString('en-IN')}</span>
            </div>
          )}

          {prepaidDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Prepaid Discount</span>
              <span className="text-green-600 dark:text-green-400">-₹{prepaidDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Shipping
            </span>
            <span className="text-gray-900 dark:text-white">
              {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
            </span>
          </div>

          {selectedPayment === 'cod' && codFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">COD Fee</span>
              <span className="text-gray-900 dark:text-white">
                {codFee === 0 ? 'FREE' : `₹${codFee.toLocaleString('en-IN')}`}
              </span>
            </div>
          )}

          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax</span>
              <span className="text-gray-900 dark:text-white">₹{tax.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-gray-900 dark:text-white">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Sticky CTA card */}
      <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6 sticky top-4 space-y-4 transition-colors duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
              Secure Checkout
            </h3>
          </div>
          <div className="w-full max-w-xs mx-auto">
            <img
              src={razorpayPayments}
              alt="Payment methods: Cards, UPI and Razorpay"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-full object-contain dark:invert dark:brightness-90 dark:contrast-125"
              loading="lazy"
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
            Your payment information is encrypted and securely processed.
          </p>
        </div>
      </div>
    </>
  );
};

export default CheckoutSummary;
