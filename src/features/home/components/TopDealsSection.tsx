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
      <div className='bg-gradient-light dark:bg-gradient-dark min-h-[70svh] w-full px-4 lg:px-16 flex items-center justify-center'>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (topDeals.length === 0) {
    return (
      <div className='bg-gradient-light dark:bg-gradient-dark min-h-[70svh] w-full px-4 lg:px-16 flex items-center justify-center'>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No deals available at the moment.</p>
          <Link 
            to="/products" 
            className="text-accent hover:text-accent/80 font-semibold transition-colors mt-2 inline-block"
          >
            Browse All Products →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-light dark:bg-gradient-dark min-h-[70svh] w-full px-4 lg:px-16 flex flex-col gap-4 justify-center py-8 lg:py-0'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4'>
        <h2 className='text-xl lg:text-2xl font-bold font-secondary text-primary dark:text-secondary'>
          Amazing deals for you!
        </h2>
        <Link 
          to="/products"
          className="text-accent hover:text-accent/80 font-semibold transition-colors"
        >
          View All →
        </Link>
      </div>
           
      <div className='flex items-start gap-4 lg:gap-10 w-full overflow-x-auto pb-4 scrollbar-hide'>
        {topDeals.map((product) => (
          <div key={product.product_id} className="flex-shrink-0 w-72 lg:w-80">
            <TopDealsCard 
              title={product.name}
              rating={4.5}
              price={parseFloat(product.discount_price)}
              originalPrice={parseFloat(product.mrp_price)}
              reviews={Math.floor(Math.random() * 200) + 50}
              image={product.thumbnail_url || product.images[0]}
              link={`/products/${product.article_id}`}
              discountPercentage={product.discount_percentage}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopDealsSection;