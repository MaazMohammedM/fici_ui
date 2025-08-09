import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { ShippingAddress, PaymentOrder, RazorpayResponse } from '../types/payment';

interface PaymentState {
  loading: boolean;
  error: string | null;
  currentOrder: PaymentOrder | null;
  savedAddresses: ShippingAddress[];
  
  // Actions
  createPaymentOrder: (amount: number, currency?: string) => Promise<PaymentOrder | null>;
  verifyPayment: (paymentData: RazorpayResponse, orderId: string) => Promise<boolean>;
  saveAddress: (address: ShippingAddress) => Promise<void>;
  fetchSavedAddresses: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  loading: false,
  error: null,
  currentOrder: null,
  savedAddresses: [],

  createPaymentOrder: async (amount: number, currency = 'INR') => {
    set({ loading: true, error: null });
    
    try {
      // In a real implementation, this would call your backend API
      // which then calls Razorpay to create an order
      const response = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paisa
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const order = await response.json();
      
      set({ currentOrder: order, loading: false });
      return order;
      
    } catch (error) {
      console.error('Error creating payment order:', error);
      
      // For demo purposes, create a mock order
      const mockOrder: PaymentOrder = {
        id: `order_${Date.now()}`,
        amount: amount * 100,
        currency,
        status: 'created',
        created_at: new Date().toISOString(),
      };
      
      set({ currentOrder: mockOrder, loading: false });
      return mockOrder;
    }
  },

  verifyPayment: async (paymentData: RazorpayResponse, orderId: string) => {
    set({ loading: true, error: null });
    
    try {
      // In a real implementation, this would call your backend to verify the payment
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          order_id: orderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      set({ loading: false });
      
      return result.verified;
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      set({ error: 'Payment verification failed', loading: false });
      
      // For demo purposes, return true
      return true;
    }
  },

  saveAddress: async (address: ShippingAddress) => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          ...address,
          is_default: get().savedAddresses.length === 0, // First address becomes default
        });

      if (error) {
        throw error;
      }

      // Refresh saved addresses
      await get().fetchSavedAddresses(user.id);
      
      set({ loading: false });
      
    } catch (error) {
      console.error('Error saving address:', error);
      set({ error: 'Failed to save address', loading: false });
    }
  },

  fetchSavedAddresses: async (userId: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      set({ savedAddresses: data || [], loading: false });
      
    } catch (error) {
      console.error('Error fetching addresses:', error);
      
      // For demo purposes, set mock addresses
      const mockAddresses: ShippingAddress[] = [
        {
          name: 'John Doe',
          phone: '+91 9876543210',
          email: 'john@example.com',
          address: '123 Main Street, Apartment 4B',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          landmark: 'Near XYZ Mall',
        },
      ];
      
      set({ savedAddresses: mockAddresses, loading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
