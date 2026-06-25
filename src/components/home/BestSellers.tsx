import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '@store/productStore';
import { filterInStockProductsWithCount } from '@lib/utils/stockFilter';
import ProductCard from '../../features/product/components/ProductCard';

const BestSellers: React.FC = () => {
  const { topDeals, loading, fetchTopDeals } = useProductStore();

  useEffect(() => {
    fetchTopDeals();
  }, [fetchTopDeals]);

  // Filter out out-of-stock products and ensure consistent count
  const inStockTopDeals = useMemo(() => {
    return filterInStockProductsWithCount(topDeals, 8);
  }, [topDeals]);

  if (loading && inStockTopDeals.length === 0) {
    return (
      <section className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading best sellers...</p>
          </div>
        </div>
      </section>
    );
  }

  if (inStockTopDeals.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12">
          <div className="flex-1 text-center sm:text-left mb-4 sm:mb-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              Best Sellers
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto sm:mx-0">
              Discover our most popular products loved by customers all over India
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
            {inStockTopDeals.map((product) => (
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

export default BestSellers;
