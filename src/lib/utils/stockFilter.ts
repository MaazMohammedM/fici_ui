/**
 * Utility functions for filtering products based on stock availability
 * and smart related product matching
 */

import { parseProductSizes } from '../productAvailability';

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

/**
 * Calculate stock score for a product (higher = better inventory)
 * @param product - Product object
 * @returns number - Stock score (0-100)
 */
export const calculateStockScore = (product: any): number => {
  if (!hasAnyStock(product)) return 0;
  
  const sizes = parseProductSizes(product.sizes);
  const totalStock = Object.values(sizes).reduce((sum: number, stock: number) => sum + stock, 0);
  const sizesInStock = Object.values(sizes).filter((stock: number) => stock > 0).length;
  
  // Score based on total stock and variety of sizes
  const stockScore = Math.min(totalStock * 2, 60); // Max 60 points for stock quantity
  const varietyScore = Math.min(sizesInStock * 10, 40); // Max 40 points for size variety
  
  return stockScore + varietyScore;
};

/**
 * Calculate price similarity score (0-100, higher = more similar)
 * @param price1 - First product price
 * @param price2 - Second product price
 * @returns number - Similarity score
 */
export const calculatePriceSimilarity = (price1: number, price2: number): number => {
  if (!price1 || !price2) return 0;
  
  const priceDiff = Math.abs(price1 - price2);
  const avgPrice = (price1 + price2) / 2;
  const priceDiffPercent = (priceDiff / avgPrice) * 100;
  
  // 100% similarity for same price, decreases as difference increases
  return Math.max(0, 100 - priceDiffPercent);
};

/**
 * Calculate category match score
 * @param category1 - First product category
 * @param category2 - Second product category
 * @param subCategory1 - First product subcategory
 * @param subCategory2 - Second product subcategory
 * @returns number - Category match score (0-100)
 */
export const calculateCategoryMatch = (
  category1: string, 
  category2: string, 
  subCategory1?: string, 
  subCategory2?: string
): number => {
  let score = 0;
  
  // Exact category match
  if (category1 && category2 && category1.toLowerCase() === category2.toLowerCase()) {
    score += 50;
  }
  
  // Exact subcategory match
  if (subCategory1 && subCategory2 && subCategory1.toLowerCase() === subCategory2.toLowerCase()) {
    score += 50;
  }
  
  return score;
};

/**
 * Smart related product matching based on Myntra-like algorithm
 * @param currentProduct - The current product
 * @param allProducts - All available products to match against
 * @param targetCount - Target number of related products
 * @returns Array - Smartly matched related products
 */
export const getSmartRelatedProducts = (
  currentProduct: any, 
  allProducts: any[], 
  targetCount: number = 12
): any[] => {
  if (!currentProduct || !allProducts || !Array.isArray(allProducts)) {
    return [];
  }
  
  // Filter out the current product and out-of-stock items
  const candidateProducts = allProducts.filter(
    product => product.article_id !== currentProduct.article_id && hasAnyStock(product)
  );
  
  // Score each candidate product
  const scoredProducts = candidateProducts.map(product => {
    let totalScore = 0;
    
    // Category matching (40% weight)
    const categoryScore = calculateCategoryMatch(
      currentProduct.category,
      product.category,
      currentProduct.sub_category,
      product.sub_category
    );
    totalScore += categoryScore * 0.4;
    
    // Price similarity (25% weight)
    const priceScore = calculatePriceSimilarity(
      Number(currentProduct.discount_price || currentProduct.mrp_price),
      Number(product.discount_price || product.mrp_price)
    );
    totalScore += priceScore * 0.25;
    
    // Stock score (20% weight) - prioritize products with better inventory
    const stockScore = calculateStockScore(product);
    totalScore += stockScore * 0.2;
    
    // Brand matching (15% weight)
    const brandScore = currentProduct.brand && product.brand && 
      currentProduct.brand.toLowerCase() === product.brand.toLowerCase() ? 100 : 0;
    totalScore += brandScore * 0.15;
    
    return {
      ...product,
      _relatedScore: totalScore
    };
  });
  
  // Sort by score (highest first) and return top matches
  return scoredProducts
    .sort((a, b) => b._relatedScore - a._relatedScore)
    .slice(0, targetCount)
    .map(({ _relatedScore, ...product }) => product); // Remove score field
};

/**
 * Fallback logic for related products when smart matching returns insufficient results
 * @param currentProduct - The current product
 * @param allProducts - All available products
 * @param smartRelated - Results from smart matching
 * @param targetCount - Target number of products
 * @returns Array - Combined related products with fallbacks
 */
export const getRelatedProductsWithFallback = (
  currentProduct: any,
  allProducts: any[],
  smartRelated: any[],
  targetCount: number = 12
): any[] => {
  if (smartRelated.length >= targetCount) {
    return smartRelated.slice(0, targetCount);
  }
  
  const remainingCount = targetCount - smartRelated.length;
  const usedIds = new Set([currentProduct.article_id, ...smartRelated.map(p => p.article_id)]);
  
  // Fallback 1: Best sellers from same category
  const categoryProducts = allProducts.filter(
    product => !usedIds.has(product.article_id) &&
    hasAnyStock(product) &&
    product.category === currentProduct.category
  );
  
  const fallback1 = categoryProducts
    .slice(0, remainingCount)
    .map(product => ({ ...product, _fallbackType: 'category' }));
  
  const combined = [...smartRelated, ...fallback1];
  
  if (combined.length >= targetCount) {
    return combined.slice(0, targetCount);
  }
  
  // Fallback 2: Any in-stock products (sorted by stock score)
  const remainingCount2 = targetCount - combined.length;
  const otherProducts = allProducts.filter(
    product => !usedIds.has(product.article_id) && hasAnyStock(product)
  );
  
  const fallback2 = otherProducts
    .sort((a, b) => calculateStockScore(b) - calculateStockScore(a))
    .slice(0, remainingCount2)
    .map(product => ({ ...product, _fallbackType: 'general' }));
  
  return [...combined, ...fallback2].slice(0, targetCount);
};
