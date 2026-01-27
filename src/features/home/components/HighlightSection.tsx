// src/features/home/components/HighlightSection.tsx
import React, { useEffect, useMemo } from 'react';
import { useProductStore } from '@/store/productStore';
import { Link } from 'react-router-dom';
import { filterInStockProductsWithCount } from '@lib/utils/stockFilter';

const HighlightSection: React.FC = () => {
  const { highlightProducts, fetchHighlightProducts, clearHighlightProductsCache, loading } = useProductStore();

  // Filter out out-of-stock products and ensure consistent count
  const inStockHighlightProducts = useMemo(() => {
    const filtered = filterInStockProductsWithCount(highlightProducts, 5);    
    return filtered;
  }, [highlightProducts]);

  // Calculate discount percentage for each product
  const getDiscountPercentage = (product: any) => {
    // Use pre-calculated discount percentage if available
    if (product.discount_percentage && typeof product.discount_percentage === 'number') {
      return product.discount_percentage;
    }
    
    // Calculate from prices
    const mrpPrice = Number(product.mrp_price);
    const discountPrice = Number(product.discount_price);
    
    // Ensure both prices are valid numbers and MRP is greater than discount price
    if (!isNaN(mrpPrice) && !isNaN(discountPrice) && mrpPrice > 0 && discountPrice > 0 && mrpPrice > discountPrice) {
      return Math.round(((mrpPrice - discountPrice) / mrpPrice) * 100);
    }
    
    return 0;
  };

  // Clear cache on mount to ensure fresh data and only active products
  useEffect(() => {
    clearHighlightProductsCache();
    fetchHighlightProducts();
  }, [fetchHighlightProducts, clearHighlightProductsCache]);

  if (loading && inStockHighlightProducts.length === 0) {
    return (
      <div className="py-8 sm:py-10 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[color:var(--color-dark1)] dark:text-[color:var(--color-light1)]">
              Today's Highlights
            </h2>
            <span className="text-transparent">View All</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[color:var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (inStockHighlightProducts.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Today's Highlights
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
              Discover our curated selection of premium products
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Mobile View - Horizontal Scroll */}
        <div className="sm:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-center scrollbar-hide">
            {inStockHighlightProducts.map((product) => {
              const discountPercentage = getDiscountPercentage(product);
              
              return (
                <div
                  key={product.article_id}
                  className="flex-shrink-0 min-w-[calc((100vw-2rem-0.75rem)/2)] max-w-[calc((100vw-2rem-0.75rem)/2)] snap-start"
                >
                  <Link
                    to={`/products/${product.article_id}`}
                    className="group block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-[3/4] w-full">
                      <img
                        src={product.thumbnail_url || product.images?.[0] || '/Fici_logo.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (target.src !== '/Fici_logo.png') target.src = '/Fici_logo.png';
                        }}
                      />
                      
                      {/* Discount Badge */}
                      {discountPercentage > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {discountPercentage}% OFF
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 line-clamp-2 mb-2 leading-tight">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          ₹{product.discount_price}
                        </span>
                        {product.mrp_price && Number(product.mrp_price) > Number(product.discount_price) && (
                          <>
                            <span className="text-xs text-gray-500 line-through">
                              ₹{product.mrp_price}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Save ₹{(Number(product.mrp_price) - Number(product.discount_price)).toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop View - Grid */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
          {inStockHighlightProducts.map((product) => {
            const discountPercentage = getDiscountPercentage(product);
            
            return (
              <div key={product.article_id}>
                <Link
                  to={`/products/${product.article_id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] w-full">
                    <img
                      src={product.thumbnail_url || product.images?.[0] || '/Fici_logo.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== '/Fici_logo.png') target.src = '/Fici_logo.png';
                      }}
                    />
                    
                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {discountPercentage}% OFF
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 line-clamp-2 mb-2 leading-tight">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        ₹{product.discount_price}
                      </span>
                      {product.mrp_price && Number(product.mrp_price) > Number(product.discount_price) && (
                        <>
                          <span className="text-xs text-gray-500 line-through">
                            ₹{product.mrp_price}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Save ₹{(Number(product.mrp_price) - Number(product.discount_price)).toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="sm:hidden mt-6 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            View All Products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HighlightSection;