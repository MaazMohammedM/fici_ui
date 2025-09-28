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
  onRemoveSize
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-white">
        Sizes and Quantities
      </label>
      
      <div className="mb-4">
  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
    {/* Size input */}
    <input
      type="text"
      placeholder="Size (e.g. 39)"
      className="sm:col-span-5 border rounded-md p-2 w-full"
    />

    {/* Qty input */}
    <input
      type="number"
      placeholder="Qty"
      className="sm:col-span-4 border rounded-md p-2 w-full"
    />

    {/* Add button */}
    <button
      type="button"
      className="sm:col-span-3 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-md"
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