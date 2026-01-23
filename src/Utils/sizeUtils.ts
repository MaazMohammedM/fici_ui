/**
 * Reusable utility functions for size handling
 */

/**
 * Get size range based on gender, category, and subcategory
 * Uses predefined ranges for footwear and dynamic fetching for other products
 */
export const getSizeRange = (
  gender?: 'men' | 'women',
  subCategory?: string,
  category?: string,
  availableSizes?: string[]
): string[] => {
  // For footwear (Shoes, Sandals, Slippers), always return predefined ranges
  // This ensures missing sizes are shown in the UI with WhatsApp icons
  if (category === 'Footwear') {
    if (gender === 'women' && (subCategory === 'Shoes' || subCategory === 'Sandals' || subCategory === 'Slippers')) {
      return Array.from({ length: 8 }, (_, i) => (i + 35).toString()); // 35-42
    } 
    
    if (gender === 'men' && (subCategory === 'Shoes' || subCategory === 'Sandals' || subCategory === 'Slippers')) {
      return Array.from({ length: 9 }, (_, i) => (i + 39).toString()); // 39-47
    }
  }
  
  // For bags and accessories, use available sizes from database
  if (category === 'Bags and Accessories') {
    return availableSizes && availableSizes.length > 0 ? availableSizes : [];
  }
  
  // Default case: use available sizes from database
  return availableSizes && availableSizes.length > 0 ? availableSizes : [];
};

/**
 * Get all available sizes for filtering in ProductPage
 * Returns comprehensive size options for men, women, and bags
 */
export const getAllFilterSizes = (): { men: string[], women: string[], bags: string[] } => {
  return {
    men: Array.from({ length: 9 }, (_, i) => (i + 39).toString()), // 39-47
    women: Array.from({ length: 8 }, (_, i) => (i + 35).toString()), // 35-42
    bags: ['14inch', '15inch', '16inch', '17inch', '18inch', '19inch', '20inch', '21inch', '22inch'] // Common bag sizes
  };
};

/**
 * Check if a product is footwear
 */
export const isFootwearProduct = (category?: string, subCategory?: string): boolean => {
  return category === 'Footwear' || 
         ['Shoes', 'Sandals', 'Slippers'].includes(subCategory || '');
};

/**
 * Check if a product is a bag or accessory
 */
export const isBagProduct = (category?: string, subCategory?: string): boolean => {
  return category === 'Bags and Accessories' || 
         ['Bags', 'Accessories'].includes(subCategory || '');
};
