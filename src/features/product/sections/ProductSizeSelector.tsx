import React from "react";
import { Ruler } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface Props {
  fullSizeRange: string[];
  availableSizes: string[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
  onWhatsAppContact: (size: string) => void;
  onShowSizeGuide: () => void;
  isBag?: boolean;
  isOutOfStock?: boolean;
}

const ProductSizeSelector: React.FC<Props> = ({
  fullSizeRange,
  availableSizes,
  selectedSize,
  onSizeChange,
  onWhatsAppContact,
  onShowSizeGuide,
  isBag = false,
  isOutOfStock = false,
}) => (
  <div className="min-h-[120px]"> {/* Ensure consistent height */}
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-primary dark:text-secondary">
        Size
      </h3>
      <button
        onClick={onShowSizeGuide}
        className="flex items-center space-x-1 text-sm text-accent hover:text-accent/80 transition-colors"
      >
        <Ruler className="w-4 h-4" />
        <span>Size Guide</span>
      </button>
    </div>

    {fullSizeRange.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {fullSizeRange.map((size) => {
          const isAvailable = availableSizes.includes(size);
          const isSelected = selectedSize === size;

          return (
            <button
              key={size}
              onClick={() =>
                isAvailable ? onSizeChange(size) : onWhatsAppContact(size)
              }
              className={`px-4 py-2 rounded-lg border-2 transition-colors relative min-w-[44px] ${
                isSelected && isAvailable
                  ? "border-accent bg-accent text-white"
                  : isAvailable
                  ? "border-gray-300 dark:border-gray-600 hover:border-accent text-gray-900 dark:text-white bg-white dark:bg-dark2"
                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              }`}
              title={
                !isAvailable
                  ? "Click to contact us on WhatsApp for availability"
                  : ""
              }
            >
              {size}
              {!isAvailable && (
                <FaWhatsapp className="absolute -top-2 -right-2 w-5 h-5 text-green-500 bg-white dark:bg-dark2 rounded-full" />
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
    {fullSizeRange.length === 0 && (
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
        <span className="font-medium text-red-500">Out of stock?</span> Click to
        contact us on WhatsApp for availability
      </span>
    </div>
  </div>
);

export default ProductSizeSelector;