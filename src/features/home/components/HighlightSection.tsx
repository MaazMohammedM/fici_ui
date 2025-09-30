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
      <div className="py-12 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-[color:var(--color-dark1)] dark:text-[color:var(--color-light1)]">
            Today's Highlights
          </h2>
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
    <section className="py-12 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-[color:var(--color-dark1)] dark:text-[color:var(--color-light1)]">
          Today's Highlights
        </h2>
        
        {/* Mobile: Horizontal scrollable */}
        <div className="md:hidden w-full">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {highlightProducts.map((product) => (
              <div key={product.article_id} className="flex-shrink-0 w-[70vw] sm:w-[40vw]">
                <Link
                  to={`/products/${product.article_id}`}
                  className="block bg-white dark:bg-[color:var(--color-dark2)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 h-10">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-[color:var(--color-primary)]">
                        ₹{product.discount_price}
                      </span>
                      {product.discount_price && (
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.mrp_price}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet & Desktop: Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4">
          {highlightProducts.map((product) => (
            <Link
              key={product.article_id}
              to={`/products/${product.article_id}`}
              className="group bg-white dark:bg-[color:var(--color-dark2)] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.images?.[0] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 h-10">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-bold text-[color:var(--color-primary)]">
                    ₹{product.discount_price}
                  </span>
                  {product.discount_price && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{product.mrp_price}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HighlightSection;