import type { Order, OrderItem, OrderActionFlags, ShippingAddress } from './order-common';

export interface Return {
  order_item_id: string;
  order_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: string;
  thumbnail_url: string;
  product_name: string;
  product_thumbnail_url: string | null;
  price_currency: string;
  color: string;
  mrp: string;
  item_status: string;
  cancel_reason: string | null;
  return_reason: string | null;
  refund_amount: string | null;
  refunded_at: string | null;
  return_requested_at: string;
  return_approved_at: string | null;
  shipped_at: string;
  delivered_at: string;
  shipping_partner: string;
  tracking_id: string;
  tracking_url: string | null;
  requested_size: string | null;
  orders: {
    order_id: string;
    order_date: string;
    user_id: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    shipping_address: ShippingAddress;
    payment_method: string;
    payment_status: string;
    total_amount: number;
    status: string;
  };
}

export interface OrderActionStateEntry {
  orderId: string;
  actionStates: OrderActionFlags;
  orderItems: OrderItem[];
}

export interface AlertModalState {
  isOpen: boolean;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface ShipmentFormState {
  shipping_partner: string;
  tracking_id: string;
  tracking_url: string;
}

export interface ConfirmActionState {
  orderId: string;
  action: string;
  message: string;
}
