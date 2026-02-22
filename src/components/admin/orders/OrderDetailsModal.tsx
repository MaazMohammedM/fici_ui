import React from 'react';
import { XCircle } from 'lucide-react';
import type { Order, OrderItem, PaymentMethod, PaymentStatus } from '../../../types/order-common';
import { getThumbnailUrl } from '../../../lib/utils/imageOptimization';
import { canRefundOrder } from '../../../types/order-common';
import { useOrderLevelActionStates } from '../../../hooks/useOrderActionStates';
import { isShippingAddress, canCancelOrderItem } from '../../../utils/adminOrderUtils';
import { ConfirmActionModal } from './AdminOrderUIComponents';
import AlertModal from '../../ui/AlertModal';
import type { AlertModalState, ConfirmActionState } from '../../../types/adminOrders';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, action: string, data?: Record<string, unknown>) => void;
  onShipOrder: (order: Order) => void;
  setConfirmAction: React.Dispatch<React.SetStateAction<ConfirmActionState | null>>;
  confirmAction: ConfirmActionState | null;
  showCancelModal: boolean;
  setShowCancelModal: React.Dispatch<React.SetStateAction<boolean>>;
  cancelReason: string;
  setCancelReason: React.Dispatch<React.SetStateAction<string>>;
  cancelComments: string;
  setCancelComments: React.Dispatch<React.SetStateAction<string>>;
  selectedItemsForCancel: string[];
  setSelectedItemsForCancel: React.Dispatch<React.SetStateAction<string[]>>;
  processingAction: string | null;
  alertModal: AlertModalState;
  setAlertModal: React.Dispatch<React.SetStateAction<AlertModalState>>;
  user: { id?: string } | null;
  fetchOrders: () => Promise<void>;
  onOpenRefundModal: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onShipOrder,
  setConfirmAction,
  confirmAction,
  showCancelModal,
  setShowCancelModal,
  cancelReason,
  setCancelReason,
  cancelComments,
  setCancelComments,
  selectedItemsForCancel,
  setSelectedItemsForCancel,
  processingAction,
  alertModal,
  setAlertModal,
  user,
  fetchOrders,
  onOpenRefundModal,
}) => {
  const orderItems = (order.order_items || []).map((item) => ({
    ...item,
    order_item_id: item.order_item_id || '',
    item_status: item.item_status || 'pending',
  }));

  const { canShip, canDeliver } = useOrderLevelActionStates(
    order.payment_method as PaymentMethod,
    order.payment_status as PaymentStatus,
    orderItems.map((item) => ({
      item_status: item.item_status,
      delivered_at: item.delivered_at,
      order_item_id: item.order_item_id,
    }))
  );

  const canRefund = canRefundOrder(order);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-dark2 rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 p-6">
            <h3 className="text-lg sm:text-xl font-semibold">Order Details</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="px-6 pb-6">
            {/* Order & Customer info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Information</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <p><strong>Order ID:</strong> {order.order_id}</p>
                  <p>
                    <strong>Date & Time:</strong>{' '}
                    {new Date(order.order_date).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p><strong>Type:</strong> {order.order_type}</p>
                  <p><strong>Payment Method:</strong> {order.payment_method}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Payment Status:</strong> {order.payment_status}</p>
                  <p><strong>Order Status:</strong> {order.order_status || 'N/A'}</p>
                  <p>
                    <strong>Comments:</strong>{' '}
                    {order.order_status === 'delivery_too_slow' ? 'delivery late' : order.comments || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Customer Information</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  {order.user_id ? (
                    <p><strong>Customer:</strong> Registered User</p>
                  ) : (
                    <>
                      <p><strong>Email:</strong> {order.guest_email}</p>
                      <p><strong>Phone:</strong> {order.guest_phone}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Shipping Address</h4>
              <div className="bg-gray-50 dark:bg-dark3 p-4 rounded-lg text-xs sm:text-sm">
                {isShippingAddress(order.shipping_address) ? (
                  <>
                    <p className="font-medium">{order.shipping_address.name || 'N/A'}</p>
                    <p>{order.shipping_address.address || 'N/A'}</p>
                    <p>
                      {order.shipping_address.city || 'N/A'},
                      {order.shipping_address.district ? ` ${order.shipping_address.district},` : ''}
                      {' '}{order.shipping_address.state || 'N/A'} - {order.shipping_address.pincode || 'N/A'}
                    </p>
                    <p>Phone: {order.shipping_address.phone || 'N/A'}</p>
                  </>
                ) : typeof order.shipping_address === 'string' ? (
                  <p>{order.shipping_address || 'N/A'}</p>
                ) : (
                  <p>N/A</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Items</h4>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <img
                      src={getThumbnailUrl(item.thumbnail_url)}
                      alt={item.product_name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{item.product_name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Size: {item.size} • Qty: {item.quantity} • ₹{item.price_at_purchase}
                      </p>
                    </div>
                    <p className="font-medium text-sm sm:text-base flex-shrink-0">
                      ₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-gray-50 dark:bg-dark3 rounded-lg mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Summary</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings:</span>
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
                <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 text-sm sm:text-base"
              >
                Close
              </button>

              {canShip && (
                <button
                  onClick={() => onShipOrder(order)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Ship Order
                </button>
              )}

              {canDeliver && (
                <button
                  onClick={() => onUpdateStatus(order.order_id, 'deliver')}
                  disabled={processingAction === `${order.order_id}-deliver`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
                >
                  {processingAction === `${order.order_id}-deliver` ? 'Processing...' : 'Mark as Delivered'}
                </button>
              )}

              {canRefund && (
                <button
                  onClick={() => onOpenRefundModal(order)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm sm:text-base"
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        confirmAction={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            onUpdateStatus(confirmAction.orderId, confirmAction.action);
            setConfirmAction(null);
          }
        }}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
      />
    </>
  );
};
