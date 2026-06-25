import React, { useState } from 'react';
import { X, Edit2, Check, X as XIcon } from 'lucide-react';

interface SizeManagerProps {
  sizesList: Record<string, number>;
  sizeInput: string;
  quantityInput: string;
  onSizeInputChange: (value: string) => void;
  onQuantityInputChange: (value: string) => void;
  onAddSize: () => void;
  onRemoveSize: (size: string) => void;
  sizePrices: Record<string, number>;
  onSizePriceChange: (size: string, price: number) => void;
  onSizeQuantityChange: (size: string, quantity: number) => void;
}

const SizeManager: React.FC<SizeManagerProps> = ({
  sizesList,
  sizeInput,
  quantityInput,
  onSizeInputChange,
  onQuantityInputChange,
  onAddSize,
  onRemoveSize,
  sizePrices,
  onSizePriceChange,
  onSizeQuantityChange
}) => {
  const [priceInput, setPriceInput] = useState('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState('');

  const handleAddSize = () => {
    if (sizeInput.trim() && quantityInput.trim() && parseInt(quantityInput) > 0) {
      // If price is provided, set it for the new size
      if (priceInput.trim() && parseFloat(priceInput) > 0) {
        onSizePriceChange(sizeInput.trim(), parseFloat(priceInput));
        setPriceInput('');
      }
      onAddSize();
    }
  };

  const startEditingPrice = (size: string, currentPrice: number) => {
    setEditingPrice(size);
    setTempPrice(currentPrice.toString());
  };

  const savePrice = (size: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      onSizePriceChange(size, newPrice);
    }
    setEditingPrice(null);
    setTempPrice('');
  };

  const cancelEditPrice = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const startEditingQuantity = (size: string, currentQuantity: number) => {
    setEditingQuantity(size);
    setTempQuantity(currentQuantity.toString());
  };

  const saveQuantity = (size: string) => {
    const newQuantity = parseInt(tempQuantity);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      onSizeQuantityChange(size, newQuantity);
    }
    setEditingQuantity(null);
    setTempQuantity('');
  };

  const cancelEditQuantity = () => {
    setEditingQuantity(null);
    setTempQuantity('');
  };
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-white">
        Sizes and Quantities *
      </label>
      
      <div className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-16 gap-3">
          {/* Size input */}
          <input
            type="text"
            placeholder="Size (e.g. 39)"
            value={sizeInput}
            onChange={(e) => onSizeInputChange(e.target.value)}
            className="sm:col-span-4 border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Qty input */}
          <input
            type="number"
            placeholder="Qty"
            value={quantityInput}
            onChange={(e) => onQuantityInputChange(e.target.value)}
            min="0"
            className="sm:col-span-3 border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Price input */}
          <input
            type="number"
            placeholder="Price (optional)"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            min="0"
            step="0.01"
            className="sm:col-span-4 border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Add button */}
          <button
            type="button"
            onClick={handleAddSize}
            disabled={!sizeInput.trim() || !quantityInput.trim() || parseInt(quantityInput) <= 0}
            className="sm:col-span-5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-md transition-colors"
          >
            + Add Size
          </button>
        </div>
      </div>

      {Object.keys(sizesList).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-white">Added Sizes:</p>
          <div className="space-y-2">
            {Object.entries(sizesList).map(([size, qty]) => (
              <div key={size} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Size {size}:</span>
                    {editingQuantity === size ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={tempQuantity}
                          onChange={(e) => setTempQuantity(e.target.value)}
                          min="0"
                          className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          onKeyPress={(e) => e.key === 'Enter' && saveQuantity(size)}
                        />
                        <span className="text-xs text-gray-600">pcs</span>
                        <button
                          type="button"
                          onClick={() => saveQuantity(size)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditQuantity}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{qty} pcs</span>
                        <button
                          type="button"
                          onClick={() => startEditingQuantity(size, qty)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Price:</span>
                    {editingPrice === size ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-20 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          onKeyPress={(e) => e.key === 'Enter' && savePrice(size)}
                        />
                        <button
                          type="button"
                          onClick={() => savePrice(size)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditPrice}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Rs {sizePrices[size] || 'Not set'}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditingPrice(size, sizePrices[size] || 0)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSize(size)}
                  className="text-red-500 hover:text-red-700 transition-colors ml-2"
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