import { useMemo } from 'react';
import type { Order, OrderItem, OrderActionFlags, PaymentMethod, PaymentStatus } from '../types/order';

type ValidPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

// Type guard to check if a payment status is valid
function isValidPaymentStatus(status: string): status is ValidPaymentStatus {
  return ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'].includes(status);
}

// Normalize payment status for action state determination
function normalizePaymentStatus(status: PaymentStatus): 'pending' | 'paid' | 'refunded' | 'failed' {
  if (!isValidPaymentStatus(status)) {
    console.warn(`Unexpected payment status: ${status}, defaulting to 'pending'`);
    return 'pending';
  }
  
  return status === 'partially_refunded' ? 'paid' : status;
}

export type OrderActionStates = OrderActionFlags;

export type OrderActionStatesForItem = OrderActionStates & {
  itemStatus: OrderItem['item_status'];
  paymentMethod: Order['payment_method'];
  paymentStatus: Order['payment_status'];
};

/**
 * Computes derived order status from item statuses
 */
export function deriveOrderStatus(items: { item_status?: OrderItem['item_status'] }[]): Order['status'] {
  const statuses = items.map(i => i.item_status || 'pending');

  if (statuses.every(s => s === 'cancelled')) return 'cancelled';
  if (statuses.every(s => s === 'pending')) return 'pending';
  if (statuses.every(s => s === 'shipped')) return 'shipped';
  if (statuses.every(s => s === 'delivered')) return 'delivered';
  if (statuses.includes('shipped') && statuses.includes('pending')) return 'partially_shipped';
  if (statuses.includes('delivered') && statuses.includes('shipped')) return 'partially_delivered';
  if (statuses.includes('cancelled') && statuses.includes('pending')) return 'partially_cancelled';
  if (statuses.includes('refunded')) return 'partially_refunded';

  return 'pending';
}

/**
 * Determines button states for an order item based on payment method, payment status, and item status
 */
export function getOrderActionStates(
  paymentMethod: Order['payment_method'],
  paymentStatus: PaymentStatus,
  itemStatus: OrderItem['item_status'] = 'pending',
  deliveredAt?: string | null
): OrderActionFlags {
  const isCOD = paymentMethod === 'cod';
  const normalizedStatus = normalizePaymentStatus(paymentStatus);
  const isPaid = normalizedStatus === 'paid';

  // Helper function to check if return is within 3 days
  const within3Days = (deliveredAt?: string): boolean => {
    if (!deliveredAt) return false;
    const deliveredDate = new Date(deliveredAt);
    const now = new Date();
    const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  return {
    canShip: itemStatus === 'pending',
    canDeliver: itemStatus === 'shipped',
    canRefund:
      (isPaid && ['cancelled', 'delivered', 'shipped'].includes(itemStatus as string)) ||
      (isCOD && itemStatus === 'delivered'),
    canCancel: itemStatus === 'pending',
    canReturn: itemStatus === 'delivered' && within3Days(deliveredAt),
  };
}

/**
 * React hook for order action states - provides button visibility logic
 * based on payment method and item-level order states
 */
export function useOrderActionStates(
  paymentMethod: Order['payment_method'],
  paymentStatus: Order['payment_status'],
  itemStatus?: OrderItem['item_status'],
  deliveredAt?: string
) {
  return useMemo(() => {
    if (!itemStatus) {
      return {
        canShip: false,
        canDeliver: false,
        canRefund: false,
        canCancel: false,
        canReturn: false,
      };
    }

    return getOrderActionStates(paymentMethod, paymentStatus, itemStatus, deliveredAt);
  }, [paymentMethod, paymentStatus, itemStatus, deliveredAt]);
}

/**
 * React hook for single order item with order context
 */
export function useOrderItemActionStates(item: OrderItem, order: Order): OrderActionStates {
  return useOrderActionStates(
    order.payment_method,
    order.payment_status,
    item.item_status,
    item.delivered_at
  );
}

/**
 * React hook for order-level action states based on all items
 */
export function useOrderLevelActionStates(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  items: Array<{ item_status?: OrderItem['item_status']; delivered_at?: string | null; order_item_id: string }>
) {
  return useMemo(() => {
    // Helper function to get action states for an item
    const getItemActionStates = (item: { item_status?: OrderItem['item_status']; delivered_at?: string | null }) => {
      return getOrderActionStates(
        paymentMethod,
        paymentStatus,
        item.item_status || 'pending',
        item.delivered_at
      );
    };

    // Check if any items can perform each action
    const hasShippableItems = items.some(item => getItemActionStates(item).canShip);
    const hasDeliverableItems = items.some(item => getItemActionStates(item).canDeliver);
    const hasRefundableItems = items.some(item => getItemActionStates(item).canRefund);
    const hasCancellableItems = items.some(item => getItemActionStates(item).canCancel);
    const hasReturnableItems = items.some(item => getItemActionStates(item).canReturn);

    return {
      canShip: hasShippableItems,
      canDeliver: hasDeliverableItems,
      canRefund: hasRefundableItems,
      canCancel: hasCancellableItems,
      canReturn: hasReturnableItems,
    };
  }, [paymentMethod, paymentStatus, items]);
}

/**
 * Get button states for each item in an order
 */
export function getOrderItemsActionStates(
  paymentMethod: Order['payment_method'],
  paymentStatus: Order['payment_status'],
  items: { item_status?: OrderItem['item_status']; delivered_at?: string }[]
): OrderActionStatesForItem[] {
  return items.map(item => ({
    ...getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending', item.delivered_at),
    itemStatus: item.item_status || 'pending',
    paymentMethod,
    paymentStatus,
  }));
}
