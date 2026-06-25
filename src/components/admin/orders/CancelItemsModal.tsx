import React from 'react';
import { XCircle } from 'lucide-react';
import type { Order, OrderItem } from '../../../types/order-common';
import { getThumbnailUrl } from '../../../lib/utils/imageOptimization';
import { canCancelOrderItem } from '../../../utils/adminOrderUtils';

interface CancelItemsModalProps {
  isOpen: boolean;
  order: Order | null;
  cancelReason: string;
  setCancelReason: (value: string) => void;
  cancelComments: string;
  setCancelComments: (value: string) => void;
  selectedItemsForCancel: string[];
  setSelectedItemsForCancel: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  setAlertModal: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>>;
}

export const CancelItemsModal: React.FC<CancelItemsModalProps> = ({
  isOpen,
  order,
  cancelReason,
  setCancelReason,
  cancelComments,
  setCancelComments,
  selectedItemsForCancel,
  setSelectedItemsForCancel,
  onClose,
  onSubmit,
  setAlertModal,
}) => {
  if (!isOpen || !order) return null;

  const handleSelectAll = () => {
    const cancellable = (order.order_items || [])
      .filter(canCancelOrderItem)
      .map((i) => i.order_item_id);
    setSelectedItemsForCancel(cancellable);
  };

  const handleConfirm = async () => {
    if (!cancelReason || selectedItemsForCancel.length === 0) {
      setAlertModal({
        isOpen: true,
        message: 'Please select items and provide a reason for cancellation',
        type: 'error',
      });
      return;
    }
    await onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Cancel Order Items</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Select the items you want to cancel and provide a reason.
        </p>

        {/* Item list */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Items to Cancel</label>
            <button onClick={handleSelectAll} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Select All
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            {(order.order_items || []).map((item: OrderItem) => {
              const isDisabled = !canCancelOrderItem(item);
              return (
                <label
                  key={item.order_item_id}
                  className={`flex items-center gap-3 p-2 rounded ${
                    isDisabled ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItemsForCancel.includes(item.order_item_id)}
                    disabled={isDisabled}
                    onChange={(e) => {
                      if (isDisabled) return;
                      setSelectedItemsForCancel((prev) =>
                        e.target.checked ? [...prev, item.order_item_id] : prev.filter((id) => id !== item.order_item_id)
                      );
                    }}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <img
                    src={getThumbnailUrl(item.thumbnail_url || item.product_thumbnail_url || '')}
                    alt={item.product_name || 'Product'}
                    className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.product_name || 'Product'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Size: {item.size || 'N/A'} | Qty: {item.quantity} | ₹{item.price_at_purchase || 0}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs mt-0.5 ${
                      item.item_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : item.item_status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : item.item_status === 'shipped'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : item.item_status === 'delivered'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {item.item_status || 'pending'}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a reason</option>
            <option value="customer_request">Customer Request</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="quality_issue">Quality Issue</option>
            <option value="shipping_delay">Shipping Delay</option>
            <option value="wrong_item">Wrong Item</option>
            <option value="damaged">Damaged Product</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Comments
          </label>
          <textarea
            value={cancelComments}
            onChange={(e) => setCancelComments(e.target.value)}
            rows={3}
            placeholder="Any additional information about the cancellation..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedItemsForCancel.length === 0 || !cancelReason}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel {selectedItemsForCancel.length} Item{selectedItemsForCancel.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
