import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { OrderItem, Order } from '../../types/order-common';
import { CUSTOMER_CANCEL_REASONS, ADMIN_CANCEL_REASONS } from '../../constants/cancelReasons';
import { useAuthStore } from '../../store/authStore';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customReason?: string) => void;
  type: 'item' | 'order';
  item?: OrderItem;
  order?: Order;
  reason: string;
  onReasonChange: (reason: string) => void;
  comments?: string;
  onCommentsChange?: (comments: string) => void;
  isProcessing?: boolean;
  isAdmin?: boolean;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  item,
  order,
  reason,
  onReasonChange,
  comments = '',
  onCommentsChange,
  isProcessing = false,
  isAdmin = false,
}) => {
  const { user, role } = useAuthStore();
  
  // Determine if this is an admin cancellation
  // Use the same logic as Header component for consistency
  const isUserAdmin = isAdmin || 
    (role?.toLowerCase() === 'admin') || 
    (user?.user_metadata?.role?.toLowerCase() === 'admin');
  const cancelReasons = !isUserAdmin ? ADMIN_CANCEL_REASONS : CUSTOMER_CANCEL_REASONS;
  const [showCustomReasonInput, setShowCustomReasonInput] = useState(false);
  const [customReason, setCustomReason] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {type === 'item' ? 'Cancel Item' : 'Cancel Entire Order'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {type === 'item' && item && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Item to cancel:</p>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Size: {item.size} | Quantity: {item.quantity}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Price: ₹{item.price_at_purchase}
              </p>
            </div>
          </div>
        )}

        {type === 'order' && order && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Order: #{order.order_id.slice(-8)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total Amount: ₹{order.effective_amount || order.total_amount}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Items: {order.order_items?.length || 0}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for cancellation
          </label>
          <select
            value={reason}
            onChange={(e) => {
              const value = e.target.value;
              onReasonChange(value);
              setShowCustomReasonInput(value === 'other');
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a reason</option>
            {cancelReasons.map((reasonOption) => (
              <option key={reasonOption.value} value={reasonOption.value}>
                {reasonOption.label}
              </option>
            ))}
          </select>
        </div>

        {showCustomReasonInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Reason *
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter custom reason for cancellation"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {type === 'order' && onCommentsChange && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => onCommentsChange(e.target.value)}
              placeholder="Any additional information about the cancellation..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(showCustomReasonInput ? customReason : undefined)}
            disabled={isProcessing || !reason || (showCustomReasonInput && !customReason.trim())}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isProcessing 
              ? (type === 'item' ? 'Cancelling...' : 'Cancelling...') 
              : (type === 'item' ? 'Cancel Item' : 'Cancel Order')
            }
          </button>
        </div>
      </div>
    </div>
  );
};
