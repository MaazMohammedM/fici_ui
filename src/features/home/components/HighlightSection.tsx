// src/features/home/components/HighlightSection.tsx
import React, { useEffect } from 'react';
import { useProductStore } from '@/store/productStore';
import { Link } from 'react-router-dom';

const HighlightSection: React.FC = () => {
  const { highlightProducts, fetchHighlightProducts, loading } = useProductStore();

  useEffect(() => {
    fetchHighlightProducts();
  }, [fetchHighlightProducts]);

  if (loading && highlightProducts.length === 0) {
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

  if (highlightProducts.length === 0) {
    return null; // Or a placeholder if you prefer
  }

  return (
    <section className="py-8 sm:py-10 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      <div className="w-full px-4 sm:px-8 lg:px-16">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[color:var(--color-dark1)] dark:text-[color:var(--color-light1)]">
            Today's Highlights
          </h2>
          <Link 
            to="/products"
            className="text-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]/80 font-semibold transition-colors text-sm sm:text-base lg:text-lg"
          >
            View All →
          </Link>
        </div>
        {/* One-row horizontally scrollable list (all breakpoints) */}
        <div className="w-full">
          <div className="flex items-start gap-3 sm:gap-4 lg:gap-6 xl:gap-8 w-full overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {highlightProducts.map((product) => (
              <div key={product.article_id} className="flex-shrink-0 w-56 sm:w-64 lg:w-72 xl:w-80">
                <Link
                  to={`/products/${product.article_id}`}
                  className="group block bg-white dark:bg-[color:var(--color-dark2)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.thumbnail_url || product.images?.[0] || '/Fici_logo.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/Fici_logo.png') {
                          target.src = '/Fici_logo.png';
                        }
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 h-10">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-[color:var(--color-primary)]">₹{product.discount_price}</span>
                      {product.discount_price && (
                        <span className="text-xs text-gray-500 line-through">₹{product.mrp_price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default HighlightSection;