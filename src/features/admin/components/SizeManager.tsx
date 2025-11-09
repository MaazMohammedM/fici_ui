import React from 'react';
import { X } from 'lucide-react';

interface SizeManagerProps {
  sizesList: Record<string, number>;
  sizeInput: string;
  quantityInput: string;
  onSizeInputChange: (value: string) => void;
  onQuantityInputChange: (value: string) => void;
  onAddSize: () => void;
  onRemoveSize: (size: string) => void;
}

const SizeManager: React.FC<SizeManagerProps> = ({
  sizesList,
  sizeInput,
  quantityInput,
  onSizeInputChange,
  onQuantityInputChange,
  onAddSize,
  onRemoveSize
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-white">
        Sizes and Quantities *
      </label>
      
      <div className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Size input */}
          <input
            type="text"
            placeholder="Size (e.g. 39)"
            value={sizeInput}
            onChange={(e) => onSizeInputChange(e.target.value)}
            className="sm:col-span-5 border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Qty input */}
          <input
            type="number"
            placeholder="Qty"
            value={quantityInput}
            onChange={(e) => onQuantityInputChange(e.target.value)}
            min="0"
            className="sm:col-span-4 border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Add button */}
          <button
            type="button"
            onClick={onAddSize}
            disabled={!sizeInput.trim() || !quantityInput.trim() || parseInt(quantityInput) <= 0}
            className="sm:col-span-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-md transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {Object.keys(sizesList).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-white">Added Sizes:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(sizesList).map(([size, qty]) => (
              <div key={size} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <span className="text-sm">Size {size}: {qty}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSize(size)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(sizesList).length === 0 && (
        <p className="text-sm text-red-500">Please add at least one size and quantity</p>
      )}
    </div>
  );
};

export default SizeManager;