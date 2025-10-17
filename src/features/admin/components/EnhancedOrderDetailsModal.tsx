import React, { useState } from 'react';
import { XCircle, CheckCircle, Clock, Truck as TruckIcon, DollarSign, Ban } from 'lucide-react';

interface OrderItem {
  order_item_id: string;
  product_name: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  thumbnail_url: string;
  item_status?: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded';
  cancel_reason?: string;
  return_reason?: string;
  refund_amount?: number;
}

interface Order {
  order_id: string;
  order_date: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  cod_fee: number;
  shipping_address: any;
  order_type: string;
  guest_email?: string;
  guest_phone?: string;
  user_id?: string;
  order_status?: string;
  comments?: string;
  order_items: OrderItem[];
}

interface EnhancedOrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onShipItem: (orderItemId: string, orderId: string) => void;
  onDeliverItem: (orderItemId: string, orderId: string) => void;
  onCancelItem: (orderItemId: string, orderId: string, reason: string) => void;
  onRefundItem: (orderItemId: string, orderId: string) => void;
  onBulkShipItems: (itemIds: string[], orderId: string) => void;
  onBulkRefundItems: (itemIds: string[], orderId: string) => void;
  processingAction: string | null;
}

const getItemStatusColor = (status?: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'shipped':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'returned':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

export const EnhancedOrderDetailsModal: React.FC<EnhancedOrderDetailsModalProps> = ({
  order,
  onClose,
  onShipItem,
  onDeliverItem,
  onCancelItem,
  onRefundItem,
  onBulkShipItems,
  onBulkRefundItems,
  processingAction,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItemForCancel, setSelectedItemForCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    setSelectedItems(order.order_items.map(item => item.order_item_id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const handleCancelItemClick = (itemId: string) => {
    setSelectedItemForCancel(itemId);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = () => {
    if (selectedItemForCancel && cancelReason) {
      onCancelItem(selectedItemForCancel, order.order_id, cancelReason);
      setShowCancelModal(false);
      setSelectedItemForCancel(null);
      setCancelReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Order Details - #{order.order_id.slice(-8)}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Order Information</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Date:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                <p><strong>Type:</strong> {order.order_type}</p>
                <p><strong>Payment:</strong> {order.payment_method}</p>
                <p><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
                <p><strong>Payment Status:</strong> <span className="capitalize">{order.payment_status}</span></p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Customer Information</h4>
              <div className="space-y-2 text-sm">
                {order.user_id ? (
                  <p><strong>User ID:</strong> {order.user_id.slice(-8)}</p>
                ) : (
                  <>
                    <p><strong>Email:</strong> {order.guest_email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {order.guest_phone || 'N/A'}</p>
                  </>
                )}
                <p><strong>Address:</strong> {order.shipping_address?.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {order.shipping_address?.address}, {order.shipping_address?.city}
                </p>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onBulkShipItems(selectedItems, order.order_id)}
                  disabled={!!processingAction}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Ship Selected
                </button>
                <button
                  onClick={() => onBulkRefundItems(selectedItems, order.order_id)}
                  disabled={!!processingAction}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  Refund Selected
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Order Items</h4>
              <button
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Select All
              </button>
            </div>
            
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.order_item_id}
                  className={`border rounded-lg p-4 ${
                    selectedItems.includes(item.order_item_id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.order_item_id)}
                      onChange={() => toggleItemSelection(item.order_item_id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />

                    {/* Image */}
                    <img
                      src={item.thumbnail_url}
                      alt={item.product_name}
                      className="w-16 h-16 rounded object-cover"
                    />

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">{item.product_name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Size: {item.size} • Qty: {item.quantity} • ₹{item.price_at_purchase}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getItemStatusColor(item.item_status)}`}>
                          {(item.item_status || 'pending').toUpperCase()}
                        </span>
                      </div>

                      {/* Item Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.item_status === 'pending' && (
                          <>
                            <button
                              onClick={() => onShipItem(item.order_item_id, order.order_id)}
                              disabled={processingAction === `ship-item-${item.order_item_id}`}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              <TruckIcon className="w-3 h-3" />
                              Ship
                            </button>
                            <button
                              onClick={() => handleCancelItemClick(item.order_item_id)}
                              disabled={processingAction === `cancel-item-${item.order_item_id}`}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              <Ban className="w-3 h-3" />
                              Cancel
                            </button>
                          </>
                        )}

                        {item.item_status === 'shipped' && (
                          <button
                            onClick={() => onDeliverItem(item.order_item_id, order.order_id)}
                            disabled={processingAction === `deliver-item-${item.order_item_id}`}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Deliver
                          </button>
                        )}

                        {(item.item_status === 'delivered' || item.item_status === 'returned') && (
                          <button
                            onClick={() => onRefundItem(item.order_item_id, order.order_id)}
                            disabled={processingAction === `refund-item-${item.order_item_id}`}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                          >
                            <DollarSign className="w-3 h-3" />
                            Refund
                          </button>
                        )}

                        {(item.item_status === 'cancelled' || item.item_status === 'refunded') && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            {item.cancel_reason || item.return_reason || 'No action available'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.cod_fee > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>COD Fee:</span>
                  <span>₹{order.cod_fee.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>₹{order.delivery_charge.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900 dark:text-white">
                <span>Total:</span>
                <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Item Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cancel Item</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for cancelling this item.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedItemForCancel(null);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
