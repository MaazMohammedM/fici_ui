import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePayment } from '@/lib/services/paymentService';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ensureGuestSessionId } from '@/lib/utils/guestSession';
import { logger } from '@/lib/logger';

export const useProcessPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const processPayment = async (paymentData: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    paymentReference: string;
  }) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Ensure we have a guest session ID if user is not logged in
      if (!user) {
        ensureGuestSessionId();
      }

      // Save payment details
      await savePayment({
        order_id: paymentData.orderId,
        provider: 'stripe', // or your payment provider
        payment_status: 'succeeded',
        payment_method: paymentData.paymentMethod,
        amount: paymentData.amount,
        payment_reference: paymentData.paymentReference,
      });

      // Clear cart on successful payment
      clearCart();

      // Navigate to order confirmation
      logger.info('Payment successful, navigating to order confirmation');
      navigate(`/order-confirmation/${paymentData.orderId}`, { replace: true });
      
      return { success: true };
    } catch (err) {
      logger.error('Payment processing error:', err);
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  return { processPayment, isProcessing, error };
};
