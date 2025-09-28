// src/features/checkout/types/index.ts

export type PaymentStatus = 'idle' | 'processing' | 'succeeded' | 'failed';
export type PaymentMethodType = 'razorpay' | 'cod';

export interface GuestContactInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  product_id: string;
  article_id: string;
  name: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  mrp: number;
  discount_percentage: number;
  thumbnail_url: string;
}

export interface OrderData {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  payment_capture: number;
  status?: string;
  items: OrderItem[];
  created_at?: string;
  payment_method?: string;
  user_id?: string | null;
  guest_session_id?: string | null;
  guest_contact_info?: GuestContactInfo;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface PaymentData {
  order_id: string;
  payment_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  currency: string;
  payment_reference: string;
  user_id?: string | null;
  guest_session_id?: string | null;
  created_at?: string;
}

// Razorpay instance type
export interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: RazorpayResponse) => void) => void;
}

// Razorpay options type
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
  modal?: {
    ondismiss: () => void;
    escape: boolean;
  };
}

// Razorpay response type
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
