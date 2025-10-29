import React from "react";
import type { Product } from "../../../types/product";
import { useNavigate } from "react-router-dom";
import CachedImage from "../../../components/ui/CachedImage";

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${product.article_id}`)}
      className={`cursor-pointer group rounded-xl shadow-sm bg-white dark:bg-dark2 hover:shadow-lg transition overflow-hidden min-h-[280px] flex flex-col ${className}`}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
        <CachedImage
          src={product.images?.[0] || ''}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loadingFallback={
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          }
          errorFallback={
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          }
        />
      </div>

      {/* Product Info */}
      <div className="px-3 sm:px-4 py-4 text-center flex-1 flex flex-col justify-between">
        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
          {product.name}
        </h3>

        {/* Sub-category */}
        {product.sub_category && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.sub_category}</p>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            ₹{product.discount_price}
          </span>
          {product.mrp_price && (
            <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
              ₹{product.mrp_price}
            </span>
          )}
        </div>

        {/* Sizes - Always maintain consistent space */}
        <div className="mt-2 min-h-[32px] flex items-center justify-center">
          {product.sizes && Object.keys(product.sizes).length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1">
              {Object.keys(product.sizes)
                .slice(0, 3)
                .map((size) => (
                  <span
                    key={size}
                    className="px-2 py-0.5 text-xs border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                  >
                    {size}
                  </span>
                ))}
              {Object.keys(product.sizes).length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">+more</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">No sizes</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;