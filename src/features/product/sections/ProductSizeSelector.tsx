import React from "react";
import { Ruler } from "lucide-react";

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
  <div>
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
            className={`px-4 py-2 rounded-lg border-2 transition-colors relative ${
              isSelected && isAvailable
                ? "border-accent bg-accent text-white"
                : isAvailable
                ? "border-gray-300 dark:border-gray-600 hover:border-accent"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
            title={
              !isAvailable
                ? "Click to contact us on WhatsApp for availability"
                : ""
            }
          >
            {size}
            {!isAvailable && (
              <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                !
              </span>
            )}
          </button>
        );
      })}
    </div>
    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="text-red-500">Out of stock sizes:</span> Click to
      contact us on WhatsApp for availability
    </div>
  </div>
);

export default ProductSizeSelector;