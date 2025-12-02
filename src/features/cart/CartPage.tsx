import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@store/cartStore";
import CartItemCard from "./components/CartItemCard";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import AlertModal from "@components/ui/AlertModal";

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items: cartItems, 
    removeFromCart, 
    updateQuantity, 
    updateSize,
    getCartTotal, 
    getCartSavings,
    getTotalMrp,
    clearCart
  } = useCartStore();

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

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
    setAlertModal({
      isOpen: true,
      message: 'Are you sure you want to clear your cart?',
      type: 'warning'
    });
  };

  const confirmClearCart = () => {
    clearCart();
    setAlertModal({ isOpen: false, message: '', type: 'info' });
  };

  // Calculate detailed summary
  const subtotal = getCartTotal();
  const mrpTotal = getTotalMrp();
  const savings = getCartSavings();
  const delivery = subtotal > 999 ? 0 : 99;
  const total = subtotal + delivery;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <section className="container-responsive py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="w-full py-8 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="btn-modern btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Shopping
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-center text-text-primary dark:text-text-inverse mb-2">
            Your Shopping Cart
          </h1>
          <p className="text-center text-text-secondary dark:text-text-muted">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="card-modern p-12 max-w-md w-full text-center bg-white dark:bg-gray-900">
              <ShoppingBag className="w-24 h-24 text-muted mx-auto mb-6" />
              <h3 className="heading-section mb-4 text-primary dark:text-inverse">
                Your cart is empty!
              </h3>
              <p className="mb-8 text-secondary dark:text-muted">
                Looks like you haven't added anything yet. Start shopping to fill your cart with amazing products!
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/products')}
                  className="btn-modern btn-primary w-full text-lg"
                >
                  Start Shopping
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="btn-modern btn-secondary w-full text-lg"
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
                  onOpenProduct={() => navigate(`/products/${item.article_id}`)}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-modern p-6 border-2 border-blue-200 dark:border-blue-800 sticky top-24 bg-white dark:bg-gray-900">
                <h3 className="text-2xl font-bold text-center text-text-primary dark:text-text-inverse mb-6">
                  Order Summary
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary dark:text-muted">MRP</span>
                      <span className="text-primary dark:text-inverse">
                        ₹{mrpTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between items-center text-success">
                        <span>You Save</span>
                        <span>-₹{savings.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-secondary dark:text-muted">Items ({cartItems.length})</span>
                      <span className="font-semibold text-primary dark:text-inverse">
                        ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-xl font-bold text-primary dark:text-inverse">Delivery</span>
                    <span className={`font-semibold ${delivery === 0 ? 'text-success' : 'text-primary dark:text-inverse'}`}>
                      {delivery === 0 ? 'Free' : `₹${delivery}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-xl font-bold text-primary dark:text-inverse">Total</span>
                    <span className="text-2xl font-bold text-primary dark:text-inverse">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {delivery > 0 && (
                  <div className="bg-blue-50 dark:bg-gray-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Add ₹{(1000 - subtotal).toLocaleString('en-IN')} more to your cart for <strong>FREE delivery</strong>!
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => navigate('/checkout')}
                  className="btn-modern btn-primary w-full text-lg"
                >
                  Proceed to Checkout
                </button>
                
                <p className="text-xs text-muted text-center mt-3">
                  Secure checkout powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
        showCancel={true}
        onConfirm={confirmClearCart}
      />
    </main>
  );
};

export default CartPage;