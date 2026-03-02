import { db, collection, addDoc, getDocs, query, where, doc, getDoc, serverTimestamp } from '../firebase';
import { getAuth } from '../firebase';
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
  user_id?: string;
}

/**
 * Save payment details to the database
 */
export const savePayment = async (paymentData: Omit<PaymentData, 'payment_type' | 'guest_session_id'>) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const guestSessionId = getGuestSessionId() || '';
    
    const payment: PaymentData & { created_at?: any } = {
      ...paymentData,
      payment_type: user ? 'registered' : 'guest',
      guest_session_id: user ? undefined : guestSessionId,
      currency: paymentData.currency || 'INR',
      user_id: user?.uid,
      created_at: serverTimestamp()
    };
    
    logger.info('Saving payment:', { orderId: paymentData.order_id, paymentType: payment.payment_type });

    const docRef = await addDoc(collection(db, 'payments'), payment);
    const savedPayment = await getDoc(docRef);

    if (!savedPayment.exists()) {
      throw new Error('Failed to save payment');
    }

    return { id: savedPayment.id, ...savedPayment.data() };
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
    const auth = getAuth();
    const user = auth.currentUser;
    const guestSessionId = getGuestSessionId();
    
    let q = query(collection(db, 'payments'), where('order_id', '==', orderId));

    // If user is authenticated, check for their payments
    if (user) {
      q = query(q, where('user_id', '==', user.uid));
    } 
    // If guest, check for payments with their session ID
    else if (guestSessionId) {
      q = query(q, where('guest_session_id', '==', guestSessionId));
    }
    // If no session or guest ID, return empty
    else {
      return null;
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const paymentDoc = querySnapshot.docs[0];
    return { id: paymentDoc.id, ...paymentDoc.data() };
  } catch (error) {
    logger.error('Failed to fetch payment:', error);
    throw error;
  }
};
