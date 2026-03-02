// Shared type definitions for order-related components
// This file contains common types used across OrderDetailsPage and AdminOrderDashboard

export type ItemStatus =
  | 'pending'
  | 'cancelled'
  | 'shipped'
  | 'delivered'
  | 'replacement_requested'
  | 'replacement_initiated'
  | 'replacement_shipped'
  | 'replacement_delivered'
  | 'replacement_rejected'
  | 'returned_to_warehouse'
  | 'refunded';

export type PaymentMethod = 'cod' | 'razorpay';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface CancelOrderItemsParams {
  orderId: string;
  itemIds: string[];
  reason: string;
  comments?: string;
}

export interface OrderItem {
  order_item_id?: string;
  order_id?: string;
  product_id: string;
  article_id?: string;
  name?: string;
  product_name?: string;
  size?: string;
  quantity: number;
  price_at_purchase?: number;
  mrp?: number;
  discount_percentage?: number;
  thumbnail_url?: string;
  product_thumbnail_url?: string;
  price_currency?: string;
  item_status?: ItemStatus;
  cancel_reason?: string | null;
  replacement_reason?: string | null;
  return_reason?: string | null;
  refund_amount?: any;
  refunded_at?: string | null;
  return_requested_at?: string | null;
  return_approved_at?: string | null;
  replacement_requested_at?: string | null;
  replacement_approved_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  shipping_partner?: string | null;
  tracking_id?: string | null;
  tracking_url?: string | null;
}

export interface ShippingAddress {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  district?: string;
}

export interface Order {
  order_id: string;
  order_date?: string;
  status: string;
  total_amount: number;
  effective_amount?: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  payment_method: string;
  payment_status: string;
  shipping_address: ShippingAddress | string;
  order_items?: OrderItem[];
  user_id?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  order_type?: string;
  order_status?: string;
  comments?: string;
  cod_fee?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

export interface OrderActionFlags {
  canShip: boolean;
  canCancel: boolean;
  canDeliver: boolean;
  canRefund?: boolean;
}

export interface CancelOrderItemsParams {
  orderId: string;
  orderItemIds: string[];
  cancelReason: string;
  comments?: string;
  userId?: string;
  guestSessionId?: string;
  isAdmin?: boolean;
  adminUserId?: string;
}

// Status utility functions
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return 'clock';
    case 'paid':
      return 'check-circle';
    case 'shipped':
    case 'partially_shipped':
      return 'truck';
    case 'delivered':
      return 'check-circle';
    case 'cancelled':
      return 'x-circle';
    default:
      return 'clock';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'paid':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'shipped':
    case 'partially_shipped':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'delivered':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'cancelled':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'partially_delivered':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'partially_cancelled':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'partially_refunded':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getItemStatusColor = (status: ItemStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'shipped':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'replacement_requested':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'replacement_initiated':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'replacement_shipped':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'replacement_delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'replacement_rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'returned_to_warehouse':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'refunded':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Order action utility functions
export const canCancelItem = (item: OrderItem): boolean => {
  const itemStatus = item.item_status || 'pending';
  return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
};

export const canRequestReplacement = (item: OrderItem): boolean => {
  if (item.item_status !== 'delivered') return false;
  if (!item.delivered_at) return false;
  
  // Check if delivered within 3 days
  const deliveredDate = new Date(item.delivered_at);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const isWithin3Days = deliveredDate >= threeDaysAgo;
  
  // Check if not already in replacement lifecycle or refunded
  const notAlreadyProcessed = !['replacement_requested', 'replacement_initiated', 'replacement_shipped', 'replacement_delivered', 'replacement_rejected', 'refunded'].includes(item.item_status || '');
  
  return isWithin3Days && notAlreadyProcessed;
};

export const canReturnItem = (item: OrderItem): boolean => {
  return item.item_status === 'delivered' && !['returned', 'refunded', 'cancelled'].includes(item.item_status || '');
};

export const canRefundItem = (item: OrderItem, paymentMethod?: string, paymentStatus?: string): boolean => {
  const itemStatus = item.item_status || 'pending';
  const isPaid = paymentStatus === 'paid';
  const isCOD = paymentMethod === 'cod';
  
  // For Razorpay: can refund paid orders with cancelled, delivered, or shipped items
  if (!isCOD && isPaid && ['cancelled', 'delivered', 'shipped'].includes(itemStatus)) {
    return itemStatus !== 'refunded';
  }
  
  // For COD: can refund only delivered items
  if (isCOD && itemStatus === 'delivered') {
    return true;
  }
  
  return false;
};

export const canRefundOrder = (order: Order): boolean => {
  return order.order_items?.some(item => canRefundItem(item, order.payment_method, order.payment_status)) || false;
};

export const canCancelOrder = (order: Order): boolean => {
  return order.order_items?.some(item => canCancelItem(item)) || false;
};

export const canReturnOrder = (order: Order): boolean => {
  return order.order_items?.some(item => canReturnItem(item)) || false;
};
