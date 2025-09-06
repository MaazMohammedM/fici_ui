import React from "react";
import StarComponent from "@lib/util/StarComponent";
import type { ProductDetail } from "../../../types/product";

interface Props {
  currentProduct: ProductDetail;
}

const ProductTitleRating: React.FC<Props> = ({ currentProduct }) => (
  <div>
    <h1 className="text-3xl font-bold text-primary dark:text-secondary mb-2">
      {currentProduct.name}
    </h1>
    <div className="flex items-center space-x-4 mb-4">
      <StarComponent rating={4.8} />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        4.8/5 Star rating
      </span>
    </div>
  </div>
);

export default ProductTitleRating;