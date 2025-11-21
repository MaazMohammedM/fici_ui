import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopDealsCard from './TopDealsCard';
import { useProductStore } from '@store/productStore';

const TopDealsSection: React.FC = () => {
  const { topDeals, loading, fetchTopDeals } = useProductStore();

  useEffect(() => {
    fetchTopDeals();
  }, [fetchTopDeals]);

  if (loading && topDeals.length === 0) {
    return (
      <div className='bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] w-full px-4 sm:px-8 lg:px-16 py-8 sm:py-10 flex items-center justify-center'>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[color:var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (topDeals.length === 0) {
    return (
      <div className='bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] w-full px-4 sm:px-8 lg:px-16 py-8 sm:py-10 flex items-center justify-center'>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4">
            No deals available at the moment.
          </p>
          <Link
            to="/products"
            className="text-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]/80 font-semibold transition-colors text-sm sm:text-base"
          >
            Browse All Products →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className='bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] py-8 sm:py-10'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='flex flex-row justify-between items-center mb-3 sm:mb-4'>
        <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)]'>
          Amazing deals for you!
        </h2>
        <Link
          to="/products"
          className="text-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]/80 font-semibold transition-colors text-sm sm:text-base"
        >
          View All →
        </Link>
      </div>

      {/* Horizontal list with 2-up on mobile, snap to card */}
      <div className='w-full overflow-x-auto pb-4 scrollbar-hide'>
        <div className="flex items-stretch gap-3 sm:gap-5 snap-x snap-mandatory px-1 sm:px-0">
          {topDeals.map((product) => (
            <div
              key={product.product_id}
              className={[
                // Mobile: 2 per viewport (padding 16px x2, gap 12px)
                'min-w-[calc((100vw-2rem-0.75rem)/2)] max-w-[calc((100vw-2rem-0.75rem)/2)]',
                // sm+: fixed widths
                'sm:w-64 lg:w-72 sm:min-w-0 sm:max-w-none',
                'flex-shrink-0 h-full snap-start'
              ].join(' ')}
            >
              <TopDealsCard
                title={product.name}
                rating={4.5}
                price={parseFloat(String(product.discount_price))}
                originalPrice={parseFloat(String(product.mrp_price))}
                reviews={Math.floor(Math.random() * 200) + 50}
                image={product.thumbnail_url || product.images?.[0]}
                link={`/products/${product.article_id.split('_').at(0)}`}
                discountPercentage={product.discount_percentage}
                className="h-full"
              />
            </div>
          ))}
          {/* Right spacer so last card isn’t cropped */}
          <div className="w-4 sm:w-0 flex-shrink-0" />
        </div>
      </div>
      </div>
    </section>
  );
};

export default TopDealsSection;