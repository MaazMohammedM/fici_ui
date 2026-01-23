// src/components/CartItemCard.tsx
import React, { useState, useEffect } from "react";
import { Trash2, Minus, Plus, Heart } from "lucide-react";
import { toast } from 'sonner';
import type { CartItem } from "@store/cartStore";
import { useCartStore } from "@store/cartStore";
import { isProductAvailable, parseProductSizes } from '@lib/productAvailability';
import { getAvailableSizes, isProductOutOfStock, isSizeInStock } from '@lib/utils/productValidation';
import { validateCartItemStock } from '@lib/stock/stockValidator';

interface CartItemCardProps {
  item: CartItem;
  onQuantityChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onOpenProduct?: () => void;
  onMoveToWishlist?: (item: CartItem) => void;
  productDetails?: any;
  validationResults?: any;
  // Called when component auto switches size (so parent can track pending acknowledgement)
  onAutoSwitch?: (id: string) => void;
  // Called after user dismisses informational overlay about auto switch
  onInfoAcknowledged?: (id: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onQuantityChange, onRemove, onOpenProduct, onMoveToWishlist, productDetails, validationResults, onAutoSwitch, onInfoAcknowledged }) => {
  const { updateSize } = useCartStore();

  // Local UI state
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [autoSwitchInfo, setAutoSwitchInfo] = useState<{prevSize:string,newSize:string}|null>(null);
  const [infoDismissed, setInfoDismissed] = useState(false);

  // Automatically switch to first available size if selected size is out of stock but other sizes are available
  useEffect(() => {
    if (productDetails) {
      const stock = validateCartItemStock(productDetails, {
        size: item.size,
        quantity: item.quantity,
      });

      const available = stock.availableSizes.length
        ? stock.availableSizes
        : Array.isArray(getAvailableSizes(productDetails)) ? getAvailableSizes(productDetails) : [];

      const currentInStock = stock.selectedSizeInStock;

      if (!currentInStock && available.length > 0) {
        const newSize = stock.autoSwitched && stock.selectedSize !== item.size
          ? stock.selectedSize
          : available[0];
        if (newSize && newSize !== item.size) {
          updateSize(item.id, newSize);
          // store info for overlay
          setAutoSwitchInfo({ prevSize: item.size, newSize });
          setInfoDismissed(false);
          toast.info(`Size ${item.size} was unavailable. Switched to size ${newSize}.`);
          // Hide warning overlay
          setOverlayDismissed(true);
          onAutoSwitch?.(item.id);
        }
      }

      if (currentInStock) {
        // Reset dismiss flag if problem resolved
        setOverlayDismissed(false);
      }
    }
  }, [productDetails, item.size, item.quantity, item.id, updateSize, onAutoSwitch]);

  const handleSizeChange = (newSize: string) => {
    updateSize(item.id, newSize);
  };

  const handleMoveToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveToWishlist?.(item);
  };

  
  // Use utility methods to get current availability
  let availableSizes: string[] = [];
  let isCompletelyOutOfStock = false;
  let isCurrentSizeInStock = true;
  
  if (productDetails) {
    // Use canonical stock validator when we have fresh product details
    const stock = validateCartItemStock(productDetails, {
      size: item.size,
      quantity: item.quantity,
    });

    availableSizes = stock.availableSizes.length
      ? stock.availableSizes
      : Array.isArray(getAvailableSizes(productDetails)) ? getAvailableSizes(productDetails) : [];
    isCompletelyOutOfStock = isProductOutOfStock(productDetails);
    isCurrentSizeInStock = stock.selectedSizeInStock;
  } else {
    // Fallback: parse sizes from product data if available, otherwise use cart item's availableSizes
    if (productDetails && productDetails.sizes) {
      const parsedSizes = parseProductSizes(productDetails.sizes);
      availableSizes = Object.keys(parsedSizes).filter(size => parsedSizes[size] > 0);
      isCompletelyOutOfStock = availableSizes.length === 0;
      isCurrentSizeInStock = parsedSizes[item.size] > 0;
    } else {
      // Last resort: use cart item's stored availableSizes
      availableSizes = Array.isArray(item.availableSizes) ? item.availableSizes : [];
      isCompletelyOutOfStock = availableSizes.length === 0;
      isCurrentSizeInStock = availableSizes.includes(item.size);
    }
  }
  
  // --- SHARED JSX COMPONENTS ---
  
  // Product image with overlay
  const renderProductImage = () => (
    <div className="relative w-24 h-24 flex-shrink-0">
      {renderInfoOverlay()}
      <img
        src={item.image}
        alt={item.name}
        className="w-full h-full object-cover rounded-lg"
      />

      {(!overlayDismissed && (isCurrentSizeOutOfStock || isInactive || isCompletelyOutOfStock)) && (
        <span className="absolute bottom-1 left-1 right-1 text-center text-xs bg-red-600 text-white rounded py-0.5 sm:hidden">
          {isInactive ? "Inactive" : isCompletelyOutOfStock ? "Out of Stock" : "Size Out of Stock"}
        </span>
      )}
      
      {/* Desktop overlay */}
      {(!overlayDismissed && (isCurrentSizeOutOfStock || isInactive || isCompletelyOutOfStock)) && (
        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center hidden sm:flex">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOverlayDismissed(true); }}
            className="absolute top-1 right-1 text-white text-lg leading-none px-1"
            aria-label="Dismiss message"
          >
            ×
          </button>
          <div className="text-white text-center">
            <div className="bg-red-500 px-2 py-1 rounded text-xs font-medium">
              {isInactive ? 'Inactive' : isCompletelyOutOfStock ? 'Out of Stock' : 'Size Out of Stock'}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Product info (name, color, size selector)
  const renderProductInfo = () => (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold leading-snug line-clamp-2 sm:text-lg sm:mb-2 sm:text-[color:var(--color-text-light)] sm:dark:text-[color:var(--color-text-dark)]">
        {item.name}
      </h3>
      
      <p className="text-xs text-gray-500 mt-1 sm:hidden">
        Color: {item.color}
      </p>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2 hidden sm:flex">
        <span>Color: {item.color}</span>
        {(!overlayDismissed && (isCurrentSizeOutOfStock || isInactive || isCompletelyOutOfStock)) && (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">
            {isInactive ? 'Inactive' : isCompletelyOutOfStock ? 'Out of Stock' : 'Size Out of Stock'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1 sm:mt-0 sm:gap-4 sm:flex-nowrap">
        <span className="text-xs sm:text-sm">Size:</span>
        {shouldShowSizeSelector ? (
          <select
            value={item.size}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              handleSizeChange(e.target.value);
            }}
            className="border rounded px-2 py-1 text-xs sm:bg-white sm:dark:bg-dark2 sm:border sm:border-gray-300 sm:dark:border-gray-600 sm:px-2 sm:py-1 sm:text-sm sm:focus:outline-none sm:focus:ring-2 sm:focus:ring-primary"
          >
            {Array.isArray(availableSizes) && availableSizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs sm:text-sm">{item.size}</span>
        )}
      </div>
    </div>
  );

  // Price display (MRP, selling price, discount badge)
  const renderPriceDisplay = () => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 line-through">
          ₹{item.mrp}
        </span>
        <span className="text-lg font-bold text-primary">
          ₹{item.price}
        </span>
      </div>
      {item.discount_percentage > 0 && (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded whitespace-nowrap flex-shrink-0 inline-block w-fit">
          {item.discount_percentage}% OFF
        </span>
      )}
    </div>
  );

  // Quantity controls
  const renderQuantityControls = () => (
    <div className="flex items-center border rounded-lg overflow-hidden sm:border sm:border-gray-300 sm:dark:border-gray-600">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuantityChange(item.id, -1);
        }}
        disabled={isCompletelyOutOfStock}
        className={`px-3 py-2 disabled:opacity-40 sm:p-2 sm:transition-colors ${
          isCompletelyOutOfStock
            ? 'sm:bg-gray-100 sm:text-gray-400 sm:cursor-not-allowed sm:dark:bg-gray-800'
            : 'sm:hover:bg-gray-100 sm:dark:hover:bg-gray-800'
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>

      <span className="px-4 text-sm font-semibold sm:px-4 sm:py-2 sm:text-lg">
        {item.quantity}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuantityChange(item.id, 1);
        }}
        disabled={
          isCompletelyOutOfStock ||
          isCurrentSizeOutOfStock ||
          item.quantity >= availability.availableQty
        }
        className={`px-3 py-2 disabled:opacity-40 sm:p-2 sm:transition-colors ${
          isCompletelyOutOfStock || isCurrentSizeOutOfStock || item.quantity >= availability.availableQty
            ? 'sm:bg-gray-100 sm:text-gray-400 sm:cursor-not-allowed sm:dark:bg-gray-800'
            : 'sm:hover:bg-gray-100 sm:dark:hover:bg-gray-800'
        }`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );

  // Action buttons (wishlist, remove)
  const renderActionButtons = () => (
    <div className="flex gap-2">
      <button
        onClick={handleMoveToWishlist}
        className="p-2 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors sm:p-2 sm:text-pink-500 sm:hover:bg-pink-50 sm:dark:hover:bg-pink-900/20 sm:rounded-lg sm:transition-colors"
        title="Move to Wishlist"
      >
        <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors sm:p-2 sm:text-red-500 sm:hover:bg-red-50 sm:dark:hover:bg-red-900/20 sm:rounded-lg sm:transition-colors"
        title="Remove Item"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );

  // Total price display
  const renderTotalPrice = () => (
    <div className="text-right">
      <div className="text-lg font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
      </div>
    </div>
  );

  // --- INFO OVERLAY RENDER ---
  const renderInfoOverlay = () => {
    if (!autoSwitchInfo || infoDismissed) return null;
    return (
      <div className="absolute inset-0 bg-blue-600/90 rounded-lg flex items-center justify-center z-20">
        <button
          type="button"
          onClick={(e)=>{e.stopPropagation(); setInfoDismissed(true); onInfoAcknowledged?.(item.id);}}
          className="absolute top-1 right-1 text-white text-lg leading-none px-1"
          aria-label="Dismiss info"
        >×</button>
        <p className="text-white text-center text-xs px-2">
          Size {autoSwitchInfo.prevSize} is out of stock. We selected size {autoSwitchInfo.newSize} for you.
        </p>
      </div>
    );
  };

  // Check if current size is in stock using the existing method
  const availability = productDetails ? isProductAvailable(productDetails, item.size, item.quantity) : {
    isActive: true,
    isInStock: isCurrentSizeInStock,
    availableQty: 999
  };
  const isCurrentSizeOutOfStock = !availability.isInStock;
  const isInactive = !availability.isActive;

  // Determine if we should show size selector (only if there are other available sizes)
  const shouldShowSizeSelector = !isCompletelyOutOfStock && availableSizes.length > 1;

  // Unified availability object (memoized per render)
  const availabilityObj = {
    isActive: availability.isActive,
    selectedSize: item.size,
    selectedSizeInStock: !isCurrentSizeOutOfStock,
    availableSizes,
    autoSwitchedSize: !!autoSwitchInfo,
    previousSize: autoSwitchInfo?.prevSize
  };

    
  return (
    <div
      className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 cursor-pointer"
      onClick={() => onOpenProduct && onOpenProduct()}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-4">
        {/* Top Section - Image and Product Info */}
        <div className="flex gap-3">
          {renderProductImage()}
          <div className="flex-1 min-w-0">
            {renderProductInfo()}
          </div>
        </div>

        {/* Price and Total */}
        <div className="flex items-center justify-between">
          {renderPriceDisplay()}
          {renderTotalPrice()}
        </div>

        {/* Quantity and Actions */}
        <div className="flex items-center justify-between">
          {renderQuantityControls()}
          {renderActionButtons()}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-6">
        {renderProductImage()}
        {renderProductInfo()}
        {renderQuantityControls()}
        {renderActionButtons()}
        {renderTotalPrice()}
      </div>
    </div>
  );
};

export default CartItemCard;
