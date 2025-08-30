import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressCard from './components/AddressForm';
import PaymentMethodCard from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import { useCartStore } from '@store/cartStore';
import { usePaymentStore } from '@store/paymentStore';
import { useAuthStore } from '@store/authStore';
import { supabase } from '@lib/supabase';
import { Shield } from 'lucide-react';
import type { Address } from './components/AddressForm';
const getRazorpayKey = () => {
  // safe environment resolution — avoids `process is not defined` in some bundlers
  if (typeof window !== 'undefined' && (window as any).__RAZORPAY_KEY__) return (window as any).__RAZORPAY_KEY__;
  if (typeof process !== 'undefined' && process.env?.REACT_APP_RAZORPAY_KEY_ID) return process.env.REACT_APP_RAZORPAY_KEY_ID;
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RAZORPAY_KEY_ID) return (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
  return 'rzp_test_YOUR_KEY';
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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items: cartItems, getCartTotal, getCartSavings, clearCart } = useCartStore();
  const { createOrder, savePaymentDetails } = usePaymentStore();
  const { user } = useAuthStore();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const savings = useMemo(() => getCartSavings(), [getCartSavings]);
  const deliveryCharge = subtotal > 999 ? 0 : 99;
  const totalAmount = subtotal + deliveryCharge;
  const tax = 0; // compute if needed

  const validateShipping = useCallback(() => {
    if (!selectedAddress) return false;
    const required = ['name', 'phone', 'email', 'address', 'city', 'state', 'pincode'];
    return required.every(k => !!(selectedAddress as any)[k]);
  }, [selectedAddress]);

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please sign in');
      return;
    }

    if (!validateShipping()) {
      alert('Please fill/choose a shipping address');
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
          discount_percentage: i.discount_percentage
        })),
        subtotal,
        discount: savings,
        delivery_charge: deliveryCharge,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
        payment_method: selectedPayment,
        shipping_address: selectedAddress
      };

      const orderId = await createOrder(orderData);
      if (!orderId) throw new Error('Order create failed');

      // create Razorpay order via supabase edge function
      const amountInPaise = totalAmount * 1.00;
      const invokeBody = JSON.stringify({ 
        amount: totalAmount,
        user_id: user.id,  
        order_id: orderId,     
        payment_method: selectedPayment
      });

      const { data, error } = await supabase.functions.invoke('create-order', { body: invokeBody });


      if (error) throw error;
      const razorpayOrder = data;

      // Load SDK
      await loadRazorpayScript();

      // safe key resolution
      const key = getRazorpayKey();

      const options: any = {
        key,
        amount: amountInPaise,
        currency: 'INR',
        name: 'FICI',
        description: 'Order payment',
        order_id: razorpayOrder?.id || undefined,
        handler: async (response: any) => {
          try {
            await savePaymentDetails({
              order_id: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              amount: totalAmount,
              currency: 'INR',
              status: 'completed',
              payment_method: selectedPayment
            });
            clearCart();
            navigate(`/payment-success/${orderId}`);
          } catch (err) {
            console.error('savePaymentDetails error', err);
            alert('Payment success but we failed to update order. Contact support.');
          }
        },
        prefill: {
          name: selectedAddress?.name,
          email: selectedAddress?.email,
          contact: selectedAddress?.phone
        },
        theme: { color: '#3B82F6' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Place order error', err);
      alert(err?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>Your cart is empty</h2>
        </div>
      </div>
    );
  }

  return (
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
          </div>

          <div className="space-y-6">
            <OrderSummary
              items={cartItems}
              subtotal={subtotal}
              shipping={deliveryCharge}
              tax={tax}
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
                className="w-full bg-accent text-white py-3 rounded-xl font-semibold"
              >
                {isProcessing ? 'Processing...' : `Place Order • ₹${totalAmount.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;