import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

// Components
import AddressCard from './components/AddressForm';
import GuestAddressForm from './components/GuestAddressForm';
import PaymentMethodCard from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import PaymentStatusModal from './modal/PaymentStatusModal';
import GuestCheckoutForm from './components/GuestCheckoutForm';

// Hooks and Services
import { useCheckout } from './hooks/useCheckout';
import { useAuthStore } from '@store/authStore';
import { useRazorpay } from './hooks/useRazorpay';

// Types
import type { GuestContactInfo } from '../../types/guest';

const CHECKOUT_DRAFT_KEY = 'checkoutDraft';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Custom hooks for business logic
  const {
    selectedAddress,
    selectedPayment,
    isProcessing,
    paymentStatus,
    currentOrderId,
    cartItems,
    subtotal,
    deliveryCharge,
    totalAmount,
    sessionId,
    guestSession,
    guestContactInfo,
    user,
    setSelectedAddress,
    setSelectedPayment,
    setPaymentStatus,
    createOrder,
    handlePaymentSuccess,
    handlePaymentFailure,
    getAuthenticationType
  } = useCheckout();

  const { createGuestSession } = useAuthStore();
  const { initializeRazorpay, processPayment } = useRazorpay();

  // Local state
  const [showGuestForm, setShowGuestForm] = useState(false);

  // Effects
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Load saved draft
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.selectedAddress) setSelectedAddress(parsed.selectedAddress);
        if (parsed?.selectedPayment) setSelectedPayment(parsed.selectedPayment);
      } catch {}
    }
  }, [cartItems.length, navigate, setSelectedAddress, setSelectedPayment]);

  useEffect(() => {
    // Save draft
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ 
      selectedAddress, 
      selectedPayment 
    }));
  }, [selectedAddress, selectedPayment]);

  useEffect(() => {
    const authType = getAuthenticationType();
    if (authType === 'none') {
      setShowGuestForm(true);
    } else if (authType === 'guest' && guestContactInfo) {
      setShowGuestForm(false);
    }
  }, [user, guestContactInfo, guestSession, getAuthenticationType]);

  useEffect(() => {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (user && redirectPath) {
      if (redirectPath === "/checkout") {
        navigate("/checkout", { replace: true });
      }
      sessionStorage.removeItem("redirectAfterLogin");
    }
  }, [user, navigate]);

  // Handlers
  const handleGuestInfoSubmit = async (contactInfo: GuestContactInfo) => {
    try {
      // Validate required fields
      if (!contactInfo.name || !contactInfo.email || !contactInfo.phone) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Create guest session using authStore
      await createGuestSession(contactInfo);
      
      // Close the guest form
      setShowGuestForm(false);
      
      // Store guest email in session storage for future reference
      sessionStorage.setItem('guestEmail', contactInfo.email);
    } catch (error) {
      console.error('Guest session creation failed:', error);
      alert('Failed to create guest session. Please try again.');
    }
  };

  const handleSignInRedirect = () => {
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    navigate("/auth/signin");
  };

  const validateShipping = () => {
    if (!selectedAddress) return false;
    const required = ['name', 'phone', 'email', 'address', 'city', 'state', 'pincode'];
    return required.every(k => !!(selectedAddress as any)[k]);
  };

  const handlePlaceOrder = async () => {
    try {
      if (!validateShipping()) {
        alert('Please complete shipping information');
        return;
      }

      const { orderId } = await createOrder();

      if (selectedPayment === 'cod') {
        setPaymentStatus('success');
        return;
      }

      // Razorpay payment
      await initializeRazorpay();
      await processPayment({
        orderId,
        amount: totalAmount,
        onSuccess: (response) => handlePaymentSuccess(response, orderId),
        onFailure: handlePaymentFailure
      });

    } catch (error) {
      console.error('Order placement failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order');
    }
  };

  const handleRetryPayment = async () => {
    if (!currentOrderId) return;
    
    try {
      await initializeRazorpay();
      await processPayment({
        orderId: currentOrderId,
        amount: totalAmount,
        onSuccess: (response) => handlePaymentSuccess(response, currentOrderId),
        onFailure: handlePaymentFailure
      });
    } catch (error) {
      console.error('Payment retry failed:', error);
    }
  };

  const closePaymentModal = () => {
    setPaymentStatus(null);
    if (paymentStatus === 'success') {
      navigate('/orders');
    }
  };

  // Render
  if (cartItems.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/cart')}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Checkout
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
          </div>

          {/* Guest Form Modal */}
          {showGuestForm && (
            <GuestCheckoutForm
              onGuestInfoSubmit={handleGuestInfoSubmit}
              onSignInClick={handleSignInRedirect}
            />
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Address Section */}
              {user ? (
                <AddressCard
                  selectedId={selectedAddress?.id}
                  onSelect={(addr) => {
                    if (addr && addr.name && addr.phone && addr.email && addr.address && addr.city && addr.state && addr.pincode) {
                      setSelectedAddress({
                        name: addr.name,
                        phone: addr.phone,
                        email: addr.email,
                        address: addr.address,
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode,
                        id: addr.id,
                        landmark: addr.landmark
                      });
                    }
                  }}
                />
              ) : (
<GuestAddressForm
                  selectedAddress={selectedAddress}
                  onAddressSubmit={(addr) => {
                    if (addr && addr.name && addr.phone && addr.email && addr.address && addr.city && addr.state && addr.pincode) {
                      setSelectedAddress({
                        name: addr.name,
                        phone: addr.phone,
                        email: addr.email,
                        address: addr.address,
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode,
                        id: addr.id,
                        landmark: addr.landmark || ''
                      });
                    }
                  }}
                  guest_session_id={sessionId || undefined}
                />
              )}

              {/* Payment Method */}
              <PaymentMethodCard
                selected={selectedPayment}
                onSelect={(id) => setSelectedPayment(id)}
              />

              {/* Items Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Your Items</h3>
                <div className="space-y-4">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={`${item.product_id}-${item.size}`} className="flex items-center space-x-4">
                      <img
                        src={item.thumbnail_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.color} • Size {item.size} • Qty {item.quantity}
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      +{cartItems.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-8">
              <OrderSummary
                items={cartItems}
                subtotal={subtotal}
                shipping={deliveryCharge}
                tax={0}
                total={totalAmount}
              />
              
              {/* Place Order Button */}
              <div className="mt-6">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !selectedAddress || !selectedPayment || showGuestForm}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Place Order - ₹{totalAmount.toLocaleString('en-IN')}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Modal */}
      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          orderId={currentOrderId || undefined}
          message={selectedPayment === 'cod' ? 'Your order is successful with Cash on Delivery' : undefined}
          onClose={closePaymentModal}
          onRetry={paymentStatus === 'failed' ? handleRetryPayment : undefined}
        />
      )}
    </>
  );
};

export default CheckoutPage;
