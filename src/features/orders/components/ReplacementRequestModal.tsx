import React from 'react';
import { X } from 'lucide-react';

interface OrderItem {
  order_item_id: string;
  product_name: string;
  product_thumbnail_url?: string;
  thumbnail_url?: string;
  size?: string;
  color?: string;
  price_at_purchase?: number;
  quantity?: number;
}

interface ReplacementRequestModalProps {
  isOpen: boolean;
  selectedItem: OrderItem | null;
  replacementReason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  processing: boolean;
}

export const ReplacementRequestModal: React.FC<ReplacementRequestModalProps> = ({
  isOpen,
  selectedItem,
  replacementReason,
  onReasonChange,
  onSubmit,
  onClose,
  processing
}) => {
  if (!isOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Request Replacement</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex gap-3">
          <img 
            src={selectedItem.product_thumbnail_url || selectedItem.thumbnail_url} 
            alt={selectedItem.product_name} 
            className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-600" 
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{selectedItem.product_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedItem.size && `Size: ${selectedItem.size}`}
              {selectedItem.color && ` • ${selectedItem.color}`}
            </p>
            <p className="text-sm font-medium mt-1">
              ₹{((selectedItem.price_at_purchase || 0) * (selectedItem.quantity || 1)).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason *</label>
          <textarea
            value={replacementReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Describe the reason for replacement..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none text-sm"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={processing || !replacementReason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {processing ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
