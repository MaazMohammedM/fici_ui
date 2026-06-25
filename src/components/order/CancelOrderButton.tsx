import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Order } from '../../types/order-common';

interface CancelOrderButtonProps {
  order: Order;
  cancellingOrder: boolean;
  onCancelEntireOrder: () => void;
  canCancelOrder: boolean;
  isGuest?: boolean;
}

export const CancelOrderButton: React.FC<CancelOrderButtonProps> = ({
  order,
  cancellingOrder,
  onCancelEntireOrder,
  canCancelOrder,
  isGuest = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    try {
      // Call the parent handler with reason
      await onCancelEntireOrder();
      setShowModal(false);
      setCancelReason('');
      setCancelComments('');
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  if (!canCancelOrder) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={cancellingOrder}
        className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {cancellingOrder ? 'Cancelling...' : 'Cancel Entire Order'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cancel Order
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Cancellation *
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select a reason</option>
                <option value="customer_request">Customer Request</option>
                <option value="out-of-stock">Item Out of Stock</option>
                <option value="quality-issue">Quality Issue</option>
                <option value="shipping-delay">Shipping Delay</option>
                <option value="wrong-item">Wrong Item</option>
                <option value="damaged">Damaged Product</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Comments
              </label>
              <textarea
                value={cancelComments}
                onChange={(e) => setCancelComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any additional information about the cancellation..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancelReason || cancellingOrder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancellingOrder ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
