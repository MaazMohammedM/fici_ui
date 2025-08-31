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
      <div className='bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] min-h-[50svh] sm:min-h-[70svh] w-full px-4 sm:px-8 lg:px-16 flex items-center justify-center'>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[color:var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (topDeals.length === 0) {
    return (
      <div className='bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] min-h-[50svh] sm:min-h-[70svh] w-full px-4 sm:px-8 lg:px-16 flex items-center justify-center'>
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
    <div className='bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] min-h-[50svh] sm:min-h-[70svh] w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-4 sm:gap-6 justify-center py-6 sm:py-8 lg:py-0'>
      <div className='flex flex-row justify-between items-center w-full gap-4'>
        <h2 className='text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-secondary text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)]'>
          Amazing deals for you!
        </h2>
        <Link 
          to="/products"
          className="text-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]/80 font-semibold transition-colors text-sm sm:text-base lg:text-lg"
        >
          View All →
        </Link>
      </div>
           
      <div className='flex items-start gap-3 sm:gap-4 lg:gap-6 xl:gap-10 w-full overflow-x-auto pb-4 scrollbar-hide'>
        {topDeals.map((product) => (
          <div key={product.product_id} className="flex-shrink-0 w-64 sm:w-72 lg:w-80 xl:w-96">
            <TopDealsCard 
              title={product.name}
              rating={4.5}
              price={parseFloat(product.discount_price)}
              originalPrice={parseFloat(product.mrp_price)}
              reviews={Math.floor(Math.random() * 200) + 50}
              image={product.thumbnail_url || product.images?.[0]}
              link={`/products/${product.article_id.split('_').at(0)}`}
              discountPercentage={product.discount_percentage}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopDealsSection;