import React from 'react';
import { Eye, TruckIcon, Ban, CheckCircle, Upload } from 'lucide-react';
import type { Order, OrderActionFlags } from '../../../types/order-common';
import { printInvoice, generateInvoiceNumber, type InvoiceData, type InvoiceItem } from '../../../utils/invoiceUtils';

interface AdminOrderRowProps {
  order: Order;
  actionStates?: OrderActionFlags;
  onView: (order: Order) => void;
  onShip: (order: Order) => void;
  onCancel: (order: Order) => void;
  onDeliver: (order: Order) => void;
  onRefundItem: (item: any) => void;
  onApproveReplacement: (item: any) => void;
  onPrintInvoice?: (order: Order) => void;
}

export const AdminOrderRow: React.FC<AdminOrderRowProps> = ({
  order,
  actionStates,
  onView,
  onShip,
  onCancel,
  onDeliver,
  onRefundItem,
  onApproveReplacement,
  onPrintInvoice,
}) => {
  const isShippingAddress = (address: any): address is any => {
    return typeof address === 'object' && address !== null;
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-yellow-500 rounded-full" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped':
      case 'partially_shipped':
        return <TruckIcon className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order #{order.order_id.slice(-8)}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
            >
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </span>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium">
                {new Date(order.order_date).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium">
                ₹{order.total_amount?.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium capitalize">{order.payment_method}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Customer</p>
            <p className="font-medium">
              {order.user_id
                ? `User ID: ${order.user_id}`
                : `${order.guest_email || 'N/A'} (${order.guest_phone || 'N/A'})`}
            </p>
          </div>

          {/* Address */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Shipping Address</p>
            <div className="text-sm">
              {isShippingAddress(order.shipping_address) ? (
                <>
                  <p>{(order.shipping_address as any).name || 'N/A'}</p>
                  <p>{(order.shipping_address as any).address || 'N/A'}</p>
                  <p>
                    {(order.shipping_address as any).city || 'N/A'},{' '}
                    {(order.shipping_address as any).district
                      ? `${(order.shipping_address as any).district}, `
                      : ''}
                    {(order.shipping_address as any).state || 'N/A'} -{' '}
                    {(order.shipping_address as any).pincode || 'N/A'}
                  </p>
                  <p>{(order.shipping_address as any).phone || 'N/A'}</p>
                </>
              ) : (
                <p>{order.shipping_address || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Items summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Items ({order.order_items?.length || 0})
            </p>
            <div className="space-y-2">
              {order.order_items?.slice(0, 3).map((item) => (
                <div key={item.order_item_id} className="flex items-center gap-3 text-sm">
                  <img
                    src={item.thumbnail_url || '/placeholder-image.jpg'}
                    alt={item.product_name}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-gray-500">
                      Size: {item.size} | Qty: {item.quantity} | Status:
                      <span
                        className={`ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.item_status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : item.item_status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : item.item_status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : item.item_status === 'replacement_requested'
                            ? 'bg-orange-100 text-orange-800'
                            : item.item_status === 'replacement_initiated'
                            ? 'bg-purple-100 text-purple-800'
                            : item.item_status === 'replacement_shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : item.item_status === 'replacement_delivered'
                            ? 'bg-green-100 text-green-800'
                            : item.item_status === 'replacement_rejected'
                            ? 'bg-red-100 text-red-800'
                            : item.item_status === 'returned_to_warehouse'
                            ? 'bg-gray-100 text-gray-800'
                            : item.item_status === 'refunded'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {(item.item_status || 'pending').toUpperCase()}
                      </span>
                    </p>
                    {/* Item-level actions */}
                    <div className="flex gap-1 mt-1">
                      {/* {order.payment_method === 'razorpay' && item.item_status === 'delivered' && !['refunded'].includes(item.item_status || '') && (
                        <button
                          onClick={() => onRefundItem(item)}
                          className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
                        >
                          Refund
                        </button>
                      )} */}
                      {item.item_status === 'replacement_requested' && (
                        <button
                          onClick={() => onApproveReplacement(item)}
                          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Approve Replacement
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-medium">
                    ₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
              {(order.order_items?.length || 0) > 3 && (
                <p className="text-sm text-gray-500">
                  +{(order.order_items?.length || 0) - 3} more items
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
          <button
            onClick={() => onView(order)}
            className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-blue-200 hover:border-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Eye className="w-4 h-4 sm:w-4 sm:h-4" />
            <span>View</span>
          </button>

          {actionStates?.canShip && (
            <button
              onClick={() => onShip(order)}
              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-blue-200 hover:border-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <TruckIcon className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Ship</span>
            </button>
          )}

          {actionStates?.canCancel && (
            <button
              onClick={() => onCancel(order)}
              className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-red-200 hover:border-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Ban className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Cancel</span>
            </button>
          )}

          {actionStates?.canDeliver && (
            <button
              onClick={() => onDeliver(order)}
              className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-green-200 hover:border-green-300 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Deliver</span>
            </button>
          )}

          {/* Show Print Invoice for delivered orders */}
          {order.status === 'delivered' && onPrintInvoice && (
            <button
              onClick={() => onPrintInvoice(order)}
              className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-indigo-200 hover:border-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              title="Print Invoice"
            >
              <Upload className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Print Invoice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
