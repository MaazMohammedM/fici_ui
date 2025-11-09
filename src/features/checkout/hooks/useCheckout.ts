import { useState, useCallback } from 'react';
import { useCartStore } from '@store/cartStore';
import { useAuthStore } from '@store/authStore';
import { useGuestSession } from '@hooks/useGuestSession';
import { OrderService } from '@lib/services/orderService';
import type { Address } from '@lib/validation/checkout';

export const useCheckout = () => {
  const { items: cartItems, getCartTotal, getCartSavings, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const getAuthenticationType = useAuthStore((state) => state.getAuthenticationType);
  const { guestSession, guestContactInfo, sessionId } = useGuestSession();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const deliveryCharge = subtotal > 999 ? 0 : 0;
  const totalAmount = subtotal + deliveryCharge;

  const validateCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    if (!selectedAddress) {
      throw new Error('Please select a shipping address');
    }
    if (!selectedPayment) {
      throw new Error('Please select a payment method');
    }
    
    const authType = getAuthenticationType();
    if (authType === 'none') {
      throw new Error('Please complete guest information');
    }
    if (authType === 'guest' && !sessionId) {
      throw new Error('Guest session not found');
    }
    
    return true;
  }, [cartItems.length, selectedAddress, selectedPayment, getAuthenticationType, sessionId]);

  const createOrder = useCallback(async () => {
    try {
      validateCheckout();
      setIsProcessing(true);

      const orderId = OrderService.generateOrderId();
      const authType = getAuthenticationType();

      const orderData = {
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
        shipping_address: selectedAddress,
        amount: totalAmount,
        ...(authType === 'user' 
          ? { user_id: user!.id }
          : {
              guest_session_id: guestSession?.guest_session_id || undefined,
              guest_contact_info: guestContactInfo ? {
                email: guestContactInfo.email,
                phone: guestContactInfo.phone || '',
                name: guestContactInfo.name || ''
              } : undefined
            }
        )
      };

      const result = await OrderService.createOrder(orderData);
      setCurrentOrderId(orderId);
      return { orderId, result };
    } catch (error) {
      console.error('Order creation failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [
    validateCheckout, selectedPayment, cartItems, subtotal, savings, 
    deliveryCharge, selectedAddress, totalAmount, getAuthenticationType, 
    user, sessionId, guestContactInfo
  ]);

  const handlePaymentSuccess = useCallback(async (orderId: string) => {
    try {
      // ✅ REMOVED: savePaymentDetails call - webhook will handle payment status updates
      // The webhook will receive the payment and update the payment record with proper status

      setCurrentOrderId(orderId);
      setPaymentStatus('success');
      clearCart();
    } catch (error) {
      console.error('Payment processing failed:', error);
      setPaymentStatus('failed');
    }
  }, [clearCart]);

  const handlePaymentFailure = useCallback((error: any) => {
    console.error('Payment failed:', error);
    setPaymentStatus('failed');
  }, []);

  return {
    // State
    selectedAddress,
    selectedPayment,
    isProcessing,
    paymentStatus,
    currentOrderId,
    cartItems,
    subtotal,
    savings,
    deliveryCharge,
    totalAmount,
    sessionId,
    guestSession,
    guestContactInfo,
    user,
    
    // Actions
    setSelectedAddress,
    setSelectedPayment,
    setPaymentStatus,
    createOrder,
    handlePaymentSuccess,
    handlePaymentFailure,
    validateCheckout,
    
    // Utils
    getAuthenticationType
  };
};
