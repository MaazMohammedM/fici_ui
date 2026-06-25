import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { OrderItem } from '../../types/order-common';
import type { ReplacementReasonCode, ReplacementRequestData } from '../../types/replacement';

interface ReplacementRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: OrderItem | null;
  processingItem: boolean;
  onConfirm: (data: ReplacementRequestData) => void;
  availableSizes?: string[];
}

const REASON_OPTIONS: { value: ReplacementReasonCode; label: string; description: string }[] = [
  {
    value: 'size_mismatch',
    label: 'Size Mismatch',
    description: 'The size doesn\'t fit as expected'
  },
  {
    value: 'damaged',
    label: 'Damaged Item',
    description: 'Item arrived damaged or broken'
  },
  {
    value: 'wrong_item',
    label: 'Wrong Item',
    description: 'Received different item than ordered'
  },
  {
    value: 'quality_issue',
    label: 'Quality Issue',
    description: 'Item has quality or manufacturing defects'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above'
  }
];

export const ReplacementRequestForm: React.FC<ReplacementRequestFormProps> = ({
  isOpen,
  onClose,
  selectedItem,
  processingItem,
  onConfirm,
  availableSizes = []
}) => {
  const [reasonCode, setReasonCode] = useState<ReplacementReasonCode | ''>('');
  const [reason, setReason] = useState('');
  const [requestedSize, setRequestedSize] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReasonCode('');
      setReason('');
      setRequestedSize('');
      setError('');
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    if (!reasonCode) {
      setError('Please select a reason for replacement');
      return false;
    }

    if (reasonCode === 'size_mismatch') {
      if (!requestedSize) {
        setError('Please select the size you want for replacement');
        return false;
      }
      if (requestedSize === selectedItem?.size) {
        setError('Replacement size must be different from current size');
        return false;
      }
    }

    return true;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;

    // Ensure reasonCode is a valid ReplacementReasonCode
    if (!reasonCode) return;

    const requestData: ReplacementRequestData = {
      reason_code: reasonCode as ReplacementReasonCode,
      reason: reason.trim() || null,
      requested_size: reasonCode === 'size_mismatch' ? requestedSize : null
    };

    onConfirm(requestData);
  };

  if (!isOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Request Replacement
          </h2>
          <button
            onClick={onClose}
            disabled={processingItem}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <img
              src={selectedItem.thumbnail_url || selectedItem.product_thumbnail_url || ''}
              alt={selectedItem.product_name}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900 dark:text-white">
                {selectedItem.product_name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Size: {selectedItem.size} | Qty: {selectedItem.quantity}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Reason Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for Replacement *
          </label>
          <div className="space-y-2">
            {REASON_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="radio"
                  name="reason"
                  value={option.value}
                  checked={reasonCode === option.value}
                  onChange={(e) => {
                    setReasonCode(e.target.value as ReplacementReasonCode);
                    setError('');
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Size Selection - Only for size_mismatch */}
        {reasonCode === 'size_mismatch' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Size for Replacement *
            </label>
            <select
              value={requestedSize}
              onChange={(e) => {
                setRequestedSize(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select size</option>
              {availableSizes
                .filter(size => size !== selectedItem?.size)
                .map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current size: {selectedItem?.size}
            </p>
          </div>
        )}

        {/* Additional Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Details (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide any additional details about your replacement request..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processingItem}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processingItem || !reasonCode || (reasonCode === 'size_mismatch' && !requestedSize)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {processingItem ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              'Request Replacement'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
