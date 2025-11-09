// Guest session and order types for flexible authentication
export interface GuestSession {
  guest_session_id: string;
  email: string;
  phone?: string;
  name?: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface GuestContactInfo {
  email: string;
  phone?: string;
  name?: string;
}

export interface GuestOrderSummary {
  has_guest_orders: boolean;
  guest_orders_count: number;
  merge_available: boolean;
  total_amount?: number;
}

export interface GuestOrderMergeResult {
  success: boolean;
  merged_orders_count: number;
  total_merged_amount: number;
  error?: string;
}

export interface AuthenticationState {
  isAuthenticated: boolean;
  isGuest: boolean;
  user?: any;
  guestSession?: GuestSession;
  guestContactInfo?: GuestContactInfo;
}

// Extended order types to support guest orders
export interface GuestOrderCreateInput {
  guest_session_id: string;
  guest_contact_info: GuestContactInfo;
  items: any[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'completed';
  payment_method: string;
  shipping_address: any;
}

// API response types
export interface SignInResponse {
  user: any;
  has_guest_orders: boolean;
  guest_orders_count: number;
  merge_available: boolean;
}

export interface RegistrationResponse {
  user: any;
  guest_order_summary?: GuestOrderSummary;
  merge_result?: GuestOrderMergeResult;
}

// Error types for guest functionality
export type GuestErrorType = 
  | 'session_expired'
  | 'session_invalid'
  | 'merge_conflict'
  | 'orphaned_data'
  | 'contact_mismatch';

export interface GuestError {
  type: GuestErrorType;
  message: string;
  details?: any;
}
