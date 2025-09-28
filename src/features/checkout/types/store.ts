import type { OrderData, PaymentData, GuestContactInfo } from './index';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  thumbnailUrl?: string;
  product_id: string;
  article_id: string;
  color?: string;
  size?: string;
  mrp?: number;
  discount_percentage?: number;
}

export interface CartStore {
  items: CartItem[];
  total: number;
  getCartTotal: () => number;
  getCartSavings: () => number;
  clearCart: () => void;
}

export interface PaymentStore {
  createOrder: (orderData: Omit<OrderData, 'id' | 'created_at'>) => Promise<{ id: string }>;
  savePaymentDetails: (paymentData: Omit<PaymentData, 'id' | 'created_at'>) => Promise<void>;
}

export interface GuestSession {
  guest_session_id: string;
  email: string;
  phone?: string;
  name?: string;
}

export interface AuthStore {
  user: { id: string; email: string; name: string } | null;
  isGuest: boolean;
  guestContactInfo: GuestContactInfo | null;
  guestSession: GuestSession | null;
  getCurrentSessionId: () => string | null;
  getAuthenticationType: () => 'user' | 'guest' | 'none';
  createGuestSession: (contactInfo: GuestContactInfo) => Promise<GuestSession | null>;
}
