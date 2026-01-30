import React, { useMemo } from 'react';
import type { Product } from '../../../types/product';
import ProductCard from './ProductCard';
import { getSmartRelatedProducts, getRelatedProductsWithFallback } from '@lib/utils/stockFilter';

interface RelatedProductsProps {
  products: Product[];
  currentProduct?: Product; // Add current product for smart matching
  allProducts?: Product[]; // Add all products for fallback logic
  className?: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ 
  products,
  currentProduct,
  allProducts,
  className = ''
}) => {
  // Smart related product matching with fallback logic
  const inStockProducts = useMemo(() => {
    if (currentProduct && allProducts) {
      // Use smart matching with fallbacks when we have current product and all products
      const smartRelated = getSmartRelatedProducts(currentProduct, allProducts, 12);
      return getRelatedProductsWithFallback(currentProduct, allProducts, smartRelated, 12);
    } else {
      // Fallback to simple filtering for backward compatibility
      return products.slice(0, 12);
    }
  }, [currentProduct, allProducts, products]);

  if (!inStockProducts || inStockProducts.length === 0) return null;

  return (
    <div className={`w-full bg-gray-50 dark:bg-dark3 ${className}`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="overflow-x-auto pb-4 scrollbar-hide px-1">
          <div className="flex gap-4 sm:gap-6">
            {inStockProducts.map((product) => (
              <div 
                key={product.product_id} 
                className="flex-shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 xl:w-56 2xl:w-60"
              >
                <ProductCard 
                  product={product}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;