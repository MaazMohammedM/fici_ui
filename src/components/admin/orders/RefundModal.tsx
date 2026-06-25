import React from 'react';
import { DollarSign, X } from 'lucide-react';
import type { Order, OrderItem } from '../../../types/order-common';
import { getThumbnailUrl } from '../../../lib/utils/imageOptimization';
import { RefundActionPanel } from './RefundActionPanel';

interface RefundModalProps {
  isOpen: boolean;
  order: Order | null;
  selectedItemForAction: OrderItem | null;
  refundType: 'full' | 'partial';
  setRefundType: (type: 'full' | 'partial') => void;
  refundAmount: string;
  setRefundAmount: (amount: string) => void;
  processingAction: string | null;
  user: { id?: string } | null;
  onClose: () => void;
  onConfirmRefund: () => Promise<void>;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  order,
  selectedItemForAction,
  refundType,
  setRefundType,
  refundAmount,
  setRefundAmount,
  processingAction,
  user,
  onClose,
  onConfirmRefund,
}) => {
  if (!isOpen || !order) return null;

  const refundableItems = selectedItemForAction
    ? [selectedItemForAction]
    : (order.order_items?.filter(
        (item) =>
          ['cancelled', 'delivered'].includes(item.item_status || '') &&
          item.item_status !== 'refunded'
      ) ?? []);

  const useEffectiveAmount = order.order_items?.length === 1 && order.effective_amount;

  const totalAmount = selectedItemForAction
    ? useEffectiveAmount
      ? order.effective_amount!
      : (selectedItemForAction.price_at_purchase || 0) * (selectedItemForAction.quantity || 1)
    : useEffectiveAmount
    ? order.effective_amount!
    : refundableItems.reduce(
        (sum, item) => sum + (item.price_at_purchase || 0) * (item.quantity || 1),
        0
      );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Process Refund</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Order info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Order ID:</strong> #{order.order_id.slice(-8)}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-100 mt-1">
              <strong>Items to refund:</strong> {refundableItems.length}
            </p>
          </div>

          {/* Items list */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Items</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {refundableItems.map((item) => (
                <div
                  key={item.order_item_id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <img
                    src={getThumbnailUrl(item.thumbnail_url || item.product_thumbnail_url || '')}
                    alt={item.product_name}
                    className="w-12 h-12 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity || 1}</p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ₹{((item.price_at_purchase || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <RefundActionPanel
            refundType={refundType}
            setRefundType={setRefundType}
            refundAmount={refundAmount}
            setRefundAmount={setRefundAmount}
            totalAmount={totalAmount}
            processing={processingAction === 'refund'}
            orderId={order.order_id}
            paymentMethod={order.payment_method}
            razorpayPaymentId={order.razorpay_payment_id}
            onConfirmRefund={onConfirmRefund}
          />
        </div>
      </div>
    </div>
  );
};
