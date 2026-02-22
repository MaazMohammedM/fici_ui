import React from "react";
import type { Product } from "../../../types/product";
import { useNavigate } from "react-router-dom";
import CachedImage from "../../../components/ui/CachedImage";
import { getListingImageUrl, getThumbnailUrl } from "../../../lib/utils/imageOptimization";

interface ProductCardProps {
  product: Product;
  className?: string;
  // Props for highlighting active filters
  activeSizes?: string[];
  activeCategories?: string[];
  activeGenders?: string[];
  activeSubCategories?: string[];
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  className = '', 
  activeSizes = [], 
  activeCategories = [], 
  activeGenders = [], 
  activeSubCategories = [] 
}) => {
  const navigate = useNavigate();

  // Calculate discount percentage
  const discountPercentage = React.useMemo(() => {
    if (product.discount_percentage) {
      return product.discount_percentage;
    }
    const mrpPrice = Number(product.mrp_price);
    const discountPrice = Number(product.discount_price);
    if (mrpPrice && discountPrice && mrpPrice > discountPrice) {
      return Math.round(((mrpPrice - discountPrice) / mrpPrice) * 100);
    }
    return 0;
  }, [product.discount_percentage, product.mrp_price, product.discount_price]);

  // Get optimized image URL - prioritize thumbnail_url for listing pages
  const optimizedImageUrl = React.useMemo(() => {
    // Use thumbnail_url first (optimized for listing), fallback to first image
    const imageUrl = product.thumbnail_url || product.images?.[0] || '';
    return getListingImageUrl(imageUrl);
  }, [product.thumbnail_url, product.images]);

  // Check if product attributes match active filters
  const isSubCategoryActive = React.useMemo(() => {
    return product.sub_category && activeSubCategories.includes(product.sub_category);
  }, [product.sub_category, activeSubCategories]);

  const isCategoryActive = React.useMemo(() => {
    return product.category && activeCategories.includes(product.category);
  }, [product.category, activeCategories]);

  return (
    <div
      onClick={() => navigate(`/products/${product.article_id}`)}
      className={`cursor-pointer group rounded-xl shadow-sm bg-white dark:bg-dark2 hover:shadow-lg transition overflow-hidden min-h-[320px] flex flex-col ${className}`}
    >
      {/* Product Image - Larger and more appealing */}
      <div className="relative aspect-[4/5] w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
        <CachedImage
          src={optimizedImageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
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
          <p className={`text-xs mt-1 ${
            isSubCategoryActive 
              ? 'text-primary font-medium' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {product.sub_category}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto pt-3">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                ₹{product.discount_price}
              </span>
              {product.mrp_price && (
                <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                  ₹{product.mrp_price}
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;