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
}

const ProductSizeSelector: React.FC<Props> = ({
  fullSizeRange,
  availableSizes,
  selectedSize,
  onSizeChange,
  onWhatsAppContact,
  onShowSizeGuide,
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
    ) : (
      <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Ruler className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No sizes available</p>
          <p className="text-xs mt-1">Please select a color first</p>
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