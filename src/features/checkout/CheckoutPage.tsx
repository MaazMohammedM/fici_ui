// src/pages/CheckoutPage.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AddressCard from './components/AddressForm';
import GuestAddressForm from './components/GuestAddressForm';
import PaymentMethods from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import PaymentStatusModal from './modal/PaymentStatusModal';
import GuestCheckoutForm from './components/GuestCheckoutForm';
import { useCartStore } from '@store/cartStore';
import { useAuthStore } from '@store/authStore';
import { supabase } from '@lib/supabase';
import { Shield, ArrowLeft } from 'lucide-react';
import type { Address } from './components/AddressForm';
import type { GuestContactInfo } from '../../types/guest';

const getRazorpayKey = () => {
  if (typeof window !== 'undefined' && (window as any).__RAZORPAY_KEY__) return (window as any).__RAZORPAY_KEY__;
  if (typeof process !== 'undefined' && (process as any).env?.REACT_APP_RAZORPAY_KEY_ID) return (process as any).env.REACT_APP_RAZORPAY_KEY_ID;
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RAZORPAY_KEY_ID) return (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
  return 'rzp_test_R5h4s0BLbxYV33';
};


const CHECKOUT_DRAFT_KEY = 'checkoutDraft';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items: cartItems, getCartTotal, getCartSavings, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestContactInfo = useAuthStore((state) => state.guestContactInfo);
  const guestSession = useAuthStore((state) => state.guestSession);
  const createGuestSession = useAuthStore((state) => state.createGuestSession);
  const getAuthenticationType = useAuthStore((state) => state.getAuthenticationType);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod'); // Default to COD
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestContactInfo | null>(null);

  const subtotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const savings = useMemo(() => getCartSavings(), [getCartSavings]);
  const deliveryCharge = subtotal > 999 ? 0 : 0;

  // ✅ COD Price Surcharge - Enterprise level pricing strategy
  const COD_FEE_PERCENTAGE = 0.02; // 2% COD convenience fee
  const COD_FEE_MINIMUM = 29; // Minimum ₹29 COD fee
  const codFee = useMemo(() => {
    if (selectedPayment === 'cod' && subtotal > 0) {
      const calculatedFee = Math.round(subtotal * COD_FEE_PERCENTAGE);
      return Math.max(calculatedFee, COD_FEE_MINIMUM);
    }
    return 0;
  }, [selectedPayment, subtotal]);

  const totalAmount = subtotal + deliveryCharge + codFee; 

  useEffect(() => {
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.selectedAddress) setSelectedAddress(parsed.selectedAddress);
        if (parsed?.selectedPayment) {
          console.log('Loading saved payment method:', parsed.selectedPayment);
          setSelectedPayment(parsed.selectedPayment);
        }
      } catch (error) {
        console.error('Error parsing checkout draft:', error);
      }
    }
  }, []);

  useEffect(() => {
    const draftData = { selectedAddress, selectedPayment };
    console.log('Saving checkout draft:', draftData);
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draftData));
  }, [selectedAddress, selectedPayment]);

  useEffect(() => {
    const authType = getAuthenticationType();
    console.log('CheckoutPage useEffect - authType:', authType, 'guestSession:', guestSession, 'guestContactInfo:', guestContactInfo, 'guest_session_id:', useAuthStore.getState().guestSession?.guest_session_id);
    if (authType === 'none') {
      setShowGuestForm(true);
    } else if (authType === 'guest' && guestContactInfo) {
      setGuestInfo(guestContactInfo);
      setShowGuestForm(false);
    }
  }, [user, isGuest, guestContactInfo, guestSession, guestSession?.guest_session_id, getAuthenticationType]);

  useEffect(() => {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (user && redirectPath) {
      if (redirectPath === "/checkout") {
        navigate("/checkout", { replace: true });
      }
      sessionStorage.removeItem("redirectAfterLogin");
    }
  }, [user, navigate]);

  const validateShipping = useCallback(() => {
    if (!selectedAddress) return false;
    const required = ['name', 'phone', 'email', 'address', 'city', 'state', 'pincode'];
    return required.every(k => !!(selectedAddress as any)[k]);
  }, [selectedAddress]);

  const handlePaymentSuccess = async (orderId: string) => {
    try {
      // ✅ REMOVED: savePaymentDetails call - webhook will handle payment status updates
      // The webhook will receive the payment and update the payment record with proper status

      setCurrentOrderId(orderId);
      setPaymentStatus('success');
    } catch (err) {
      console.error('Payment success handling error', err);
      setPaymentStatus('failed');
    }
  };
  const handlePaymentFailure = (err: any) => {
    console.error('Payment failed:', err);
    setPaymentStatus('failed');
  };

  const handlePlaceOrder = async () => {
    const authType = getAuthenticationType();
    
    if (authType === 'none') {
      alert('Please provide your contact information or sign in');
      return;
    }
    
    if (authType === 'guest' && !guestInfo) {
      alert('Please provide your contact information');
      return;
    }
    
    if (!validateShipping()) {
      alert('Please fill/choose a shipping address');
      return;
    }
    
    if (!cartItems.length) {
      alert('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      // Generate a unique order ID
      const orderId = crypto.randomUUID();
      const authType = getAuthenticationType();

      console.log('Starting order placement:');
      console.log('Selected payment method:', selectedPayment);
      console.log('Total amount:', totalAmount);
      console.log('Auth type:', authType);

      // Prepare order data with proper user/guest context
      const orderData: any = {
        amount: totalAmount,
        order_id: orderId,
        payment_method: selectedPayment,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          article_id: item.article_id,
          name: item.name,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          mrp: item.mrp,
          discount_percentage: item.discount_percentage,
          thumbnail_url: item.thumbnail_url,
        })),
        subtotal,
        discount: savings,
        delivery_charge: deliveryCharge,
        cod_fee: codFee, // ✅ Include COD fee in order data
        shipping_address: selectedAddress
      };

      // Add user or guest specific fields
      if (authType === 'user') {
        orderData.user_id = user?.id;
      } else if (authType === 'guest') {
        orderData.guest_session_id = useAuthStore.getState().getCurrentSessionId();
        orderData.guest_contact_info = guestInfo;
      }

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: orderData,
      });
      if (error) throw error;

      // Handle response format from edge function
      const { razorpay_order_id, order_id: internalOrderId, key: razorpayKey } = data;

      // Handle COD orders - no Razorpay needed
      if (selectedPayment === 'cod') {
        console.log('Processing COD order, skipping Razorpay');
        console.log('Selected payment method:', selectedPayment);
        console.log('Order data sent:', orderData.payment_method);
        setCurrentOrderId(internalOrderId);
        setPaymentStatus('success');
        return;
      }

      console.log('Processing online payment with Razorpay');
      console.log('Selected payment method:', selectedPayment);

      const key = razorpayKey || getRazorpayKey();

      const rzp = new (window as any).Razorpay({
        key,
        amount: totalAmount * 100, // Convert to paise for Razorpay
        currency: 'INR',
        name: 'FICI',
        description: 'Order payment',
        order_id: razorpay_order_id, // ✅ Use Razorpay order ID from Orders API
        handler: () => handlePaymentSuccess(internalOrderId),
        prefill: {
          name: authType === 'user'
            ? (selectedAddress as any)?.name
            : guestInfo?.name,
          email: authType === 'user'
            ? (selectedAddress as any)?.email
            : guestInfo?.email,
          contact: authType === 'user'
            ? (selectedAddress as any)?.phone
            : guestInfo?.phone
        },
        theme: { color: '#3B82F6' },
        modal: {
          ondismiss: () => handlePaymentFailure({ reason: 'user_cancelled' }),
          escape: false
        }
      });

      rzp.open();
    } catch (err: any) {
      console.error('Place order error', err);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryPayment = () => {
    setPaymentStatus(null);
    setCurrentOrderId(null);
    handlePlaceOrder();
  };

  const closePaymentModal = () => {
    const wasSuccess = paymentStatus === 'success';
    setPaymentStatus(null);
    setCurrentOrderId(null);
    if (wasSuccess) {
      clearCart();
    }
  };

  const handleGuestInfoSubmit = async (contactInfo: GuestContactInfo) => {
    try {
      const guestSession = await createGuestSession(contactInfo);
      if (guestSession) {
        setGuestInfo(contactInfo);
        setShowGuestForm(false);
        // Store email for potential account creation later
        sessionStorage.setItem('guestEmail', contactInfo.email);
      } else {
        alert('Failed to create guest session. Please try again.');
      }
    } catch (error) {
      console.error('Guest session creation failed:', error);
      alert('Failed to create guest session. Please try again.');
    }
  };

  const handleSignInRedirect = () => {
    sessionStorage.setItem('redirectAfterLogin', '/checkout');
    navigate('/auth/signin');
  };

  const handleBackToGuestForm = () => {
    setShowGuestForm(true);
    setGuestInfo(null);
  };
  // Show guest checkout form if not authenticated
  if (showGuestForm) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-4 sm:mb-6">
            <Link to="/cart">
              <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Cart
              </button>
            </Link>
          </div>

          <GuestCheckoutForm
            onGuestInfoSubmit={handleGuestInfoSubmit}
            onSignInClick={handleSignInRedirect}
            loading={isProcessing}
          />
        </div>
      </div>
    );
  }

  // Only show loading if we're not in guest mode and don't have a user
  if (!user && !isGuest && !guestInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>Your cart is empty</h2>
          <button 
            onClick={() => navigate('/products')}
            className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-active transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Checkout</h1>
            {isGuest && guestInfo && (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Guest:</span> {guestInfo.email}
                </div>
                <button
                  onClick={handleBackToGuestForm}
                  className="text-xs sm:text-sm text-primary hover:text-primary-active transition-colors"
                >
                  Change Info
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-4 sm:space-y-8">
              {user ? (
                <AddressCard
                  selectedId={selectedAddress?.id}
                  onSelect={(addr) => setSelectedAddress(addr)}
                />
              ) : (
                <>
                  <GuestAddressForm
                    selectedAddress={selectedAddress}
                    onAddressSubmit={(addr) => setSelectedAddress(addr)}
                    guest_session_id={useAuthStore.getState().guestSession?.guest_session_id}
                  />
                </>
              )}

              <PaymentMethods
                selected={selectedPayment}
                onSelect={(id) => setSelectedPayment(id)}
              />

              <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Your Items</h3>
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 sm:gap-4 border-b pb-2 sm:pb-3">
                      <img
                        src={item.thumbnail_url}
                        alt={item.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {item.size ? `Size: ${item.size} • ` : ''}Qty: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="font-semibold text-sm sm:text-base flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <OrderSummary
                items={cartItems}
                subtotal={subtotal}
                shipping={deliveryCharge}
                tax={0}
                total={totalAmount}
                savings={savings}
                codFee={codFee} // ✅ Pass COD fee to OrderSummary
              />

              <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6 sticky top-4">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  <h3 className="font-semibold text-sm sm:text-base">Secure Checkout</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Your payment information is encrypted and secure</p>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full bg-primary text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:bg-primary-active transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Place Order • ₹${totalAmount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          orderId={currentOrderId || undefined}
          message={selectedPayment === 'cod' ? 'Your order is successful with Cash on Delivery' : undefined}
          savings={savings}
          onClose={closePaymentModal}
          onRetry={paymentStatus === 'failed' ? handleRetryPayment : undefined}
        />

      )}
    </>
  );
};

export default CheckoutPage;