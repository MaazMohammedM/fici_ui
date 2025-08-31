export interface ShippingAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';
  name: string;
  icon: string;
  description?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'attempted' | 'paid' | 'failed';
  created_at: string;
}

export interface CheckoutFormData {
  shipping_address: ShippingAddress;
  payment_method: string;
  save_address: boolean;
  billing_same_as_shipping: boolean;
  billing_address?: ShippingAddress;
}

export interface PaymentDetails {
  payment_id?: string;
  order_id: string;
  user_id: string;
  provider?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'paid';
  payment_method: string;
  amount: number;
  currency: string;
  payment_reference?: string;
  paid_at?: string;
  updated_at?: string;
}

export interface PaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface PaymentResponse {
  razorpay_order_id: string;
  payment_reference: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
