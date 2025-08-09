import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@store/cartStore';
import { usePaymentStore } from '@store/paymentStore';
import { useOrderStore } from '@store/orderStore';
import { useAuthStore } from '@store/authStore';
import AddressForm from './components/AddressForm';
import PaymentMethods from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import type { ShippingAddress, CheckoutFormData } from '../../types/payment';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items: cartItems, getCartTotal, clearCart } = useCartStore();
  const { createPaymentOrder, verifyPayment, loading: paymentLoading, error: paymentError } = usePaymentStore();
  const { createOrder } = useOrderStore();
  
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'review'>('address');
  const [formData, setFormData] = useState<CheckoutFormData>({
    shipping_address: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
    },
    payment_method: 'razorpay',
    save_address: false,
    billing_same_as_shipping: true,
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    if (cartItems.length === 0) {
      navigate('/cartpage');
      return;
    }
  }, [user, cartItems.length, navigate]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleAddressSubmit = (address: ShippingAddress) => {
    setFormData(prev => ({ ...prev, shipping_address: address }));
    setCurrentStep('payment');
  };

  const handlePaymentMethodSelect = (method: string) => {
    setFormData(prev => ({ ...prev, payment_method: method }));
    setCurrentStep('review');
  };

  const calculateTotals = () => {
    const subtotal = getCartTotal();
    const shipping = subtotal > 999 ? 0 : 50; // Free shipping above ₹999
    const tax = Math.round(subtotal * 0.09); // 9% tax
    const total = subtotal + shipping + tax;
    
    return { subtotal, shipping, tax, total };
  };

  const handleRazorpayPayment = async () => {
    const { total } = calculateTotals();
    
    try {
      setProcessing(true);
      
      // Create Razorpay order
      const paymentOrder = await createPaymentOrder(total);
      
      if (!paymentOrder) {
        throw new Error('Failed to create payment order');
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Use your test key
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Fici Store',
        description: 'Purchase from Fici Store',
        order_id: paymentOrder.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const isVerified = await verifyPayment(response, paymentOrder.id);
            
            if (isVerified) {
              // Create order in database
              const orderData = {
                user_id: user!.id,
                status: 'confirmed' as const,
                items: cartItems.map(item => ({
                  product_id: item.product_id,
                  article_id: item.article_id,
                  name: item.name,
                  color: item.color,
                  size: item.size,
                  image: item.image,
                  price: item.price,
                  mrp: item.mrp,
                  quantity: item.quantity,
                  discount_percentage: item.discount_percentage,
                })),
                total_amount: total,
                discount_amount: cartItems.reduce((sum, item) => sum + ((item.mrp - item.price) * item.quantity), 0),
                tax_amount: calculateTotals().tax,
                shipping_amount: calculateTotals().shipping,
                payment_method: 'Razorpay',
                payment_status: 'completed' as const,
                shipping_address: formData.shipping_address,
                estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                reviews_submitted: [],
              };

              const orderId = await createOrder(orderData);
              
              if (orderId) {
                clearCart();
                navigate('/orders', { 
                  state: { 
                    success: true, 
                    orderId,
                    message: 'Payment successful! Your order has been placed.' 
                  } 
                });
              }
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: formData.shipping_address.name,
          email: formData.shipping_address.email,
          contact: formData.shipping_address.phone,
        },
        theme: {
          color: '#F59C00', // Your accent color
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleCashOnDelivery = async () => {
    const { total } = calculateTotals();
    
    try {
      setProcessing(true);
      
      // Create order with COD
      const orderData = {
        user_id: user!.id,
        status: 'pending' as const,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          article_id: item.article_id,
          name: item.name,
          color: item.color,
          size: item.size,
          image: item.image,
          price: item.price,
          mrp: item.mrp,
          quantity: item.quantity,
          discount_percentage: item.discount_percentage,
        })),
        total_amount: total,
        discount_amount: cartItems.reduce((sum, item) => sum + ((item.mrp - item.price) * item.quantity), 0),
        tax_amount: calculateTotals().tax,
        shipping_amount: calculateTotals().shipping,
        payment_method: 'Cash on Delivery',
        payment_status: 'pending' as const,
        shipping_address: formData.shipping_address,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reviews_submitted: [],
      };

      const orderId = await createOrder(orderData);
      
      if (orderId) {
        clearCart();
        navigate('/orders', { 
          state: { 
            success: true, 
            orderId,
            message: 'Order placed successfully! You will pay on delivery.' 
          } 
        });
      }
      
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (formData.payment_method === 'razorpay') {
      handleRazorpayPayment();
    } else if (formData.payment_method === 'cod') {
      handleCashOnDelivery();
    }
  };

  const { subtotal, shipping, tax, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
            Checkout
          </h1>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            <div className={`flex items-center space-x-2 ${
              currentStep === 'address' ? 'text-[color:var(--color-accent)]' : 
              currentStep === 'payment' || currentStep === 'review' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'address' ? 'bg-[color:var(--color-accent)] text-white' :
                currentStep === 'payment' || currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="font-medium">Address</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-300"></div>
            
            <div className={`flex items-center space-x-2 ${
              currentStep === 'payment' ? 'text-[color:var(--color-accent)]' : 
              currentStep === 'review' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'payment' ? 'bg-[color:var(--color-accent)] text-white' :
                currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-300"></div>
            
            <div className={`flex items-center space-x-2 ${
              currentStep === 'review' ? 'text-[color:var(--color-accent)]' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'review' ? 'bg-[color:var(--color-accent)] text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {paymentError && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {paymentError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 'address' && (
              <AddressForm 
                onSubmit={handleAddressSubmit}
                initialData={formData.shipping_address}
              />
            )}
            
            {currentStep === 'payment' && (
              <PaymentMethods 
                selectedMethod={formData.payment_method}
                onSelect={handlePaymentMethodSelect}
                onBack={() => setCurrentStep('address')}
              />
            )}
            
            {currentStep === 'review' && (
              <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-6">
                  Review Your Order
                </h2>
                
                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3">
                    Shipping Address
                  </h3>
                  <div className="bg-gray-50 dark:bg-[color:var(--color-dark1)] p-4 rounded-lg">
                    <p className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                      {formData.shipping_address.name}
                    </p>
                    <p className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                      {formData.shipping_address.address}
                    </p>
                    <p className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                      {formData.shipping_address.city}, {formData.shipping_address.state} - {formData.shipping_address.pincode}
                    </p>
                    <p className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                      Phone: {formData.shipping_address.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep('address')}
                    className="mt-2 text-[color:var(--color-accent)] hover:underline text-sm"
                  >
                    Change Address
                  </button>
                </div>
                
                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3">
                    Payment Method
                  </h3>
                  <div className="bg-gray-50 dark:bg-[color:var(--color-dark1)] p-4 rounded-lg">
                    <p className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                      {formData.payment_method === 'razorpay' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep('payment')}
                    className="mt-2 text-[color:var(--color-accent)] hover:underline text-sm"
                  >
                    Change Payment Method
                  </button>
                </div>
                
                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3">
                    Order Items ({cartItems.length})
                  </h3>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-[color:var(--color-dark1)] rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                            {item.name}
                          </h4>
                          <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                            Color: {item.color} | Size: {item.size} | Qty: {item.quantity}
                          </p>
                          <p className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                            ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={processing || paymentLoading}
                  className="w-full bg-[color:var(--color-accent)] text-white py-4 rounded-lg font-bold text-lg hover:bg-[color:var(--color-accent)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing || paymentLoading ? 'Processing...' : `Place Order - ₹${total.toLocaleString('en-IN')}`}
                </button>
              </div>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cartItems}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
