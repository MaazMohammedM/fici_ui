import { useCallback } from 'react';

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

interface PaymentOptions {
  orderId: string;
  amount: number;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

export const useRazorpay = () => {
  const initializeRazorpay = useCallback(async () => {
    await loadRazorpayScript();
  }, []);

  const processPayment = useCallback(async ({ orderId, amount, onSuccess, onFailure }: PaymentOptions) => {
    try {
      const options = {
        key: getRazorpayKey(),
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'FICI Shoes',
        description: `Order #${orderId}`,
        order_id: orderId,
        handler: onSuccess,
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => onFailure(new Error('Payment cancelled by user'))
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      onFailure(error);
    }
  }, []);

  return {
    initializeRazorpay,
    processPayment
  };
};
