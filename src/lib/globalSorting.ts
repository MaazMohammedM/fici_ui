import type { Product } from '../types/product';
import { calculateStockScore } from '@lib/utils/stockFilter';

interface GlobalSortOptions {
  sortBy?: 'price_low_to_high' | 'price_high_to_low' | 'stock_high_to_low' | null;
  search?: string;
  category?: string[];
  gender?: string[];
  subCategory?: string[];
  sizeFilters?: string[];
}

/**
 * Apply global sorting to all products before pagination
 * This ensures consistent sorting across all pages
 */
export const applyGlobalSorting = (
  allProducts: Product[], 
  options: GlobalSortOptions = {}
): Product[] => {
  let filteredProducts = [...allProducts];

  // Apply text search filter
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.sub_category?.toLowerCase().includes(searchLower)
    );
  }

  // Apply category filter
  if (options.category && options.category.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      options.category!.includes(product.category)
    );
  }

  // Apply gender filter
  if (options.gender && options.gender.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      options.gender!.includes(product.gender)
    );
  }

  // Apply subcategory filter
  if (options.subCategory && options.subCategory.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      options.subCategory!.includes(product.sub_category)
    );
  }

  // Apply size filter (check if any selected size has stock)
  if (options.sizeFilters && options.sizeFilters.length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      if (!product.sizes || typeof product.sizes !== 'object') return false;
      
      return options.sizeFilters!.some((sizeValue: string) => {
        const productSizes = product.sizes;
        return productSizes && 
               productSizes[sizeValue] !== undefined && 
               productSizes[sizeValue] > 0;
      });
    });
  }

  // Apply global sorting
  return filteredProducts.sort((a, b) => {
    // Priority 1: Price sorting (if specified) - takes precedence over stock
    if (options.sortBy === 'stock_high_to_low') {
      const aStockScore = calculateStockScore(a);
      const bStockScore = calculateStockScore(b);
      return bStockScore - aStockScore; // Highest stock first
    } else if (options.sortBy === 'price_low_to_high') {
      const aPrice = parseFloat(String(a.discount_price)) || 0;
      const bPrice = parseFloat(String(b.discount_price)) || 0;
      return aPrice - bPrice;
    } else if (options.sortBy === 'price_high_to_low') {
      const aPrice = parseFloat(String(a.discount_price)) || 0;
      const bPrice = parseFloat(String(b.discount_price)) || 0;
      return bPrice - aPrice;
    }
    
    // Priority 2: Stock availability (in-stock first) - only when no price sort specified
    const aHasStock = a.sizes && typeof a.sizes === 'object' && 
      Object.values(a.sizes).some((quantity: number) => typeof quantity === 'number' && quantity > 0);
    
    const bHasStock = b.sizes && typeof b.sizes === 'object' && 
      Object.values(b.sizes).some((quantity: number) => typeof quantity === 'number' && quantity > 0);
    
    // If A has stock and B doesn't, A comes first
    if (aHasStock && !bHasStock) {
      return -1;
    }
    
    // If B has stock and A doesn't, B comes first
    if (!aHasStock && bHasStock) {
      return 1;
    }
    
    // Priority 3: Default (newest first)
    return 0; // Maintain original order from database (created_at desc)
  });
};

/**
 * Paginate globally sorted products
 */
export const paginateProducts = (
  sortedProducts: Product[],
  page: number,
  itemsPerPage: number
): Product[] => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return sortedProducts.slice(startIndex, endIndex);
};
