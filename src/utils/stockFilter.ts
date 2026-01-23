/**
 * Utility functions for filtering products based on stock availability
 */

import { parseProductSizes } from '@lib/productAvailability';

/**
 * Check if a product has any stock available across all sizes
 * @param product - Product object with sizes field
 * @returns boolean - true if product has at least one size in stock
 */
export const hasAnyStock = (product: any): boolean => {
  if (!product) return false;
  
  // Check if product is active
  if (product.is_active === false) return false;
  
  const sizes = parseProductSizes(product.sizes);
  
  // Check if any size has stock > 0
  return Object.values(sizes).some((stock: number) => stock > 0);
};

/**
 * Filter out products that are completely out of stock
 * @param products - Array of products to filter
 * @returns Array - Products that have at least one size in stock
 */
export const filterInStockProducts = (products: any[]): any[] => {
  if (!products || !Array.isArray(products)) return [];
  
  return products.filter(product => hasAnyStock(product));
};

/**
 * Filter products and ensure a consistent number of results
 * @param products - Array of products to filter
 * @param targetCount - Target number of products to return
 * @returns Array - Filtered products with consistent count
 */
export const filterInStockProductsWithCount = (products: any[], targetCount: number): any[] => {
  const inStockProducts = filterInStockProducts(products);
  return inStockProducts.slice(0, targetCount);
};
