/**
 * Utility functions for product validation
 */

import { parseProductSizes } from '@lib/productAvailability';
import { validateCartItemStock, type ValidateCartItemStockResult } from '@lib/stock/stockValidator';

export interface Product {
  product_id?: string;
  is_active?: boolean;
  sizes?: string | Record<string, number>;
  size_prices?: Record<string, number> | null;
}

// Use the CartItem type from the store instead of defining our own
export type CartItem = import("@store/cartStore").CartItem;

/**
 * Parse sizes from string or object format
 */
export const parseSizes = (sizes: string | Record<string, number> | undefined): Record<string, number> => {
  return parseProductSizes(sizes);
};

/**
 * Check if a product is active
 */
export const isProductActive = (product: Product): boolean => {
  return product.is_active !== false;
};

/**
 * Check if a specific size is in stock for a product
 */
export const isSizeInStock = (product: Product, size: string): boolean => {
  const sizes = parseSizes(product.sizes);
  const stock = sizes[size];
  return stock !== undefined && stock > 0;
};

/**
 * Get available sizes for a product
 */
export const getAvailableSizes = (product: Product): string[] => {
  const sizes = parseSizes(product.sizes);
  return Object.keys(sizes).filter(size => sizes[size] > 0);
};

/**
 * Check if a product is completely out of stock
 */
export const isProductOutOfStock = (product: Product): boolean => {
  const availableSizes = getAvailableSizes(product);
  return availableSizes.length === 0;
};

/**
 * Validate a cart item - checks if product is active and size is in stock
 */
export const validateCartItem = (item: CartItem, productDetails?: Product): {
  isValid: boolean;
  isInactive: boolean;
  isOutOfStock: boolean;
  errors: string[];
  stock?: ValidateCartItemStockResult;
} => {
  const errors: string[] = [];

  // If we don't have product details yet, treat item as valid for now
  if (!productDetails) {
    return {
      isValid: true,
      isInactive: false,
      isOutOfStock: false,
      errors,
    };
  }

  const stock = validateCartItemStock(productDetails, {
    size: item.size,
    quantity: item.quantity,
  });

  const isInactive = !stock.isActive;
  const hasSizeIssue = stock.issues.includes('SIZE_OUT_OF_STOCK');
  const hasQtyIssue = stock.issues.includes('QUANTITY_EXCEEDED');
  const isOutOfStock = hasSizeIssue || hasQtyIssue || !stock.selectedSizeInStock;

  if (isInactive) {
    errors.push('Product is no longer available');
  }

  if (hasSizeIssue || !stock.selectedSizeInStock) {
    errors.push(`Size ${item.size} is out of stock`);
  }

  if (hasQtyIssue) {
    const available = stock.availableQty;
    if (available > 0) {
      errors.push(
        `Only ${available} available in size ${stock.selectedSize}, but you requested ${item.quantity}`
      );
    } else {
      errors.push('Requested quantity exceeds available stock');
    }
  }

  return {
    isValid: !isInactive && !isOutOfStock,
    isInactive,
    isOutOfStock,
    errors,
    stock,
  };
};

/**
 * Validate multiple cart items
 */
export const validateCartItems = (items: CartItem[], productDetailsMap: Record<string, Product>): {
  validItems: CartItem[];
  invalidItems: CartItem[];
  validationResults: Record<string, ReturnType<typeof validateCartItem>>;
} => {
  const validItems: CartItem[] = [];
  const invalidItems: CartItem[] = [];
  const validationResults: Record<string, ReturnType<typeof validateCartItem>> = {};

  items.forEach(item => {
    const productDetails = productDetailsMap[item.id] || productDetailsMap[item.product_id || ''];
    const validation = validateCartItem(item, productDetails);
    validationResults[item.id] = validation;

    if (validation.isValid) {
      validItems.push(item);
    } else {
      invalidItems.push(item);
    }
  });

  return {
    validItems,
    invalidItems,
    validationResults
  };
};

/**
 * Check if size_prices has valid values
 */
export const hasSizePrices = (sizePrices: Record<string, number> | null | undefined): boolean => {
  if (!sizePrices) return false;
  return Object.keys(sizePrices).length > 0;
};

/**
 * Get size-specific price for a product
 */
export const getSizePrice = (
  product: Product, 
  size: string, 
  discountPrice?: number | null
): number | null => {
  if (product.size_prices && product.size_prices[size]) {
    return product.size_prices[size];
  }
  if (discountPrice && !isNaN(discountPrice)) {
    return discountPrice;
  }
  return null;
};
