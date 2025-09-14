import React from "react";
import StarComponent from "@lib/util/StarComponent";
import type { ProductDetail } from "../../../types/product";

interface Props {
  currentProduct: ProductDetail;
}

const ProductTitleRating: React.FC<Props> = ({ currentProduct }) => {
  const rating = currentProduct.rating?.average || 0;
  const reviewCount = currentProduct.rating?.count || 0;
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-primary dark:text-secondary mb-2">
        {currentProduct.name}
      </h1>
      <div className="flex items-center space-x-4 mb-4">
        <StarComponent rating={rating} size="md" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {rating > 0 ? (
            <>
              {rating.toFixed(1)}/5 • {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </>
          ) : (
            'No reviews yet'
          )}
        </span>
      </div>
    </div>
  );
};

export default ProductTitleRating;