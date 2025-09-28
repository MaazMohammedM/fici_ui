// src/features/checkout/CheckoutPage.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

// Components
import AddressCard from './components/AddressForm';
import GuestAddressForm from './components/GuestAddressForm';
import PaymentMethodCard from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import PaymentStatusModal from './modal/PaymentStatusModal';
import GuestCheckoutForm from './components/GuestCheckoutForm';

// Store
import { useCartStore } from '@store/cartStore';
import { usePaymentStore } from '@store/paymentStore';
import { useAuthStore } from '@store/authStore';

// Utils
import { supabase } from '@lib/supabase';

// Types
import type { Address } from './components/AddressForm';
import type { GuestContactInfo } from '../../types/guest';

const getRazorpayKey = () => {
  if (typeof window !== 'undefined' && (window as any).__RAZORPAY_KEY__) return (window as any).__RAZORPAY_KEY__;
  if (typeof process !== 'undefined' && (process as any).env?.REACT_APP_RAZORPAY_KEY_ID) return (process as any).env.REACT_APP_RAZORPAY_KEY_ID;
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RAZORPAY_KEY_ID) return (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
  return 'rzp_test_R5h4s0BLbxYV33';
};

const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.head.appendChild(script);
  });
};

const CHECKOUT_DRAFT_KEY = 'checkoutDraft';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, getCartTotal, getCartSavings, clearCart } = useCartStore();
  const { savePaymentDetails } = usePaymentStore();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestContactInfo = useAuthStore((state) => state.guestContactInfo);
  const guestSession = useAuthStore((state) => state.guestSession);
  const createGuestSession = useAuthStore((state) => state.createGuestSession);
  const getAuthenticationType = useAuthStore((state) => state.getAuthenticationType);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestContactInfo | null>(null);

  const subtotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const savings = useMemo(() => getCartSavings(), [getCartSavings]);
  const deliveryCharge = subtotal > 999 ? 0 : 0;
  const totalAmount = subtotal + deliveryCharge;

  useEffect(() => {
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.selectedAddress) setSelectedAddress(parsed.selectedAddress);
        if (parsed?.selectedPayment) setSelectedPayment(parsed.selectedPayment);
      } catch (e) {
        console.error('Failed to parse saved checkout data', e);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ selectedAddress, selectedPayment }));
  }, [selectedAddress, selectedPayment]);

  useEffect(() => {
    const authType = getAuthenticationType();
    if (authType === 'none') {
      setShowGuestForm(true);
    } else if (authType === 'guest' && guestContactInfo) {
      setGuestInfo(guestContactInfo);
      setShowGuestForm(false);
    }
  }, [user, isGuest, guestContactInfo, guestSession, getAuthenticationType]);

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

  const handlePaymentSuccess = async (response: any, orderId: string, amountRupees: number) => {
    try {
      const authType = getAuthenticationType();
      const paymentData = {
        order_id: orderId,
        user_id: authType === 'user' ? user!.id : null,
        guest_session_id: authType === 'guest' ? useAuthStore.getState().getCurrentSessionId() : null,
        provider: "razorpay",
        payment_status: "pending" as const,
        payment_method: selectedPayment,
        amount: amountRupees,
        currency: "INR",
        payment_reference: response.razorpay_payment_id,
      };
      
      await savePaymentDetails(paymentData);
      setCurrentOrderId(orderId);
      setPaymentStatus('success');
    } catch (err) {
      console.error('savePaymentDetails error', err);
      setPaymentStatus('failed');
    }
  };

  const handlePaymentFailure = (err: any) => {
    console.error('Payment failed:', err);
    setPaymentStatus('failed');
  };

  const handleGuestInfoSubmit = async (contactInfo: GuestContactInfo) => {
    try {
      const guestSession = await createGuestSession(contactInfo);
      if (guestSession) {
        setGuestInfo(contactInfo);
        setShowGuestForm(false);
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
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    navigate("/auth/signin");
  };

  const handleBackToGuestForm = () => {
    setShowGuestForm(true);
    setGuestInfo(null);
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
      const orderId = crypto.randomUUID();
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
        shipping_address: selectedAddress
      };

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
      const paymentOrder = data;

      if (selectedPayment === 'cod') {
        setCurrentOrderId(orderId);
        setPaymentStatus('success');
        return;
      }

      await loadRazorpayScript();
      const key = getRazorpayKey();

      const rzp = new (window as any).Razorpay({
        key,
        amount: totalAmount * 100,
        currency: 'INR',
        name: 'FICI',
        description: 'Order payment',
        order_id: paymentOrder.id,
        handler: (response: any) => handlePaymentSuccess(response, orderId, totalAmount),
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

  if (showGuestForm) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </button>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            {isGuest && guestInfo && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Guest:</span> {guestInfo.email}
                </div>
                <button
                  onClick={handleBackToGuestForm}
                  className="text-sm text-primary hover:text-primary-active transition-colors"
                >
                  Change Info
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {user ? (
                <AddressCard
                  selectedId={selectedAddress?.id}
                  onSelect={(addr) => setSelectedAddress(addr)}
                />
              ) : (
                <GuestAddressForm
                  selectedAddress={selectedAddress}
                  onAddressSubmit={(addr) => setSelectedAddress(addr)}
                  guest_session_id={useAuthStore.getState().guestSession?.guest_session_id}
                />
              )}

              <PaymentMethodCard
                selected={selectedPayment}
                onSelect={(id) => setSelectedPayment(id)}
              />

              <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Your Items</h3>
                <div className="space-y-4">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 border-b pb-3">
                      <img
                        src={item.thumbnail_url}
                        alt={item.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.size ? `Size: ${item.size} • ` : ''}Qty: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <OrderSummary
                items={cartItems}
                subtotal={subtotal}
                shipping={deliveryCharge}
                tax={0}
                total={totalAmount}
              />

              <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold">Secure Checkout</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Your payment information is encrypted and secure</p>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full bg-accent text-white py-3 rounded-xl font-semibold disabled:opacity-50"
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
          onClose={closePaymentModal}
          onRetry={paymentStatus === 'failed' ? handleRetryPayment : undefined}
        />
      )}
    </>
  );
};

export default CheckoutPage;
