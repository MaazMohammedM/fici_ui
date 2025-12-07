// src/features/home/components/HighlightSection.tsx
import React, { useEffect, useMemo } from 'react';
import { useProductStore } from '@/store/productStore';
import { Link } from 'react-router-dom';

const HighlightSection: React.FC = () => {
  const { highlightProducts, fetchHighlightProducts, loading } = useProductStore();

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

  if (highlightProducts.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Horizontal list with 2-up on mobile, snap to card */}
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex items-stretch gap-3 sm:gap-5 snap-x snap-center px-1 sm:px-0">
            {highlightProducts.map((product) => {
              const discountPercentage = getDiscountPercentage(product);
              
              return (
              <div
                key={product.article_id}
                className={[
                  // Mobile: 2 cards per viewport:
                  // viewport 100vw - 2*16px container padding - gap(12px) then /2
                  'min-w-[calc((100vw-2rem-0.75rem)/2)] max-w-[calc((100vw-2rem-0.75rem)/2)]',
                  // sm+: revert to fixed card widths
                  'sm:w-64 lg:w-72 sm:min-w-0 sm:max-w-none',
                  'flex-shrink-0 h-full snap-start'
                ].join(' ')}
              >
                <Link
                  to={`/products/${product.article_id}`}
                  className="group block bg-white dark:bg-[color:var(--color-dark2)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full hover:scale-[1.02]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                    <img
                      src={product.thumbnail_url || product.images?.[0] || '/Fici_logo.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== '/Fici_logo.png') target.src = '/Fici_logo.png';
                      }}
                    />
                  </div>
                  <div className="p-2 sm:p-3 flex flex-col h-20 sm:h-24">
                    <h3 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <div className="mt-auto">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-sm sm:text-base font-bold text-[color:var(--color-primary)]">
                          ₹{product.discount_price}
                        </span>
                        {product.mrp_price && Number(product.mrp_price) > Number(product.discount_price) && (
                          <>
                            <span className="text-xs text-gray-500 line-through">
                              ₹{product.mrp_price}
                            </span>
                            {discountPercentage > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded font-medium">
                                {discountPercentage}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
              );
            })}
            {/* Right padding spacer so the last snap card isn't cropped */}
            <div className="w-8 sm:w-4 lg:w-8 flex-shrink-0" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HighlightSection;