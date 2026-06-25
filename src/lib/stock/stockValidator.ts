// src/lib/stock/stockValidator.ts
// Canonical stock validation for cart items across product, cart and checkout flows

import { parseProductSizes } from '../productAvailability';

export type StockIssue =
  | 'PRODUCT_INACTIVE'
  | 'SIZE_OUT_OF_STOCK'
  | 'QUANTITY_EXCEEDED';

export interface ValidateCartItemStockResult {
  isActive: boolean;
  selectedSize: string;
  selectedSizeInStock: boolean;
  availableSizes: string[];
  availableQty: number;
  autoSwitched: boolean;
  previousSize?: string;
  issues: StockIssue[];
}

/**
 * Validates the stock state for a cart item.
 *
 * product: row from `products` table (or equivalent), expected fields:
 *   - is_active?: boolean
 *   - sizes?: string | Record<string, number>
 *
 * cartItem: cart representation, expected fields:
 *   - selectedSize or size
 *   - quantity
 */
export function validateCartItemStock(
  product: any,
  cartItem: any
): ValidateCartItemStockResult {
  const selectedSize: string =
    cartItem?.selectedSize ?? cartItem?.size ?? '';
  const requestedQty: number =
    typeof cartItem?.quantity === 'number' && cartItem.quantity > 0
      ? cartItem.quantity
      : 1;

  const isActive = product?.is_active !== false;
  const sizeMap: Record<string, number> = parseProductSizes(product?.sizes);

  const result: ValidateCartItemStockResult = {
    isActive,
    selectedSize,
    selectedSizeInStock: false,
    availableSizes: [],
    availableQty: 0,
    autoSwitched: false,
    previousSize: undefined,
    issues: [],
  };

  // 1. Product active?
  if (!isActive) {
    result.issues.push('PRODUCT_INACTIVE');
    return result;
  }

  // 2. Compute available sizes from size map
  const allSizes = Object.keys(sizeMap);
  result.availableSizes = allSizes.filter((s) => (sizeMap[s] ?? 0) > 0);

  const currentStock = selectedSize ? sizeMap[selectedSize] ?? 0 : 0;
  result.selectedSizeInStock = !!selectedSize && currentStock > 0;

  // If selected size has no stock, try to auto-switch to first available size
  if (!result.selectedSizeInStock) {
    result.issues.push('SIZE_OUT_OF_STOCK');

    const fallbackSize = result.availableSizes[0];
    if (fallbackSize && fallbackSize !== selectedSize) {
      result.autoSwitched = true;
      result.previousSize = selectedSize;
      result.selectedSize = fallbackSize;
      result.availableQty = sizeMap[fallbackSize] ?? 0;
    } else {
      result.availableQty = 0;
    }

    return result;
  }

  // 3. Quantity enforcement for currently selected size
  result.availableQty = currentStock;
  if (requestedQty > currentStock) {
    result.issues.push('QUANTITY_EXCEEDED');
  }

  return result;
}
