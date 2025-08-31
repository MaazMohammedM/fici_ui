// src/pages/CheckoutPage.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddressCard from './components/AddressForm';
import PaymentMethodCard from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import PaymentStatusModal from './modal/PaymentStatusModal';
import { useCartStore } from '@store/cartStore';
import { usePaymentStore } from '@store/paymentStore';
import { useAuthStore } from '@store/authStore';
import { supabase } from '@lib/supabase';
import { Shield } from 'lucide-react';
import type { Address } from './components/AddressForm';

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
  const { createOrder, savePaymentDetails } = usePaymentStore();
  const { user } = useAuthStore();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

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
      } catch {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ selectedAddress, selectedPayment }));
  }, [selectedAddress, selectedPayment]);

  useEffect(() => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/auth/signin");
    }
  }, [user, navigate, location.pathname]);

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
      await savePaymentDetails({
        order_id: orderId,            // internal order id
        user_id: user!.id,
        provider: "razorpay",
        payment_status: "pending",
        payment_method: selectedPayment,
        amount: amountRupees,
        currency: "INR",
        payment_reference: response.razorpay_payment_id, // will be null before webhook
      });
      

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

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please sign in');
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
      const orderData = {
        user_id: user.id,
        items: cartItems.map(i => ({
          product_id: i.product_id,
          article_id: i.article_id,
          name: i.name,
          color: i.color,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
          mrp: i.mrp,
          discount_percentage: i.discount_percentage,
          thumbnail_url: i.thumbnail_url,
        })),
        subtotal,
        discount: savings,
        delivery_charge: deliveryCharge,
        total_amount: totalAmount, 
        status: 'pending' as const,
        payment_status: 'pending' as const,
        payment_method: selectedPayment,
        shipping_address: selectedAddress,
      };

      const orderId = await createOrder(orderData);
      if (!orderId) throw new Error('Order creation failed');

      const invokeBody = { 
        amount: totalAmount,   
        user_id: user.id,  
        order_id: orderId,     
        payment_method: selectedPayment
      };

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: invokeBody,
      });
      if (error) throw error;
      const razorpayOrder = data;

      await loadRazorpayScript();
      const key = getRazorpayKey();

      const rzp = new (window as any).Razorpay({
        key,
        amount: totalAmount * 100, // Convert to paise for Razorpay
        currency: 'INR',
        name: 'FICI',
        description: 'Order payment',
        order_id: razorpayOrder.id,
        handler: (response: any) => handlePaymentSuccess(response, orderId, totalAmount),
        prefill: {
          name: (selectedAddress as any)?.name,
          email: (selectedAddress as any)?.email,
          contact: (selectedAddress as any)?.phone
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

// ... existing code ...
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Redirecting to sign in...</p>
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
          <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <AddressCard
                selectedId={selectedAddress?.id}
                onSelect={(addr) => setSelectedAddress(addr)}
              />

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
          onClose={closePaymentModal}
          onRetry={paymentStatus === 'failed' ? handleRetryPayment : undefined}
        />
      )}
    </>
  );
};

export default CheckoutPage;