import { Heart } from 'lucide-react';
import React from 'react';
import type { Product } from '../store/productStore';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const discountPercent = Math.round(
    ((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100
  );

  return (
    <div className="w-full max-w-xs p-4 flex flex-col gap-2 hover:bg-white hover:rounded-2xl">
      <div className="relative w-full h-40 rounded-2xl">
        <img
          src={product.thumbnail_url}
          alt={product.name}
          className="w-full h-full object-cover rounded-lg"
        />
        <Heart
          strokeWidth={0.5}
          absoluteStrokeWidth
          className="absolute top-2 right-2 cursor-pointer"
        />
        {discountPercent > 0 && (
          <span className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {discountPercent}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-md font-bold text-accent font-primary truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <p className="text-lg text-primary font-bold font-primary">
            {product.discountPrice}₹
          </p>
          <p className="text-sm text-primary/50 line-through font-primary">
            {product.mrpPrice}₹
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;