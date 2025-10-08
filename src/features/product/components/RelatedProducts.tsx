import React from 'react';
import type { Product } from '../../../types/product';
import ProductCard from './ProductCard';

interface RelatedProductsProps {
  products: Product[];
  className?: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ 
  products,
  className = ''
}) => {
  if (!products || products.length === 0) return null;

  return (
    <div className={`w-full bg-gray-50 dark:bg-dark3 ${className}`}>
      <div className="w-full px-4 sm:px-8 lg:px-16 py-6 sm:py-8">
        
        <div className="relative">
          <div className="relative w-full overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-3 sm:gap-4 lg:gap-6 w-max">
              {products.map((product) => (
                <div 
                  key={product.product_id} 
                  className="flex-shrink-0 w-40 sm:w-48 md:w-56 lg:w-64 xl:w-72"
                >
                  <ProductCard 
                    product={product}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;