import { supabase } from '@/lib/supabase';
import { getGuestSessionId } from '@/lib/utils/guestSession';
import { logger } from '@/lib/logger';

export interface PaymentData {
  order_id: string;
  provider: string;
  payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_method: string;
  amount: number;
  currency?: string;
  payment_reference?: string;
  guest_session_id?: string;
  payment_type?: 'registered' | 'guest';
}

/**
 * Save payment details to the database
 */
export const savePayment = async (paymentData: Omit<PaymentData, 'payment_type' | 'guest_session_id'>) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const guestSessionId = getGuestSessionId() || '';
    
    const payment: PaymentData = {
      ...paymentData,
      payment_type: session?.user ? 'registered' : 'guest',
      guest_session_id: session?.user ? undefined : guestSessionId,
      currency: paymentData.currency || 'INR',
    };
    
    logger.info('Saving payment:', { orderId: paymentData.order_id, paymentType: payment.payment_type });

    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();

    if (error) {
      logger.error('Error saving payment:', error);
      throw error;
    }

    return data?.[0];
  } catch (error) {
    logger.error('Failed to save payment:', error);
    throw error;
  }
};

/**
 * Get payment details by order ID
 */
export const getPaymentByOrderId = async (orderId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const guestSessionId = getGuestSessionId();
    
    let query = supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId);

    // If user is authenticated, check for their payments
    if (session?.user) {
      query = query.eq('user_id', session.user.id);
    } 
    // If guest, check for payments with their session ID
    else if (guestSessionId) {
      query = query.eq('guest_session_id', guestSessionId);
    }
    // If no session or guest ID, return empty
    else {
      return null;
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Error fetching payment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch payment:', error);
    throw error;
  }
};
