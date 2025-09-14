import React from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../../../types/product';

interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-8">
        Related Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard 
            key={product.product_id} 
            product={product} 
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;