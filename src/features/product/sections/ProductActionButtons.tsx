import React from "react";
import { useCartStore } from '@store/cartStore';
import { trackEvent } from '@utils/ga4Analytics';
import { trackAddToCart, trackBuyNow } from '@utils/productEventTracker';

export interface ProductActionButtonsProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
  isOutOfStock?: boolean;
  isBag?: boolean;
  selectedSize?: string;
  quantity?: number;
  availableQuantity?: number;
  selectedVariant?: any;
  showError?: (message: string) => void;
  product?: {
    product_id?: string;
    name?: string;
    discount_price?: string | number;
    price?: string | number;
  };
}

const ProductActionButtons: React.FC<ProductActionButtonsProps> = ({
  onAddToCart,
  onBuyNow,
  isOutOfStock = false,
  isBag = false,
  selectedSize = '',
  quantity = 1,
  availableQuantity = 0,
  selectedVariant,
  showError,
  product,
}) => {
  const { items } = useCartStore();
  
  // Check if Add to Cart should be disabled
  const isAddToCartDisabled = !selectedSize || availableQuantity <= 0 || (availableQuantity > 0 && quantity > availableQuantity);

  // Mandatory validation function
  const validateBeforeAction = (): boolean => {
    if (!selectedSize) {
      showError?.("Please select a size");
      return false;
    }

    if (availableQuantity <= 0) {
      showError?.("Selected size is out of stock");
      return false;
    }

    // Check what's already in the cart for this specific product/size/color
    const existingItem = items.find(
      item => 
        item.product_id === selectedVariant?.product_id && 
        item.color === String(selectedVariant?.color) && 
        item.size === selectedSize
    );

    const currentCartQuantity = existingItem?.quantity || 0;
    const totalQuantityAfterAdd = currentCartQuantity + quantity;

    if (totalQuantityAfterAdd > availableQuantity) {
      showError?.(`Only ${availableQuantity} item${availableQuantity !== 1 ? 's' : ''} available. You already have ${currentCartQuantity} in cart.`);
      return false;
    }

    if (quantity > availableQuantity) {
      showError?.(`Only ${availableQuantity} item${availableQuantity !== 1 ? 's' : ''} available`);
      return false;
    }

    return true;
  };

  // Safe handlers with validation
  const handleAddToCart = () => {
    if (validateBeforeAction()) {
      onAddToCart();

      // Track add to cart in GA4
      trackEvent("add_to_cart", {
        product_id: product?.product_id,
        product_name: product?.name,
        size: selectedSize,
        quantity: quantity,
        price: product?.discount_price || product?.price,
      });

      // Track add to cart in product_user_events table
      if (product?.product_id && product?.name && selectedVariant) {
        const mrpPrice = typeof selectedVariant.mrp_price === 'number' 
          ? selectedVariant.mrp_price 
          : parseFloat(selectedVariant.mrp_price || '0');
        const sellingPrice = typeof selectedVariant.discount_price === 'number'
          ? selectedVariant.discount_price
          : parseFloat(selectedVariant.discount_price || selectedVariant.mrp_price || '0');

        trackAddToCart({
          product_id: product.product_id,
          article_id: selectedVariant.article_id || product.product_id,
          product_name: product.name,
          category: selectedVariant.category,
          sub_category: selectedVariant.sub_category,
          gender: selectedVariant.gender,
          thumbnail_url: selectedVariant.thumbnail_url || selectedVariant.images?.[0],
        }, selectedSize || null, quantity, mrpPrice, sellingPrice);
      }
    }
  };

  const handleBuyNow = () => {
    if (validateBeforeAction()) {
      // Track buy now in GA4
      trackEvent("buy_now", {
        product_id: product?.product_id,
        product_name: product?.name,
        size: selectedSize,
        quantity: quantity,
        price: product?.discount_price || product?.price,
      });

      // Track buy now in product_user_events table
      if (product?.product_id && product?.name && selectedVariant) {
        const mrpPrice = typeof selectedVariant.mrp_price === 'number'
          ? selectedVariant.mrp_price
          : parseFloat(selectedVariant.mrp_price || '0');
        const sellingPrice = typeof selectedVariant.discount_price === 'number'
          ? selectedVariant.discount_price
          : parseFloat(selectedVariant.discount_price || selectedVariant.mrp_price || '0');

        trackBuyNow({
          product_id: product.product_id,
          article_id: selectedVariant.article_id || product.product_id,
          product_name: product.name,
          category: selectedVariant.category,
          sub_category: selectedVariant.sub_category,
          gender: selectedVariant.gender,
          thumbnail_url: selectedVariant.thumbnail_url || selectedVariant.images?.[0],
        }, selectedSize || null, quantity, mrpPrice, sellingPrice);
      }

      onBuyNow();
    }
  };

  if (isOutOfStock) {
    // For bags, don't show out of stock message here since size selector already handles it
    if (isBag) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            disabled
            className="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center min-h-[44px] whitespace-nowrap"
          >
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to Cart
          </button>

          <button
            disabled
            className="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center min-h-[44px] whitespace-nowrap"
          >
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Buy Now
          </button>
        </div>
      );
    }

    // For non-bag products, show out of stock message
    return (
      <div className="space-y-3">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l6-3m0 0l6 3m-6-3v12" />
            </svg>
            <span className="text-red-700 dark:text-red-300 font-medium">
              Product Out of Stock
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">
            This product is currently unavailable. Please check back later or contact us for availability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Messages based on stock and size selection */}
      {!selectedSize && (
        <div className="text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Select a size
          </p>
        </div>
      )}
      
      {selectedSize && availableQuantity <= 0 && (
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            Out of stock. Select another size.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAddToCart}
          disabled={isAddToCartDisabled}
          className={`flex-1 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center min-h-[44px] whitespace-nowrap ${
            isAddToCartDisabled
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Add to Cart
        </button>

        <button
          onClick={handleBuyNow}
          disabled={isAddToCartDisabled}
          className={`flex-1 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center min-h-[44px] whitespace-nowrap ${
            isAddToCartDisabled
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductActionButtons;
