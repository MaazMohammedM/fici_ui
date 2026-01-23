import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import type { Order } from '../../types/order-common';

interface OrderHeaderProps {
  order: Order;
  isGuest: boolean;
  cancellingOrder: boolean;
  onCancelEntireOrder: () => void;
  canCancelOrder: boolean;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  isGuest,
  cancellingOrder,
  onCancelEntireOrder,
  canCancelOrder,
}) => {
  // --- Status icon mapping ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
      case 'Shipped':
        return <Truck className="w-4 h-4" />;
      case 'cancelled':
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'paid':
      case 'Payment Confirmed':
        return <Package className="w-4 h-4" />;
      case 'Cash On Delivery Order':
        return <Clock className="w-4 h-4" />;
      case 'Partially Delivered':
        return <Truck className="w-4 h-4" />;
      case 'Partially Cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'Partially Refunded':
        return <Package className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // --- Status color mapping ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'Delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'shipped':
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'paid':
      case 'Payment Confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Cash On Delivery Order':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Partially Delivered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Partially Cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Partially Refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  // --- User-facing status mapping ---
  const getUserFriendlyStatus = (order: Order) => {
    if (order.payment_method === 'cod' && order.status === 'pending') {
      return 'Cash On Delivery Order';
    }

    // Check item statuses for more accurate status
    const items = Array.isArray(order.order_items) ? order.order_items : Object.values(order.order_items || {});
    if (items.length > 0) {
      const statuses = items.map((item: any) => item.item_status || 'pending');
      const allCancelled = statuses.every(s => s === 'cancelled');
      const allDelivered = statuses.every(s => s === 'delivered');

      if (allCancelled) return 'Cancelled';
      if (allDelivered) return 'Delivered';
    }

    switch (order.status) {
      case 'pending':
        return 'Awaiting Payment';
      case 'paid':
        return 'Payment Confirmed';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'partially_delivered':
        return 'Partially Delivered';
      case 'partially_cancelled':
        return 'Partially Cancelled';
      case 'partially_shipped':
        return 'Partially Shipped';
      default:
        return order.status.charAt(0).toUpperCase() + order.status.slice(1);
    }
  };

  const orderStatusDisplay = getUserFriendlyStatus(order);
  const statusColorClass = getStatusColor(orderStatusDisplay);

  // --- Add descriptive message for clarity ---
  const getUserStatusMessage = (order: Order) => {
    // Check item-level statuses for aggregate message
    const items = Array.isArray(order.order_items) ? order.order_items : Object.values(order.order_items || {});
    if (items.length > 0) {
      const itemStatuses = items.map((item: any) => item.item_status || 'pending');
      const allCancelled = itemStatuses.every((s: string) => s === 'cancelled');
      const allDelivered = itemStatuses.every((s: string) => s === 'delivered');
      const someCancelled = itemStatuses.some((s: string) => s === 'cancelled' || s === 'refunded');
      const someDelivered = itemStatuses.some((s: string) => s === 'delivered');
      const someProcessing = itemStatuses.some((s: string) => s === 'shipped' || s === 'pending');
      
      if (allCancelled) return 'This order has been cancelled.';
      if (allDelivered) return 'All items have been delivered successfully.';
      if (someCancelled && someProcessing) return 'Some items cancelled. Others are being processed.';
      if (someCancelled && someDelivered) return 'Partially fulfilled order.';
    }

    if (order.payment_method === 'cod' && order.status === 'pending') {
      return 'Your COD order has been placed successfully and will be shipped soon.';
    }
    if (order.status === 'pending' && order.payment_method !== 'cod') {
      return 'Your order is awaiting payment confirmation.';
    }
    if (order.status === 'paid') {
      return 'Payment received. Your order will be shipped soon.';
    }
    if (order.status === 'shipped') {
      return 'Your order is on the way.';
    }
    if (order.status === 'delivered') {
      return 'Your order has been delivered successfully.';
    }
    if (order.status === 'cancelled') {
      return 'This order was cancelled.';
    }
    return '';
  };

  const statusMessage = getUserStatusMessage(order);

  return (
    <>
      {/* Back Button */}
      <div className="mb-4 sm:mb-6">
        <Link
          to={isGuest ? '/guest/orders' : '/orders'}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {isGuest ? 'Order Lookup' : 'Order History'}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-lg sm:rounded-xl">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Order #{order.order_id.split('-')[0]}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {new Date(order.order_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusColorClass}`}>
                  {getStatusIcon(orderStatusDisplay)}
                  {orderStatusDisplay}
                </span>

                {(!isGuest || order.payment_method === 'cod') && (
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {canCancelOrder && (
                      <button
                        onClick={onCancelEntireOrder}
                        disabled={cancellingOrder}
                        className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {cancellingOrder ? 'Cancelling...' : 'Cancel Entire Order'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {statusMessage && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 w-full">
                  {statusMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Shipping Details */}
        {order.shipping_partner && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg p-4 sm:p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Your Order is {order.status === 'shipped' ? 'On the Way' : 'Shipped'}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {order.status === 'shipped' 
                    ? 'Your package is on its way to you.'
                    : 'Your package has been delivered.'}
                </p>
              </div>
              {order.status === 'shipped' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  In Transit
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Shipping Partner</h3>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.shipping_partner}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Tracking Number</h3>
                <p className="text-sm font-mono font-medium text-gray-900 dark:text-white break-all">
                  {order.tracking_id}
                </p>
              </div>

              {order.shipped_at && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Shipped On</h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(order.shipped_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {order.status === 'shipped' ? 'Expected Delivery' : 'Delivered On'}
                </h3>
                <p className="text-sm text-gray-900 dark:text-white">
                  {order.status === 'shipped' ? (
                    <span className="font-medium">
                      {new Date(new Date(order.shipped_at || new Date()).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                      <span className="text-xs text-gray-500 ml-1">(Estimated)</span>
                    </span>
                  ) : order.delivered_at ? (
                    new Date(order.delivered_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  ) : 'N/A'}
                </p>
              </div>
            </div>

            {order.tracking_url && (
              <div className="mt-6">
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Track Your Package
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
