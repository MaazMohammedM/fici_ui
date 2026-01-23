// types/order.ts

export interface ProductInfo {
  id: string;
  name: string;
  thumbnail_url?: string;
}

export interface OrderItem {
  order_item_id?: string;
  order_id?: string;
  product_id: string;
  article_id?: string;
  name?: string;
  product_name?: string;
  product_thumbnail_url?: string;
  color?: string;
  size?: string;
  quantity: number;
  price_at_purchase?: number;
  mrp?: number;
  discount_percentage?: number;
  thumbnail_url?: string;
  price_currency?: string;
  product?: ProductInfo;
  
  // Shipping/tracking fields
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  
  // Item-level status and tracking
  item_status?: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded' | 'replacement_requested' | 'replacement_initiated' | 'replacement_shipped' | 'replacement_delivered' | 'replacement_rejected' | 'returned_to_warehouse';
  cancel_reason?: string;
  return_reason?: string;
  replacement_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
  return_requested_at?: string;
  return_approved_at?: string;
  replacement_requested_at?: string;
  replacement_approved_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface ShippingAddress {
  name?: string;
  street?: string;
  address?: string; // For compatibility with AdminOrderDashboard
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  district?: string; // For admin dashboard
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
  effective_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'partially_delivered' | 'partially_cancelled' | 'partially_refunded' | 'partially_shipped';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
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

// Admin-specific Order interface that matches database schema
export interface AdminOrder {
  order_id: string;
  user_id?: string;
  guest_email?: string;
  guest_phone?: string;
  shipping_address: ShippingAddress | string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  status: string;
  order_date?: string;
  created_at?: string;
  updated_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  order_items: OrderItem[];
  order_type?: string;
  order_status?: string;
  comments?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_partner?: string;
  tracking_id?: string;
  subtotal?: number;
  discount?: number;
  cod_fee?: number;
  delivery_charge?: number;
}

export interface Review {
  review_id: string;
  product_id: string;
  user_id?: string;
  guest_session_id?: string;
  rating: number; // 1-5
  comment?: string;
  title?: string;
  is_verified_purchase?: boolean;
  review_type?: 'registered' | 'guest';
  created_at: string;
  updated_at?: string;
  // Additional fields for display
  user_name?: string;
  user_avatar?: string;
}

export interface OrderFilters {
  status?: 'all' | 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_delivered' | 'partially_cancelled' | 'partially_refunded';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Type for creating new orders (extends Order without id and timestamps)
export type CreateOrderData = Omit<Order, 'id' | 'created_at' | 'updated_at'>;

// Additional types for admin functionality
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'partially_delivered' | 'partially_cancelled' | 'partially_refunded' | 'partially_shipped';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'cod' | 'razorpay';
export type OrderType = 'guest' | 'registered';

export interface OrderActionFlags {
  canShip: boolean;
  canDeliver: boolean;
  canRefund: boolean;
  canCancel: boolean;
  canReturn: boolean;
}

// Cancel function parameters
export interface CancelOrderItemsParams {
  orderId: string;
  orderItemIds: string[];
  cancelReason: string;
  comments?: string;
  isAdmin?: boolean;
  adminUserId?: string;
  userId?: string;
  guestSessionId?: string;
}