import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { PaymentDetails, PaymentResponse } from '../types/payment';

interface PaymentState {
  loading: boolean;
  error: string | null;
  currentPayment: PaymentDetails | null;
  createOrder: (orderData: any) => Promise<string | null>;
  savePaymentDetails: (paymentData: Omit<PaymentDetails, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  verifyPayment: (response: PaymentResponse, orderId: string) => Promise<boolean>;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  loading: false,
  error: null,
  currentPayment: null,

  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select('order_id')
        .single();
      if (error) throw error;

      set({ loading: false });
      return data.order_id;
    } catch (error: any) {
      console.error('Error creating order:', error);
      set({ 
        error: error.message || 'Failed to create order', 
        loading: false 
      });
      return null;
    }
  },

  savePaymentDetails: async (paymentData) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const paymentWithTimestamps = {
        ...paymentData,
        created_at: now,
        updated_at: now
      };

      const { error } = await supabase
        .from('payments')
        .insert([paymentWithTimestamps]);

      if (error) throw error;

      set({ loading: false });
      
    } catch (error: any) {
      console.error('Error saving payment details:', error);
      set({ 
        error: error.message || 'Failed to save details', 
        loading: false 
      });
    }
  },

  verifyPayment: async (response: PaymentResponse, orderId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-webhook', {
        body: {
          order_id: orderId,
          rpay_order_id: response.razorpay_order_id,
          rpay_payment_id: response.razorpay_payment_id,
          rpay_signature: response.razorpay_signature
        }
      });

      if (error) throw error;
      const isVerified = data?.verified === true;
      if (isVerified) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'confirmed',
            payment_status: 'completed'
          })
          .eq('order_id', orderId);

        if (updateError) throw updateError;
      }
      set({ loading: false });
      return isVerified;
    } catch (error: any) {
      console.error('Error in payment:', error);
      set({ 
        error: error.message || 'Payment failed', 
        loading: false 
      });
      return false;
    }
  },
  clearError: () => set({ error: null })
}));
