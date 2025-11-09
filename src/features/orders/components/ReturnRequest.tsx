import React, { useState } from 'react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ReturnRequestProps {
  order: {
    order_id: string;
    order_items: Array<{
      order_item_id: string;
      product_name: string;
      product_id: string;
      size: string;
      quantity: number;
      price_at_purchase: number;
      thumbnail_url: string;
    }>;
    delivered_at: string;
    status: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const ReturnRequest: React.FC<ReturnRequestProps> = ({ order, onClose, onSuccess }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const guestSession = useAuthStore((state) => state.guestSession);

  // Check if return is eligible (within 3 days of delivery)
  const deliveredDate = new Date(order.delivered_at);
  const now = new Date();
  const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
  const isReturnEligible = daysSinceDelivery <= 3;

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item to return');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for return');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create return requests for selected items
      const returnPromises = Array.from(selectedItems).map(itemId =>
        supabase.functions.invoke('manage-returns', {
          body: {
            order_id: order.order_id,
            order_item_id: itemId,
            reason: reason.trim(),
            user_id: user?.id,
            guest_session_id: guestSession?.guest_session_id
          }
        })
      );

      const results = await Promise.all(returnPromises);

      // Check if any failed
      const failures = results.filter(result => result.error);
      if (failures.length > 0) {
        throw new Error(failures[0].error.message || 'Some return requests failed');
      }

      alert(`Return request(s) submitted successfully! Our team will review within 24-48 hours.`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  if (!isReturnEligible) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-dark2 rounded-2xl p-6 max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Return Request</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Return Window Expired</h4>
            <p className="text-gray-600 text-sm">
              Returns must be requested within 3 days of delivery.
              This order was delivered {daysSinceDelivery} days ago.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark2 rounded-2xl p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Request Return</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Eligible for Return</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Returns accepted within 3 days of delivery. Our team will review your request within 24-48 hours.
          </p>
        </div>

        {/* Select Items to Return */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Select Items to Return</h4>
          <div className="space-y-3">
            {order.order_items.map((item) => (
              <div
                key={item.order_item_id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedItems.has(item.order_item_id)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleItemToggle(item.order_item_id)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.order_item_id)}
                    onChange={() => handleItemToggle(item.order_item_id)}
                    className="w-4 h-4 text-primary"
                  />
                  <img
                    src={item.thumbnail_url}
                    alt={item.product_name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      Size: {item.size} • Qty: {item.quantity} • ₹{item.price_at_purchase}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Reason for Return <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="">Select a reason</option>
            <option value="wrong_size">Wrong Size</option>
            <option value="defective">Defective Product</option>
            <option value="wrong_item">Wrong Item Delivered</option>
            <option value="not_as_described">Not as Described</option>
            <option value="changed_mind">Changed Mind</option>
            <option value="other">Other</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedItems.size === 0 || !reason.trim()}
            className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequest;
