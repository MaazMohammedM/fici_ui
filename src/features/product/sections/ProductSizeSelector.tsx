import React, { useState, useEffect, useRef } from "react";
import ProductQuantitySelector from "./ProductQuantitySelector";
import { Ruler, ChevronDown } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { hasValidSizePrices } from '@lib/productAvailability';
import { trackEvent } from '@utils/ga4Analytics';

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
  product?: {
    product_id?: string;
    name?: string;
  };
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
  product,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displaySizeRange = originalFullSizeRange.length > 0 ? originalFullSizeRange : availableSizes;
  const isFootwear = category?.toLowerCase() === 'footwear' || category?.toLowerCase() === 'shoes' || category?.toLowerCase() === 'sneakers';
  const shouldShowSizeGuide = isFootwear || subCategory?.toLowerCase() === 'shoes' || subCategory?.toLowerCase() === 'sandals';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSizePrice = (size: string): number | null => {
    if (hasValidSizePrices(sizePrices) && sizePrices && sizePrices[size]) {
      return sizePrices[size];
    }
    if (discountPrice && !isNaN(discountPrice)) {
      return discountPrice;
    }
    return null;
  };

  const handleSizeChange = (size: string) => {
    const availableStockForSize = availableQuantities[size] || 0;
    
    if (availableStockForSize === 0) {
      onQuantityChange?.(1);
    } else if (currentQuantity > availableStockForSize && onQuantityChange) {
      onQuantityChange(availableStockForSize);
    }
    
    onSizeChange(size);
    setIsDropdownOpen(false);
    
    // Track size selection
    trackEvent("select_size", {
      product_id: product?.product_id,
      product_name: product?.name,
      size: size,
    });
  };

  const shouldShowSizePrices = hasValidSizePrices(sizePrices);
  const isSelectedSizeAvailable = selectedSize && availableSizes.includes(selectedSize);
  const selectedSizeStock = selectedSize ? (availableQuantities[selectedSize] || 0) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
        isFootwear ? (
          <div className="relative" ref={dropdownRef}>
            <div className="flex flex-wrap items-center gap-4">
              {/* Custom Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="h-8 inline-flex items-center justify-between gap-1.5 px-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 hover:border-accent transition-colors min-w-[80px] sm:min-w-[100px]"
                >
                  <span className="text-gray-900 dark:text-white font-medium text-sm">
                    {selectedSize || 'Size'}
                  </span>
                  <ChevronDown 
                    className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-1 bg-white dark:bg-dark2 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-[80px] sm:min-w-[100px]">
                    {displaySizeRange.map((size) => {
                      const isSelected = selectedSize === size;
                      const sizePrice = getSizePrice(size);

                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`w-full flex items-center justify-center px-2 py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                            isSelected
                              ? 'bg-accent text-white'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <span className="text-sm font-medium">{size}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stock unavailable message - inline */}
              {selectedSize && !availableSizes.includes(selectedSize) && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0 max-[320px]:gap-0.5 max-[320px]:px-1.5">
                  <span className="text-xs text-red-700 dark:text-red-300 whitespace-nowrap max-[320px]:text-xs">
                    Size {selectedSize} unavailable
                  </span>
                  <button
                    onClick={() => onWhatsAppContact(selectedSize)}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors whitespace-nowrap max-[320px]:px-1 max-[320px]:py-0.5"
                  >
                    <FaWhatsapp className="w-3 h-3 max-[320px]:w-2.5 max-[320px]:h-2.5" />
                    <span className="max-[320px]:hidden">Ask us</span>
                  </button>
                </div>
              )}

              {/* Quantity Selector - when size is in stock */}
              {isSelectedSizeAvailable && selectedSizeStock > 0 && (
                <div className="flex-shrink-0">
                  <ProductQuantitySelector
                    quantity={currentQuantity}
                    maxQuantity={selectedSizeStock}
                    onQuantityChange={onQuantityChange ?? (() => {})}
                    className="h-8 scale-75"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            {/* Size Buttons Container */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              {displaySizeRange.map((size) => {
                const isAvailable = availableSizes.includes(size);
                const isSelected = selectedSize === size;
                const availableQty = availableQuantities[size] || 0;
                const sizePrice = getSizePrice(size);

                return (
                  <button
                    key={size}
                    onClick={() => handleSizeChange(size)}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all min-w-[60px] sm:min-w-[70px] h-10 ${
                      isSelected && isAvailable
                        ? "border-accent bg-accent text-white"
                        : isSelected && !isAvailable
                        ? "border-accent bg-accent text-white"
                        : isAvailable
                        ? "border-gray-300 dark:border-gray-600 hover:border-accent text-gray-900 dark:text-white bg-white dark:bg-dark2"
                        : "border-gray-300 dark:border-gray-600 hover:border-accent text-gray-900 dark:text-white bg-white dark:bg-dark2"
                    }`}
                    title={
                      !isAvailable
                        ? `Size ${size} is currently unavailable. Select to inquire on WhatsApp` 
                        : shouldShowSizePrices && sizePrice ? `Price: ₹${sizePrice.toLocaleString('en-IN')}` : 'Select this size'
                    }
                  >
                    <span className="text-sm font-medium">{size}</span>
                    {shouldShowSizePrices && sizePrice && (
                      <span className={`text-xs mt-0.5 ${
                        isSelected && isAvailable
                          ? "text-white/90"
                          : isSelected && !isAvailable
                          ? "text-white/90"
                          : isAvailable
                          ? "text-gray-600 dark:text-gray-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}>
                        ₹{sizePrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stock unavailable message - inline */}
            {selectedSize && !availableSizes.includes(selectedSize) && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0 h-10">
                <span className="text-sm text-red-700 dark:text-red-300 whitespace-nowrap">
                  Size {selectedSize} unavailable
                </span>
                <button
                  onClick={() => onWhatsAppContact(selectedSize)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors whitespace-nowrap"
                >
                  <FaWhatsapp className="w-3 h-3" />
                  <span>Ask us</span>
                </button>
              </div>
            )}

            {/* Quantity Selector - inline */}
            {isSelectedSizeAvailable && selectedSizeStock > 0 && (
              <div className="flex-shrink-0">
                <ProductQuantitySelector
                  quantity={currentQuantity}
                  maxQuantity={selectedSizeStock}
                  onQuantityChange={onQuantityChange ?? (() => {})}
                  className="h-10 scale-75"
                />
              </div>
            )}
          </div>
        )
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

      {displaySizeRange.length === 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-center text-blue-700 dark:text-blue-300">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium">Please select a color to see available sizes</span>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2 mt-6">
        <FaWhatsapp className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
        <span>
          <span className="font-medium text-red-500">Need help?</span> Select a size to see availability or inquire on WhatsApp
        </span>
      </div>
    </div>
  );
};

export default ProductSizeSelector;