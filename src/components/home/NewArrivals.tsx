import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '@/store/productStore';
import { filterInStockProductsWithCount } from '@lib/utils/stockFilter';
import { Sparkles } from 'lucide-react';

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

  const ProductCard: React.FC<{ product: any }> = ({ product }) => {
    const discountPercentage = product.discount_percentage || 
      Math.round(((Number(product.mrp_price) - Number(product.discount_price)) / Number(product.mrp_price)) * 100);

    return (
      <Link
        to={`/products/${product.article_id}`}
        className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        {/* Product Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={product.thumbnail_url || product.images?.[0] || '/Fici_logo.png'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== '/Fici_logo.png') target.src = '/Fici_logo.png';
            }}
          />
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {discountPercentage}% OFF
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{Number(product.discount_price).toLocaleString('en-IN')}
            </span>
            {product.mrp_price && Number(product.mrp_price) > Number(product.discount_price) && (
              <>
                <span className="text-sm text-gray-500 line-through">
                  ₹{Number(product.mrp_price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  Save ₹{(Number(product.mrp_price) - Number(product.discount_price)).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  };

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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              New Arrivals
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto sm:mx-0">
              Fresh styles and latest designs just dropped this season
            </p>
          </div>
          <div className="w-full flex justify-end mt-4 sm:mt-0 sm:w-auto">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              See All
            </Link>
          </div>
        </div>

        {/* Products Single Row */}
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {inStockHighlightProducts.map((product) => (
            <div
              key={product.article_id}
              className="flex-shrink-0 w-64 sm:w-72 lg:w-80"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
