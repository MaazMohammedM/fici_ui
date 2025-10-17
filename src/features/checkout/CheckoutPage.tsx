// src/pages/CheckoutPage.tsx
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { OtpFlow } from '@/components/otp';
import AddressCard from './components/AddressForm';
import GuestAddressForm from './components/GuestAddressForm';
import PaymentMethods from './components/PaymentMethods';
import OrderSummary from './components/OrderSummary';
import PaymentStatusModal from './modal/PaymentStatusModal';
import GuestCheckoutForm from './components/GuestCheckoutForm';
import { useCartStore } from '@store/cartStore';
import { usePaymentStore } from '@store/paymentStore';
import { useAuthStore } from '@store/authStore';
import { supabase } from '@lib/supabase';
import { Shield, ArrowLeft } from 'lucide-react';
import type { Address } from './components/AddressForm';
import type { GuestContactInfo } from '../../types/guest';
import razorpayPayments from '../../assets/razorpay-with-all-cards-upi-seeklogo.png';
import AlertModal from '@components/ui/AlertModal';

const getRazorpayKey = () => {
  if (typeof window !== 'undefined' && (window as any).__RAZORPAY_KEY__) return (window as any).__RAZORPAY_KEY;
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
  const [selectedPayment, setSelectedPayment] = useState<string>('razorpay'); // Default to Razorpay
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const currentOrderIdRef = useRef<string | null>(null);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showOtpVerificationPage, setShowOtpVerificationPage] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestContactInfo | null>(null);
  const [codOtpTriggered, setCodOtpTriggered] = useState(false);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const subtotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const savings = useMemo(() => getCartSavings(), [getCartSavings]);
  const deliveryCharge = subtotal > 999 ? 0 : 0;

  // ✅ Prepaid Discount - Easily changeable promotional discount for online payments
  const PREPAID_DISCOUNT_AMOUNT = 0; 

  const prepaidDiscount = useMemo(() => {
    return selectedPayment === 'razorpay' ? PREPAID_DISCOUNT_AMOUNT : 0;
  }, [selectedPayment]);

  // Get contact info for OTP generation
  const getContactInfo = () => {
    if (user) {
      return {
        email: user.email || (selectedAddress as any)?.email || '',
        phone: user.phone || (selectedAddress as any)?.phone || ''
      };
    } else if (guestInfo) {
      return {
        email: guestInfo.email,
        phone: guestInfo.phone
      };
    }
    return { email: '', phone: '' };
  };

  const totalAmount = subtotal + deliveryCharge - prepaidDiscount; 

  // Helper function to show alert modal
  const showAlert = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setAlertModal({
      isOpen: true,
      message,
      type
    });
  };

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
    // Reset OTP verification when payment method changes
    if (selectedPayment !== 'cod') {
      setOtpVerified(false);
      setShowOtpVerification(false);
      setOtpValue('');
    }
  }, [selectedPayment]);

  useEffect(() => {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (user && redirectPath) {
      if (redirectPath === "/checkout") {
        navigate("/checkout", { replace: true });
      }
      sessionStorage.removeItem("redirectAfterLogin");
    }
  }, [user, navigate]);

  // Reset COD OTP state when verification is completed or cancelled
  useEffect(() => {
    if (!codOtpTriggered && otpVerified) {
      // Scroll to top when returning to main checkout after successful OTP verification
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [codOtpTriggered, otpVerified]);

  const validateShipping = useCallback(() => {
    if (!selectedAddress) return false;
    const required = ['name', 'phone', 'email', 'address', 'city', 'state', 'pincode'];
    return required.every(k => !!(selectedAddress as any)[k]);
  }, [selectedAddress]);

  const handlePaymentSuccess = async (response: any, orderId: string, amountRupees: number) => {
    try {
      console.log('Payment successful, response:', response);
      
      // Log payment details - webhook will handle the database update
      console.log('Payment successful for order:', orderId, {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        amount: amountRupees,
        currency: 'INR'
      });

      // Update UI state
      setCurrentOrderId(orderId);
      setPaymentStatus('success');
      setShowPaymentStatus(true);
      
      // Don't clear cart here, let the modal handle it when it's closed
    } catch (err) {
      console.error('Error in handlePaymentSuccess:', err);
      setPaymentStatus('failed');
      setShowPaymentStatus(true);
    }
  };

  const handlePaymentFailure = async (err: any) => {
    console.error('Payment failed:', err);
    console.log('Current order ID when payment failed (state):', currentOrderId);
    console.log('Current order ID when payment failed (ref):', currentOrderIdRef.current);

    // Update UI state
    setPaymentStatus('failed');
    setShowPaymentStatus(true);

    // Use ref value for database update since state might not be updated yet
    const orderIdToUse = currentOrderIdRef.current || currentOrderId;

    // Update database if we have a current order ID
    if (orderIdToUse) {
      try {
        console.log('🔄 Updating database for failed payment, order ID:', orderIdToUse);

        // Update order status to failed
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            payment_status: 'failed',
            cancelled_at: new Date().toISOString(),
            comments: 'Payment cancelled by user'
          })
          .eq('order_id', orderIdToUse);

        if (orderError) {
          console.error('❌ Error updating order status:', orderError);
        } else {
          console.log('✅ Order status updated successfully');
        }

        // Update order items status to cancelled
        const { error: itemsError } = await supabase
          .from('order_items')
          .update({
            item_status: 'cancelled',
            cancel_reason: 'Payment cancelled by user'
          })
          .eq('order_id', orderIdToUse);

        if (itemsError) {
          console.error('❌ Error updating order items status:', itemsError);
        } else {
          console.log('✅ Order items status updated successfully');
        }

        // Update payments table if payment record exists
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderIdToUse);

        if (paymentError) {
          console.error('❌ Error updating payment status:', paymentError);
        } else {
          console.log('✅ Payment status updated successfully');
        }

        console.log('✅ Database updated for failed payment');
      } catch (dbError) {
        console.error('❌ Error updating database for failed payment:', dbError);
        // Don't show error to user as payment failure is already handled
      }
    } else {
      console.warn('⚠️ No currentOrderId available for database update - this suggests the order was not created yet');
      console.log('🔍 Debug info - isProcessing:', isProcessing);
    }
  };

  const handleGuestInfoSubmit = async (contactInfo: GuestContactInfo) => {
    try {
      const guestSession = await createGuestSession(contactInfo);
      if (guestSession) {
        setGuestInfo(contactInfo);
        setShowGuestForm(false);
        
        // Auto-fill the shipping address with guest info
        const guestAddress = {
          name: contactInfo.name,
          email: contactInfo.email,
          phone: contactInfo.phone,
          // Set default address fields that might be needed
          address: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          is_default: false,
          address_type: 'home'
        };
        
        setSelectedAddress(guestAddress);
        // Store email for potential account creation later
        sessionStorage.setItem('guestEmail', contactInfo.email);
      }
    } catch (error) {
      console.error('Guest session creation failed:', error);
      showAlert('Failed to create guest session. Please try again.');
    }
  };
  const handleSignInRedirect = () => {
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    navigate("/auth/signin");
  };

  const handleBackToGuestForm = () => {
    setGuestInfo(null);
    setShowGuestForm(true);
  };

  const handleRetryPayment = () => {
    setPaymentStatus(null);
    setShowPaymentStatus(false);
    // You might want to implement retry logic here
    handlePlaceOrder();
  };

  const closePaymentModal = () => {
    const wasSuccess = paymentStatus === 'success';
    setPaymentStatus(null);
    setCurrentOrderId(null);
    currentOrderIdRef.current = null;
    if (wasSuccess) {
      clearCart();
    }
  };

  const handlePlaceOrder = async () => {
    const authType = getAuthenticationType();

    if (authType === 'none') {
      showAlert('Please provide your contact information or sign in');
      return;
    }

    if (authType === 'guest' && !guestInfo) {
      showAlert('Please provide your contact information');
      return;
    }

    if (!validateShipping()) {
      showAlert('Please fill/choose a shipping address');
      return;
    }

    // For COD orders, check if OTP verification is needed
    if (selectedPayment === 'cod' && !otpVerified) {
      // Don't automatically trigger OTP - user must click "Verify Now" button first
      return;
    }

    setIsProcessing(true);
    try {
      // Generate a unique order ID - let the database generate UUID
      const orderId = crypto.randomUUID();

      // Calculate total MRP and total discount
      const totalMRP = cartItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
      const totalDiscount = totalMRP - subtotal;

      // Prepare common order data
      const orderData = {
        amount: totalAmount,
        order_id: orderId,
        payment_method: selectedPayment,
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
        total_mrp: totalMRP,
        total_discount: totalDiscount,
        prepaid_discount: prepaidDiscount, // Moved from metadata to main payload
        delivery_charge: deliveryCharge,
        shipping_address: selectedAddress,
        metadata: {
          payment_method: selectedPayment,
        }
      };

      // Add user-specific data
      const invokeBody = authType === 'user' 
        ? { ...orderData, user_id: user.id }
        : { 
            ...orderData, 
            guest_session_id: guestSession?.guest_session_id,
            guest_contact_info: guestInfo 
          };

      console.log('Creating order with data:', JSON.stringify(invokeBody, null, 2));
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: invokeBody,
      });
      
      if (error) {
        console.error('Error creating order:', error);
        throw new Error(error.message || 'Failed to create order');
      }
      
      // Parse the response data if it's a string
      const paymentOrder = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('Order created successfully:', paymentOrder);
      
      // Debug: Log the full response structure
      console.log('Response data type:', typeof paymentOrder);
      console.log('Response keys:', Object.keys(paymentOrder));
      
      // ✅ SET currentOrderId HERE - before any payment processing
      const actualOrderId = paymentOrder.order_id || paymentOrder.id;
      if (actualOrderId) {
        setCurrentOrderId(actualOrderId);
        currentOrderIdRef.current = actualOrderId;
        console.log('Set currentOrderId to:', actualOrderId);
      }

      // Handle COD orders - no Razorpay needed
      if (selectedPayment === 'cod') {
        console.log('Processing COD order');
        setPaymentStatus('success');
        setShowPaymentStatus(true);
        // Don't clear cart here, let the modal handle it
        return;
      }
      
      // For Razorpay payments, we need the razorpay_order_id
      const razorpayOrderId = paymentOrder.razorpay_order_id || 
                            (paymentOrder.order && paymentOrder.order.razorpay_order_id) ||
                            (paymentOrder.data && paymentOrder.data.razorpay_order_id);
      
      console.log('Extracted razorpayOrderId:', razorpayOrderId);
      
      if (!razorpayOrderId) {
        console.error('Invalid response from create-order function. Missing razorpay_order_id. Full response:', JSON.stringify(paymentOrder, null, 2));
        throw new Error('Invalid response from payment gateway. Please try again.');
      }
      
      // Ensure the paymentOrder object has the razorpay_order_id for later use
      paymentOrder.razorpay_order_id = razorpayOrderId;

      // Enhanced Razorpay implementation for online payments
      try {
        console.log('Loading Razorpay script...');
        await loadRazorpayScript();
        const key = getRazorpayKey();
        
        if (!key) {
          throw new Error('Razorpay key not found');
        }

        const customerName = authType === 'user'
          ? (selectedAddress as any)?.name || user?.user_metadata?.full_name
          : guestInfo?.name;
          
        const customerEmail = authType === 'user'
          ? (selectedAddress as any)?.email || user?.email
          : guestInfo?.email;
          
        const customerPhone = authType === 'user'
          ? (selectedAddress as any)?.phone || user?.phone
          : guestInfo?.phone;

        console.log('Initializing Razorpay with order ID:', razorpayOrderId);
        
        if (!razorpayOrderId) {
          console.error('Failed to get Razorpay order ID. Available data:', {
            hasRootId: !!paymentOrder.razorpay_order_id,
            hasOrderObject: !!paymentOrder.order,
            hasOrderId: paymentOrder.order ? !!paymentOrder.order.razorpay_order_id : false
          });
          throw new Error('Failed to get Razorpay order ID from the server');
        }

        const options = {
          key,
          amount: Math.round(totalAmount * 100), // Convert to paise for Razorpay
          currency: 'INR',
          name: 'FICI',
          description: `Order #${orderId}`,
          order_id: paymentOrder.razorpay_order_id,
          handler: (response: any) => {
            console.log('Razorpay payment successful:', response);
            handlePaymentSuccess({
              ...response,
              order_id: orderId,
              razorpay_order_id: response.razorpay_order_id || paymentOrder.id
            }, orderId, totalAmount);
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
          },
          notes: {
            order_id: orderId,
            source: 'FICI Web'
          },
          theme: { 
            color: '#3B82F6',
            hide_topbar: false
          },
          modal: {
            ondismiss: () => {
              console.log('🔄 Payment modal dismissed by user');
              console.log('🔍 currentOrderId at dismiss time (state):', currentOrderId);
              console.log('🔍 currentOrderId at dismiss time (ref):', currentOrderIdRef.current);
              console.log('🔍 State at dismiss time - isProcessing:', isProcessing);
              handlePaymentFailure({ reason: 'user_cancelled' });
            },
            escape: false,
            backdropclose: false
          },
          retry: {
            enabled: true,
            max_count: 3
          }
        };

        console.log('Razorpay options:', JSON.stringify(options, null, 2));
        
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          console.error('Razorpay payment failed:', response);
          handlePaymentFailure(response.error || { reason: 'payment_failed' });
        });
        
        rzp.open();
      } catch (error) {
        console.error('Error initializing Razorpay:', error);
        setPaymentStatus('failed');
        showAlert('Failed to initialize payment. Please try again.');
      }
    } catch (err: any) {
      console.error('Place order error', err);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show guest checkout form if not authenticated and no guest info
  if (!user && !guestInfo) {
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

  // Show loading only if we have partial guest state but still processing
  if (!user && isGuest && !guestInfo) {
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

  // Show OTP verification section when COD OTP is explicitly triggered
  if (codOtpTriggered) {
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

          <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verify Your Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                For Cash on Delivery orders, we need to verify your contact information
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs">i</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Why do we need this?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We verify your contact information to ensure smooth delivery and communication for your Cash on Delivery order.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* OTP Verification Form - Shows directly */}
              <OtpFlow
                purpose="cod_verification"
                onVerified={(codAuthToken) => {
                  setOtpVerified(true);
                  setShowOtpVerification(false);
                  setCodOtpTriggered(false);
                  // Scroll to top when OTP verification completes successfully
                  setTimeout(() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  }, 100);
                  // Continue to main checkout form
                }}
                onCancel={() => {
                  setShowOtpVerification(false);
                  setOtpValue('');
                  setOtpError('');
                  setCodOtpTriggered(false);
                  // Scroll to top when cancelling OTP verification
                  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                }}
                prefilledContact={getContactInfo().email || getContactInfo().phone}
                prefilledMethod="email"
                userType={user ? 'registered' : 'guest'}
              />

              <div className="text-center">
                <button
                  onClick={() => {
                    setCodOtpTriggered(false);
                    setSelectedPayment('razorpay');
                    // Scroll to top when going back to payment options
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  ← Back to payment options
                </button>
              </div>
            </div>
          </div>
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
                    selectedAddress={{
                      ...selectedAddress,
                      // Auto-fill with guest info if available
                      ...(guestInfo ? {
                        name: guestInfo.name,
                        email: guestInfo.email,
                        phone: guestInfo.phone
                      } : {})
                    }}
                    onAddressSubmit={(addr) => setSelectedAddress(addr)}
                    guest_session_id={useAuthStore.getState().guestSession?.guest_session_id}
                  />
                </>
              )}

              <PaymentMethods
                selected={selectedPayment}
                onSelect={(id) => setSelectedPayment(id)}
                prepaidDiscount={prepaidDiscount}
                onCodOtpRequired={() => {
                  setCodOtpTriggered(true);
                }}
                otpVerified={otpVerified}
              />

              {/* Show verification status when COD is selected and verified - REMOVED since now handled in PaymentMethods */}
            </div>

            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
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
              <OrderSummary
                items={cartItems}
                subtotal={subtotal}
                shipping={deliveryCharge}
                tax={0}
                total={totalAmount}
                savings={savings}
                prepaidDiscount={prepaidDiscount}
              />

              <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6 sticky top-4">
                <div className="flex flex-col items-center text-center space-y-4 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    <h3 className="font-semibold text-sm sm:text-base">Secure Checkout</h3>
                  </div>
                  <div className="w-full max-w-xs mx-auto">
                    <img
                      src={razorpayPayments}
                      alt="Payment methods: Cards, UPI and Razorpay"
                      className="h-10 sm:h-12 md:h-14 lg:h-16 w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center">Your payment information is encrypted and secure</p>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || (selectedPayment === 'cod' && !otpVerified)}
                  className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedPayment === 'cod' && !otpVerified
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-active'
                  }`}
                >
                  {isProcessing
                    ? 'Processing...'
                    : selectedPayment === 'cod' && !otpVerified
                    ? 'Complete OTP Verification to Place Order'
                    : `Place Order   ₹${totalAmount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPaymentStatus && paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          orderId={currentOrderId || undefined}
          message={selectedPayment === 'cod' 
            ? 'Your order is successful with Cash on Delivery' 
            : `Your order is successful with Online Payment${prepaidDiscount > 0 ? ` • You saved ₹${prepaidDiscount}!` : ''}`}
          savings={savings}
          totalAmount={totalAmount}
          totalMrp={cartItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0)}
          prepaidDiscount={selectedPayment === 'razorpay' ? prepaidDiscount : 0}
          onClose={() => {
            setShowPaymentStatus(false);
            setPaymentStatus(null);
            // Clear cart only after the modal is closed
            clearCart();
          }}
          onRetry={() => {
            setShowPaymentStatus(false);
            setPaymentStatus(null);
            handleRetryPayment();
          }}
        />)}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
      />
    </>
  );
};

export default CheckoutPage;