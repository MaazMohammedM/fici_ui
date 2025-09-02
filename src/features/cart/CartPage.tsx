import React from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@store/cartStore";
import CartItemCard from "./components/CartItemCard";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items: cartItems, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal, 
    getCartSavings,
    clearCart
  } = useCartStore();

  const handleRemove = (id: string) => {
    removeFromCart(id);
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      updateQuantity(id, Math.max(1, item.quantity + delta));
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  // Calculate detailed summary
  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const delivery = subtotal > 999 ? 0 : 99; // Delivery charge for orders under ₹999
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-primary dark:text-secondary hover:text-primary-active transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Shopping
            </button>
          </div>
          <h1 className="text-4xl font-bold text-center text-primary dark:text-secondary mb-2">
            Your Shopping Cart
          </h1>
          <p className="text-center text-red-600 dark:text-gray-400">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
              <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Your cart is empty!
              </h3>
              <p className="mb-8 text-gray-600 dark:text-gray-400">
                Looks like you haven't added anything yet. Start shopping to fill your cart with amazing products!
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/products')}
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg shadow-lg hover:bg-primary-active transition-all duration-200 font-semibold text-lg"
                >
                  Start Shopping
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Cart Items
                </h2>
                <button
                  onClick={handleClearCart}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </button>
              </div>
              
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
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-800 sticky top-24">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  Order Summary
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Items ({cartItems.length})</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Delivery</span>
                    <span className={`font-semibold ${delivery === 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                      {delivery === 0 ? 'Free' : `₹${delivery}`}
                    </span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Total Savings</span>
                      <span className="font-semibold text-green-600">
                        -₹{savings.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-primary dark:text-secondary">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {delivery > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      �� Add ₹{(1000 - subtotal).toLocaleString('en-IN')} more to your cart for <strong>FREE delivery</strong>!
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary-active transition-all duration-200 transform hover:scale-105"
                >
                  Proceed to Checkout
                </button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  Secure checkout powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;