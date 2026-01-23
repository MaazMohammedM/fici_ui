/**
 * Utility functions for product-related operations
 */

export interface ParsedSizes {
  sizes: Record<string, number>;
  availableSizes: string[];
  fullSizeRange: string[];
}

/**
 * Parse product sizes from product data
 * Handles both stringified JSON and already parsed objects
 */
export const parseProductSizes = (product: any): ParsedSizes => {
  if (!product || !product.sizes) {
    return { sizes: {}, availableSizes: [], fullSizeRange: [] };
  }
  
  try {
    // Handle both stringified JSON and already parsed object
    let sizesData = product.sizes;
    
    // If it's a string that looks like JSON, parse it
    if (typeof sizesData === 'string') {
      try {
        const parsed = JSON.parse(sizesData);
        sizesData = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      } catch (e) {
        console.error('Error parsing sizes JSON:', e);
        return { sizes: {}, availableSizes: [], fullSizeRange: [] };
      }
    }
    
    // Ensure we have a proper object
    if (typeof sizesData !== 'object' || sizesData === null) {
      return { sizes: {}, availableSizes: [], fullSizeRange: [] };
    }
    
    // Convert all values to numbers and filter out invalid entries
    const sizes: Record<string, number> = {};
    Object.entries(sizesData).forEach(([key, value]) => {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        sizes[key] = Math.max(0, Math.floor(numValue)); // Ensure non-negative integers
      }
    });
    
    // Get available sizes (quantity > 0)
    const availableSizes = Object.entries(sizes)
      .filter(([_, qty]) => qty > 0)
      .map(([size]) => size);
      
    const fullSizeRange = Object.keys(sizes);
    
    return { sizes, availableSizes, fullSizeRange };
  } catch (error) {
    console.error('Error processing product sizes:', error);
    return { sizes: {}, availableSizes: [], fullSizeRange: [] };
  }
};
