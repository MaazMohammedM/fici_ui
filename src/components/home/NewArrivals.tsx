import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '@/store/productStore';
import { filterInStockProductsWithCount } from '@lib/utils/stockFilter';
import { Sparkles } from 'lucide-react';
import ProductCard from '../../features/product/components/ProductCard';

const NewArrivals: React.FC = () => {
  const { highlightProducts, fetchHighlightProducts, clearHighlightProductsCache, loading } = useProductStore();

  // Filter out out-of-stock products and ensure consistent count
  const inStockHighlightProducts = useMemo(() => {
    const filtered = filterInStockProductsWithCount(highlightProducts, 8);    
    return filtered;
  }, [highlightProducts]);

  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    clearHighlightProductsCache();
    fetchHighlightProducts();
  }, [fetchHighlightProducts, clearHighlightProductsCache]);

  if (loading && inStockHighlightProducts.length === 0) {
    return (
      <section className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading new arrivals...</p>
          </div>
        </div>
      </section>
    );
  }

  if (inStockHighlightProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12">
          <div className="flex-1 text-center sm:text-left mb-4 sm:mb-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 sm:mb-3">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                New Arrivals
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto sm:mx-0">
              Fresh styles and latest designs just dropped this season
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap"
            >
              See All
            </Link>
          </div>
        </div>

        {/* Products Grid - Single Row Horizontal Scroll */}
        <div className="overflow-x-auto pb-4 scrollbar-hide px-1">
          <div className="flex gap-4 sm:gap-6">
            {inStockHighlightProducts.map((product) => (
              <div 
                key={product.article_id} 
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
    </section>
  );
};

export default NewArrivals;
