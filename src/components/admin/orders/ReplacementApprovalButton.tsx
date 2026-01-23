import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ReplacementApprovalButtonProps {
  item: any;
  processingAction: string | null;
  onApproveReplacement: () => void;
}

export const ReplacementApprovalButton: React.FC<ReplacementApprovalButtonProps> = ({
  item,
  processingAction,
  onApproveReplacement,
}) => {
  const [showModal, setShowModal] = useState(false);

  const isProcessing = processingAction === `replacement-${item.order_item_id}-approve`;

  const handleApprove = () => {
    onApproveReplacement();
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isProcessing}
        className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
      >
        {isProcessing ? (
          <>
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="w-3 h-3" />
            Approve Replacement
          </>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Approve Replacement
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Info */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <img
                  src={item.thumbnail_url || item.product_thumbnail_url || ''}
                  alt={item.product_name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Size: {item.size} | Qty: {item.quantity}
                  </p>
                  {item.replacement_reason && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <strong>Reason:</strong> {item.replacement_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to approve this replacement request? This action will initiate the replacement process for the customer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Approve Replacement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
