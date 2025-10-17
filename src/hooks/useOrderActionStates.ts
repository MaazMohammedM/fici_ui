import { useMemo } from 'react';

export interface OrderActionStates {
  canShip: boolean;
  canDeliver: boolean;
  canRefund: boolean;
  canCancel: boolean;
}

export interface OrderActionStatesForItem extends OrderActionStates {
  itemStatus: string;
  paymentMethod: string;
  paymentStatus: string;
}

export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type ItemStatus = 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded';

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
 * Determines button states for an order based on payment method and item status
 */
export function getOrderActionStates(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  itemStatus: ItemStatus
): OrderActionStates {
  const isCOD = paymentMethod === 'cod';
  const isPaid = paymentStatus === 'paid';

  return {
    canShip: itemStatus === 'pending',
    canDeliver: itemStatus === 'shipped',
    canRefund:
      (isPaid && ['cancelled', 'delivered', 'shipped'].includes(itemStatus)) ||
      (isCOD && itemStatus === 'delivered'),
    canCancel: itemStatus === 'pending',
  };
}

/**
 * React hook for order action states - provides button visibility logic
 * based on payment method and item-level order states
 */
export function useOrderActionStates(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  itemStatus?: ItemStatus
) {
  return useMemo(() => {
    if (!itemStatus) {
      return {
        canShip: false,
        canDeliver: false,
        canRefund: false,
        canCancel: false,
      };
    }

    return getOrderActionStates(paymentMethod, paymentStatus, itemStatus);
  }, [paymentMethod, paymentStatus, itemStatus]);
}

/**
 * React hook for order-level action states based on all items
 */
export function useOrderLevelActionStates(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  items: { item_status?: ItemStatus }[]
) {
  return useMemo(() => {
    // Check if any items can perform each action
    const hasShippableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending').canShip
    );

    const hasDeliverableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending').canDeliver
    );

    const hasRefundableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending').canRefund
    );

    const hasCancellableItems = items.some(item =>
      getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending').canCancel
    );

    return {
      canShip: hasShippableItems,
      canDeliver: hasDeliverableItems,
      canRefund: hasRefundableItems,
      canCancel: hasCancellableItems,
    };
  }, [paymentMethod, paymentStatus, items]);
}

/**
 * Get button states for each item in an order
 */
export function getOrderItemsActionStates(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  items: { item_status?: ItemStatus }[]
): OrderActionStatesForItem[] {
  return items.map(item => ({
    ...getOrderActionStates(paymentMethod, paymentStatus, item.item_status || 'pending'),
    itemStatus: item.item_status || 'pending',
    paymentMethod,
    paymentStatus,
  }));
}
