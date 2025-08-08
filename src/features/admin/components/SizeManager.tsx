import React from 'react';
import { Plus, X } from 'lucide-react';

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
        Sizes and Quantities
      </label>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={sizeInput}
          onChange={(e) => onSizeInputChange(e.target.value)}
          placeholder="Size (e.g. 39)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="number"
          value={quantityInput}
          onChange={(e) => onQuantityInputChange(e.target.value)}
          placeholder="Qty"
          min="1"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onAddSize}
          disabled={!sizeInput || !quantityInput || parseInt(quantityInput) <= 0}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {Object.keys(sizesList).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-white">Added Sizes:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(sizesList).map(([size, qty]) => (
              <div key={size} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm">Size {size}: {qty}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSize(size)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeManager; 