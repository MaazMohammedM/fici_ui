import React from "react";
import { Ruler } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { hasValidSizePrices } from '@lib/productAvailability';

interface Props {
  fullSizeRange: string[];
  availableSizes: string[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
  onWhatsAppContact: (size: string) => void;
  onShowSizeGuide: () => void;
  isBag?: boolean;
  isOutOfStock?: boolean;
  gender?: 'men' | 'women';
  subCategory?: string;
  category?: string;
  sizePrices?: Record<string, number> | null;
  discountPrice?: number | null;
  availableQuantities: Record<string, number>;
  currentQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
}

const ProductSizeSelector: React.FC<Props> = ({
  fullSizeRange: originalFullSizeRange,
  availableSizes,
  selectedSize,
  onSizeChange,
  onWhatsAppContact,
  onShowSizeGuide,
  isBag = false,
  isOutOfStock = false,
  gender,
  subCategory,
  category,
  sizePrices,
  discountPrice,
  availableQuantities = {},
  currentQuantity = 1,
  onQuantityChange,
}) => {
  // Determine which sizes to display
  const displaySizeRange = originalFullSizeRange.length > 0 ? originalFullSizeRange : availableSizes;
  const isFootwear = category === 'footwear' || category === 'shoes' || category === 'sneakers';
  const shouldShowSizeGuide = isFootwear || subCategory?.toLowerCase() === 'shoes' || subCategory?.toLowerCase() === 'sandals';


  const getSizePrice = (size: string): number | null => {
    // Only show size-specific prices if size_prices has valid values
    if (hasValidSizePrices(sizePrices) && sizePrices && sizePrices[size]) {
      return sizePrices[size];
    }
    // Fall back to discount price if no size-specific prices
    if (discountPrice && !isNaN(discountPrice)) {
      return discountPrice;
    }
    return null;
  };

  // Handle size change with quantity clamping
  const handleSizeChange = (size: string) => {
    const availableStockForSize = availableQuantities[size] || 0;
    
    // Clamp quantity to available stock if needed
    if (currentQuantity > availableStockForSize && availableStockForSize > 0 && onQuantityChange) {
      onQuantityChange(availableStockForSize);
    }
    
    // Call the original size change handler
    onSizeChange(size);
  };

  // Check if we should show size-specific prices
  const shouldShowSizePrices = hasValidSizePrices(sizePrices);

  return (
    <div className="min-h-[120px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-primary dark:text-secondary">
          Size
        </h3>
        <button
          onClick={onShowSizeGuide}
          disabled={!shouldShowSizeGuide}
          className={`flex items-center space-x-1 text-sm transition-colors ${
            shouldShowSizeGuide 
              ? 'text-accent hover:text-accent/80' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title={!shouldShowSizeGuide ? 'Size guide is only available for footwear' : ''}
        >
          <Ruler className="w-4 h-4" />
          <span>Size Guide</span>
        </button>
      </div>

      {isOutOfStock && subCategory !== 'Bags' && displaySizeRange.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-red-500 dark:text-red-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l6-3m0 0l6 3m-6-3v12" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Product Out of Stock</h3>
            <p className="text-sm mb-4">This product is currently unavailable. Please check back later or contact us for availability.</p>
            <button
              onClick={() => onWhatsAppContact('')}
              className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FaWhatsapp className="w-4 h-4" />
              <span>Contact Us</span>
            </button>
          </div>
        </div>
      ) : displaySizeRange && displaySizeRange.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          {displaySizeRange.map((size) => {
            const isAvailable = availableSizes.includes(size);
            const isSelected = selectedSize === size;
            const availableQty = availableQuantities[size] || 0;
            const sizePrice = getSizePrice(size);

            return (
              <button
                key={size}
                onClick={() => isAvailable ? handleSizeChange(size) : onWhatsAppContact(size)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all min-w-[60px] sm:min-w-[70px] ${
                  isSelected && isAvailable
                    ? "border-accent bg-accent text-white"
                    : isAvailable
                    ? "border-gray-300 dark:border-gray-600 hover:border-accent text-gray-900 dark:text-white bg-white dark:bg-dark2"
                    : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 cursor-pointer"
                }`}
                title={
                  !isAvailable
                    ? `Size ${size} is currently unavailable. Would you like to inquire about this size on WhatsApp? We'll notify you as soon as it's back in stock.`
                    : shouldShowSizePrices && sizePrice ? `Price: ₹${sizePrice.toLocaleString('en-IN')}` : 'Select this size'
                }
              >
                <span className="text-sm font-medium">{size}</span>
                {shouldShowSizePrices && sizePrice && (
                  <span className={`text-xs mt-0.5 ${
                    isSelected && isAvailable
                      ? "text-white/90"
                      : isAvailable
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    ₹{sizePrice.toLocaleString('en-IN')}
                  </span>
                )}
                {!isAvailable && (
                  <FaWhatsapp className="absolute -top-1 -right-1 w-4 h-4 text-green-500 bg-white dark:bg-dark2 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      ) : isBag && isOutOfStock ? (
        <div className="flex items-center justify-center py-8 text-red-500 dark:text-red-400">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l6-3m0 0l6 3m-6-3v12" />
            </svg>
            <p className="text-sm font-medium">Out of Stock</p>
            <p className="text-xs mt-1">This bag is currently unavailable</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Ruler className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sizes available</p>
            <p className="text-xs mt-1">Please select a color first</p>
          </div>
        </div>
      )}

      {/* Prominent message for when no sizes are available */}
      {displaySizeRange.length === 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-center text-blue-700 dark:text-blue-300">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium">Please select a color to see available sizes</span>
          </div>
        </div>
      )}

      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center">
        <FaWhatsapp className="w-4 h-4 inline-block mr-2 text-green-500" />
        <span>
          <span className="font-medium text-red-500">Size unavailable?</span> Click on the unavailable size to
          inquire on WhatsApp
        </span>
      </div>
    </div>
  );
};

export default ProductSizeSelector;