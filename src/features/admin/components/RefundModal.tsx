import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';

interface OrderItem {
  order_item_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  thumbnail_url: string;
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  orderId: string;
  onConfirmRefund: (amount: number, reason: string, refReference: string) => void;
  processing: boolean;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  items,
  orderId,
  onConfirmRefund,
  processing,
}) => {
  const [reason, setReason] = useState('');
  const [refReference, setRefReference] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  // Calculate total refund amount
  const totalAmount = items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setReason('');
      setRefReference('');
      setCustomAmount('');
      setUseCustomAmount(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const amount = useCustomAmount ? parseFloat(customAmount) : totalAmount;
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }

    if (!reason) {
      alert('Please provide a refund reason');
      return;
    }

    if (!refReference) {
      alert('Please provide a refund reference ID');
      return;
    }

    onConfirmRefund(amount, reason, refReference);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Process Refund</h3>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Order ID:</strong> #{orderId.slice(-8)}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-100 mt-1">
              <strong>Items to refund:</strong> {items.length}
            </p>
          </div>

          {/* Items List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Items</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.order_item_id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <img
                    src={item.thumbnail_url}
                    alt={item.product_name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Amount */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Refund Amount</h4>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useCustomAmount}
                  onChange={(e) => setUseCustomAmount(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Custom amount</span>
              </label>
            </div>

            {useCustomAmount ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter custom refund amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={totalAmount}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum: ₹{totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Total Refund Amount:</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Refund Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refund Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Refund Reference */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refund Reference ID *
            </label>
            <input
              type="text"
              value={refReference}
              onChange={(e) => setRefReference(e.target.value)}
              placeholder="e.g., RZP_REF_123456 or MANUAL_REF_001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter Razorpay refund ID or manual reference number
            </p>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-900 dark:text-orange-100">
              <strong>⚠️ Warning:</strong> This action will process a refund. Make sure you have initiated the refund
              through your payment gateway before confirming here.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing || !reason || !refReference}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Confirm Refund
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
