import React from 'react';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, DollarSign, Ban, Upload } from 'lucide-react';
import type { Order, OrderItem, OrderActionFlags } from '../../../types/order-common';
import { canRefundOrder } from '../../../types/order-common';
import {
  getStatusColor,
  getStatusIcon,
  getItemStatusLabel,
  getItemStatusClass,
} from '../../../utils/adminOrderUtils';

interface OrderCardProps {
  order: Order;
  actionStates?: OrderActionFlags;
  onView: (order: Order) => void;
  onShip: (order: Order) => void;
  onCancel: (order: Order) => void;
  onDeliver: (order: Order) => void;
  onRefundItem: (item: OrderItem) => void;
  onRefundOrder: (order: Order) => void;
  onDeliverReplacement?: (item: OrderItem) => void;
  onApproveReplacement?: (item: OrderItem) => void;
  onRejectReplacement?: (item: OrderItem) => void;
  onShipReplacement?: (item: OrderItem) => void;
  onMarkReturned?: (item: OrderItem) => void;
  onPrintInvoice?: (order: Order) => void;
}

const ItemActions: React.FC<{
  item: OrderItem;
  order: Order;
  onRefundItem: (item: OrderItem) => void;
  onApproveReplacement?: (item: OrderItem) => void;
  onRejectReplacement?: (item: OrderItem) => void;
  onShipReplacement?: (item: OrderItem) => void;
  onDeliverReplacement?: (item: OrderItem) => void;
}> = ({ item, order, onRefundItem, onApproveReplacement, onRejectReplacement, onShipReplacement, onDeliverReplacement }) => (
  <div className="flex gap-1 mt-1 flex-wrap">
    {order.payment_method === 'razorpay' &&
      ['delivered', 'cancelled'].includes(item.item_status || '') &&
      item.item_status !== 'refunded' && (
        <button
          onClick={() => onRefundItem(item)}
          className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          Refund
        </button>
      )}

    {item.item_status === 'replacement_requested' && (
      <div className="space-y-2 w-full">
        {item.replacement_reason && (
          <div className="text-xs text-gray-600 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
            <span className="font-medium">Reason:</span> {item.replacement_reason}
          </div>
        )}
        <div className="flex gap-1">
          <button
            onClick={() => onApproveReplacement?.(item)}
            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Approve Replacement
          </button>
          <button
            onClick={() => onRejectReplacement?.(item)}
            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reject Replacement
          </button>
        </div>
      </div>
    )}

    {item.item_status === 'cancelled' && item.cancel_reason && (
      <div className="text-xs text-gray-600 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-2 rounded w-full">
        <span className="font-medium">Cancel Reason:</span> {item.cancel_reason}
      </div>
    )}

    {item.item_status === 'replacement_initiated' && (
      <div className="space-y-2 w-full">
        <div className="text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">Approved – Pending Shipment</span>
          {item.replacement_reason && (
            <><br /><span className="font-medium">Original Request Reason:</span> {item.replacement_reason}</>
          )}
        </div>
        <button
          onClick={() => onShipReplacement?.(item)}
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ship Replacement
        </button>
      </div>
    )}

    {item.item_status === 'replacement_shipped' && (
      <div className="space-y-2 w-full">
        <div className="text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">Courier:</span> {item.shipping_partner || 'N/A'}
          <br />
          <span className="font-medium">Tracking:</span> {item.tracking_id || 'N/A'}
        </div>
        {onDeliverReplacement && (
          <button
            onClick={() => onDeliverReplacement(item)}
            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark as Delivered
          </button>
        )}
      </div>
    )}

    {item.item_status === 'replacement_delivered' && (
      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Replacement Delivered</p>
    )}

    {item.item_status === 'replacement_rejected' && (
      <div className="text-xs text-red-600 dark:text-red-300">
        <span className="font-medium">Replacement Rejected</span>
        {item.replacement_reason && (
          <><br /><span className="font-medium">Reason:</span> {item.replacement_reason}</>
        )}
      </div>
    )}
  </div>
);

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  actionStates,
  onView,
  onShip,
  onCancel,
  onDeliver,
  onRefundItem,
  onRefundOrder,
  onDeliverReplacement,
  onApproveReplacement,
  onRejectReplacement,
  onShipReplacement,
  onMarkReturned,
  onPrintInvoice,
}) => {
  const isShippingAddress = (address: unknown): address is import('../../../types/order-common').ShippingAddress =>
    typeof address === 'object' && address !== null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* ── Left: order info ── */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order #{order.order_id.slice(-8)}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </span>
          </div>

          {/* Basic info grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Order Date & Time</p>
              <p className="font-medium">
                {new Date(order.order_date).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium">
                ₹{(order.effective_amount ?? order.total_amount)?.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium capitalize">{order.payment_method}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Customer</p>
            <p className="font-medium">
              {order.user_id
                ? `User ID: ${order.user_id}`
                : `${order.guest_email || 'N/A'} (${order.guest_phone || 'N/A'})`}
            </p>
          </div>

          {/* Address */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Shipping Address</p>
            <div className="text-sm">
              {isShippingAddress(order.shipping_address) ? (
                <>
                  <p>{order.shipping_address.name || 'N/A'}</p>
                  <p>{order.shipping_address.address || 'N/A'}</p>
                  <p>
                    {order.shipping_address.city || 'N/A'},
                    {order.shipping_address.district ? ` ${order.shipping_address.district},` : ''}
                    {' '}{order.shipping_address.state || 'N/A'} - {order.shipping_address.pincode || 'N/A'}
                  </p>
                  <p>{order.shipping_address.phone || 'N/A'}</p>
                </>
              ) : (
                <p>{order.shipping_address as string || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Items ({order.order_items?.length || 0})</p>
            <div className="space-y-2">
              {order.order_items?.slice(0, 3).map((item) => (
                <div key={item.order_item_id} className="flex items-start gap-3 text-sm">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.product_name}
                      className="w-8 h-8 object-cover rounded flex-shrink-0"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('placeholder-image.jpg')) {
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-gray-500">
                      Size: {item.size} | Qty: {item.quantity} | Status:
                      <span className={`ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getItemStatusClass(item.item_status || '')}`}>
                        {getItemStatusLabel(item.item_status || '')}
                      </span>
                    </p>
                    <ItemActions
                      item={item}
                      order={order}
                      onRefundItem={onRefundItem}
                      onApproveReplacement={onApproveReplacement}
                      onRejectReplacement={onRejectReplacement}
                      onShipReplacement={onShipReplacement}
                      onDeliverReplacement={onDeliverReplacement}
                    />
                  </div>
                  <p className="font-medium flex-shrink-0">
                    ₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
              {(order.order_items?.length || 0) > 3 && (
                <p className="text-sm text-gray-500">+{(order.order_items?.length || 0) - 3} more items</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: actions ── */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
          <button
            onClick={() => onView(order)}
            className="flex items-center justify-center gap-2 text-primary hover:text-primary-active text-sm px-3 py-2 rounded border border-primary/20 hover:border-primary/40 bg-white dark:bg-gray-800 hover:bg-primary/5 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>

          {canRefundOrder(order) && (
            <button
              onClick={() => onRefundOrder(order)}
              className="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 text-sm px-3 py-2 rounded border border-orange-200 hover:border-orange-300 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Refund</span>
            </button>
          )}

          {actionStates?.canShip && (
            <button
              onClick={() => onShip(order)}
              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm px-3 py-2 rounded border border-blue-200 hover:border-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Ship</span>
            </button>
          )}

          {actionStates?.canCancel && (
            <button
              onClick={() => onCancel(order)}
              className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm px-3 py-2 rounded border border-red-200 hover:border-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}

          {actionStates?.canDeliver && (
            <button
              onClick={() => onDeliver(order)}
              className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 text-sm px-3 py-2 rounded border border-green-200 hover:border-green-300 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Deliver</span>
            </button>
          )}

          {order.status === 'delivered' && onPrintInvoice && (
            <button
              onClick={() => onPrintInvoice(order)}
              className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm px-3 py-2 rounded border border-indigo-200 hover:border-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
