// types/order.ts

export interface OrderItem {
  product_id: string;
  article_id?: string;
  name?: string;
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
  user_id?: string; // Optional for guest orders
  guest_session_id?: string; // For guest orders
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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  shipping_address?: ShippingAddress | string;
  created_at?: string;
  order_date?: string;
  updated_at?: string;
  merged_at?: string; // When guest order was merged to user account
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