// types/order.ts

export interface OrderItem {
  product_id: string;
  article_id?: string;
  name?: string;
  product_name?: string;
  color?: string;
  size?: string;
  quantity: number;
  price_at_purchase?: number;
  mrp?: number;
  discount_percentage?: number;
  thumbnail_url?: string;
}

export interface ShippingAddress {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

export interface Order {
  id: string; // order_id from database
  user_id?: string; // For registered users
  
  // Guest order fields
  guest_session_id?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_name?: string;
  guest_tpin?: string; // For guest order verification during payment
  
  // Deprecated - keeping for backward compatibility
  guest_contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  
  items: OrderItem[] | Record<string, OrderItem>; // Can be array or JSONB object
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method?: string;
  payment_id?: string;
  shipping_address?: ShippingAddress | string;
  billing_address?: ShippingAddress | string;
  tracking_number?: string;
  tracking_url?: string;
  notes?: string;
  
  // Timestamps
  created_at?: string;
  order_date?: string;
  updated_at?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  
  // Internal use
  merged_at?: string; // When guest order was merged to user account
  is_guest_order?: boolean;
}

export interface Review {
  review_id: string;
  product_id: string;
  user_id: string;
  rating: number; // 1-5
  comment?: string;
  title?: string;
  is_verified_purchase?: boolean;
  created_at: string;
  updated_at?: string;
  // Additional fields for display
  user_name?: string;
  user_avatar?: string;
}

export interface OrderFilters {
  status?: 'all' | 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreateOrderData extends Omit<Order, 'id' | 'created_at' | 'updated_at'> {
}