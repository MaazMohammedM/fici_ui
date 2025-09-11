import React from "react";
import type { Product } from "../../../types/product";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${product.article_id}`)}
      className="cursor-pointer group rounded-xl shadow-sm bg-white hover:shadow-lg transition overflow-hidden"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>

      {/* Product Info */}
      <div className="px-3 sm:px-4 py-4 text-center">
        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
          {product.name}
        </h3>

        {/* Sub-category */}
        {product.sub_category && (
          <p className="text-xs text-gray-500 mt-1">{product.sub_category}</p>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-base sm:text-lg font-semibold text-gray-900">
            ₹{product.discount_price}
          </span>
          {product.mrp_price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.mrp_price}
            </span>
          )}
        </div>

        {/* Sizes */}
        {product.sizes && Object.keys(product.sizes).length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {Object.keys(product.sizes)
              .slice(0, 3)
              .map((size) => (
                <span
                  key={size}
                  className="px-2 py-0.5 text-xs border rounded-md bg-gray-50"
                >
                  {size}
                </span>
              ))}
            {Object.keys(product.sizes).length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">+more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;