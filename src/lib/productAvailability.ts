/**
 * Product availability validation utilities
 */

export interface ProductAvailabilityResult {
  isActive: boolean;
  isInStock: boolean;
  availableQty: number;
}

/**
 * Safely parse product sizes from string or object
 */
export const parseProductSizes = (sizes: string | Record<string, number> | undefined | null): Record<string, number> => {
  if (!sizes) return {};
  
  if (typeof sizes === 'string') {
    try {
      // Handle multiple levels of JSON escaping
      let parsed = sizes;
      
      // Keep parsing until we get a non-string result or max attempts reached
      let attempts = 0;
      const maxAttempts = 3;
      
      while (typeof parsed === 'string' && attempts < maxAttempts) {
        // Check if it looks like a JSON string (starts with quotes)
        if (parsed.startsWith('"') && parsed.endsWith('"')) {
          parsed = JSON.parse(parsed);
        } else if (parsed.startsWith('{') || parsed.startsWith('[')) {
          // If it starts with { or [, try parsing directly
          parsed = JSON.parse(parsed);
        } else {
          // If it doesn't look like JSON, break to avoid infinite loops
          break;
        }
        attempts++;
      }
      
      // If we still have a string after max attempts, try one more parse
      if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
        parsed = JSON.parse(parsed);
      }
      
      // Return the parsed result if it's an object, otherwise return empty object
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
      
    } catch (error) {
      console.error('Error parsing product sizes:', error, 'Original sizes:', sizes);
      return {};
    }
  }
  
  return sizes;
};

/**
 * Check if a product is available for a specific size and quantity
 */
export const isProductAvailable = (
  product: any,
  selectedSize?: string,
  requestedQuantity?: number
): ProductAvailabilityResult => {
  // Default values
  const isActive = product?.is_active !== false;
  const sizes = parseProductSizes(product?.sizes);
  const availableQty = selectedSize ? (sizes[selectedSize] ?? 0) : 0;
  
  // Check if product is active
  if (!isActive) {
    return {
      isActive: false,
      isInStock: false,
      availableQty: 0
    };
  }
  
  // Check if size exists and is in stock
  if (!selectedSize) {
    return {
      isActive: true,
      isInStock: false,
      availableQty: 0
    };
  }
  
  const sizeExists = sizes.hasOwnProperty(selectedSize);
  const sizeInStock = sizes[selectedSize] > 0;
  const quantityAvailable = !requestedQuantity || sizes[selectedSize] >= requestedQuantity;
  
  return {
    isActive: true,
    isInStock: sizeExists && sizeInStock && quantityAvailable,
    availableQty: sizes[selectedSize] || 0
  };
};

/**
 * Safely parse size_prices
 */
export const parseSizePrices = (sizePrices: string | Record<string, number> | null | undefined): Record<string, number> | null => {
  if (!sizePrices) return null;
  
  if (typeof sizePrices === 'string') {
    try {
      // Handle multiple levels of JSON escaping (same logic as parseProductSizes)
      let parsed = sizePrices;
      
      // Keep parsing until we get a non-string result or max attempts reached
      let attempts = 0;
      const maxAttempts = 3;
      
      while (typeof parsed === 'string' && attempts < maxAttempts) {
        // Check if it looks like a JSON string (starts with quotes)
        if (parsed.startsWith('"') && parsed.endsWith('"')) {
          parsed = JSON.parse(parsed);
        } else if (parsed.startsWith('{') || parsed.startsWith('[')) {
          // If it starts with { or [, try parsing directly
          parsed = JSON.parse(parsed);
        } else {
          // If it doesn't look like JSON, break to avoid infinite loops
          break;
        }
        attempts++;
      }
      
      // If we still have a string after max attempts, try one more parse
      if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
        parsed = JSON.parse(parsed);
      }
      
      // Return the parsed result if it's an object, otherwise return null
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
      
    } catch (error) {
      console.error('Error parsing size prices:', error, 'Original sizePrices:', sizePrices);
      return null;
    }
  }
  
  return typeof sizePrices === 'object' && sizePrices !== null ? sizePrices : null;
};

/**
 * Check if size_prices has valid values
 */
export const hasValidSizePrices = (sizePrices: string | Record<string, number> | null | undefined): boolean => {
  const parsed = parseSizePrices(sizePrices);
  return parsed !== null && Object.keys(parsed).length > 0;
};
