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
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="overflow-x-auto pb-4 scrollbar-hide px-1">
          <div className="grid grid-flow-col auto-cols-[150px] sm:auto-cols-[160px] md:grid-flow-row md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 w-max md:w-full md:px-0">
            {products.map((product) => (
              <div key={product.product_id} className="w-full h-full">
                <ProductCard 
                  product={product}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;