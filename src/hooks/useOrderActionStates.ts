import { useMemo } from 'react';

export interface OrderActionStates {
  canShip: boolean;
  canDeliver: boolean;
  canRefund: boolean;
  canCancel: boolean;
  canReturn: boolean;
}

export interface OrderActionStatesForItem extends OrderActionStates {
  itemStatus: string;
  paymentMethod: string;
  paymentStatus: string;
}

export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type ItemStatus = 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded';

export interface OrderItem {
  order_item_id: string;
  item_status?: ItemStatus;
  delivered_at?: string;
  price_at_purchase?: number;
}

export interface OrderData {
  order_id: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: string;
}

/**
 * Computes derived order status from item statuses
 */
export function deriveOrderStatus(items: { item_status?: ItemStatus }[]): string {
  const statuses = items.map(i => i.item_status || 'pending');

  if (statuses.every(s => s === 'cancelled')) return 'cancelled';
  if (statuses.every(s => s === 'pending')) return 'pending';
  if (statuses.every(s => s === 'shipped')) return 'shipped';
  if (statuses.every(s => s === 'delivered')) return 'delivered';
  if (statuses.includes('shipped') && statuses.includes('pending')) return 'partially_shipped';
  if (statuses.includes('delivered') && statuses.includes('shipped')) return 'partially_delivered';
  if (statuses.includes('cancelled') && statuses.includes('pending')) return 'partially_cancelled';
  if (statuses.includes('refunded')) return 'partially_refunded';

  return 'mixed';
}

/**
 * Determines button states for an order item based on payment method, payment status, and item status
 */
export function getOrderActionStates(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  itemStatus: ItemStatus,
  deliveredAt?: string
): OrderActionStates {
  const isCOD = paymentMethod === 'cod';
  const isPaid = paymentStatus === 'paid';

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
      (isPaid && ['cancelled', 'delivered', 'shipped'].includes(itemStatus)) ||
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
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  itemStatus?: ItemStatus,
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
export function useOrderItemActionStates(item: OrderItem, order: OrderData): OrderActionStates {
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
  items: { item_status?: ItemStatus; delivered_at?: string }[]
) {
  return useMemo(() => {
    // Check if any items can perform each action
    const hasShippableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending', item.delivered_at).canShip
    );

    const hasDeliverableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending', item.delivered_at).canDeliver
    );

    const hasRefundableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending', item.delivered_at).canRefund
    );

    const hasCancellableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending', item.delivered_at).canCancel
    );

    const hasReturnableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending', item.delivered_at).canReturn
    );

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
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  items: { item_status?: ItemStatus; delivered_at?: string }[]
): OrderActionStatesForItem[] {
  return items.map(item => ({
    ...getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending', item.delivered_at),
    itemStatus: item.item_status || 'pending',
    paymentMethod,
    paymentStatus,
  }));
}
