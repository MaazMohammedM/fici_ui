import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface RefundActionPanelProps {
  refundType: 'full' | 'partial';
  setRefundType: (type: 'full' | 'partial') => void;
  refundAmount: string;
  setRefundAmount: (amount: string) => void;
  totalAmount: number;
  processing: boolean;
  onConfirmRefund: () => void;
  orderId?: string;
  paymentMethod?: string;
  razorpayPaymentId?: string;
}

export const RefundActionPanel: React.FC<RefundActionPanelProps> = ({
  refundType,
  setRefundType,
  refundAmount,
  setRefundAmount,
  totalAmount,
  processing,
  onConfirmRefund,
  orderId,
  paymentMethod,
  razorpayPaymentId,
}) => {
  const [reason, setReason] = useState('');
  const [refReference, setRefReference] = useState('');

  // Auto-generate reference ID for Razorpay payments
  useEffect(() => {
    if (paymentMethod === 'razorpay' && razorpayPaymentId) {
      setRefReference(`RZP_REF_${Date.now()}`);
    } else if (paymentMethod === 'cod') {
      setRefReference(`MANUAL_REF_${Date.now()}`);
    }
  }, [paymentMethod, razorpayPaymentId]);

  const handleConfirm = () => {
    const amount = refundType === 'partial' ? parseFloat(refundAmount) : totalAmount;
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }

    if (amount > totalAmount) {
      alert('Refund amount cannot exceed total order amount');
      return;
    }

    if (!reason) {
      alert('Please provide a refund reason');
      return;
    }

    // For Razorpay, reference ID is auto-generated
    // For COD, reference ID can be manually entered
    if (paymentMethod !== 'razorpay' && !refReference) {
      alert('Please provide a refund reference ID');
      return;
    }

    onConfirmRefund();
  };

  return (
    <div className="space-y-4">
      {/* Refund Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Refund Type
        </label>
        <select
          value={refundType}
          onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        >
          <option value="full">Full Refund</option>
          <option value="partial">Partial Refund</option>
        </select>
      </div>

      {/* Refund Amount */}
      {refundType === 'partial' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter custom refund amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
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
      )}

      {refundType === 'full' && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Total Refund Amount:</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Refund Reason */}
      <div>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Refund Reference ID {paymentMethod === 'razorpay' && '(Auto-generated)'}
        </label>
        {paymentMethod === 'razorpay' ? (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-sm font-mono text-gray-900 dark:text-white">{refReference}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Using Razorpay payment ID: {razorpayPaymentId}
            </p>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={refReference}
              onChange={(e) => setRefReference(e.target.value)}
              placeholder="e.g., MANUAL_REF_001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter manual reference number for COD refunds
            </p>
          </>
        )}
      </div>

      {/* Warning */}
      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <p className="text-sm text-orange-900 dark:text-orange-100">
          <strong>⚠️ Warning:</strong> This action will process a refund. Make sure you have initiated the refund
          through your payment gateway before confirming here.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleConfirm}
        disabled={processing || !reason || (paymentMethod !== 'razorpay' && !refReference)}
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
  );
};
