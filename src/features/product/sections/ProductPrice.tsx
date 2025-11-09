import React from "react";
import type { Product } from "../../../types/product";

interface Props {
  selectedVariant: Product | undefined;
}

const ProductPrice: React.FC<Props> = ({ selectedVariant }) => {
  if (!selectedVariant) return null;

  return (
    <div className="flex items-center space-x-4 mb-2">
      <span className="text-3xl font-bold text-primary">
        ₹{selectedVariant.discount_price}
      </span>
      {parseFloat(String(selectedVariant.mrp_price)) >
        parseFloat(String(selectedVariant.discount_price)) && (
        <>
          <span className="text-xl text-gray-500 line-through">
            ₹{selectedVariant.mrp_price}
          </span>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
            {selectedVariant.discount_percentage}% OFF
          </span>
        </>
      )}
    </div>
  );
};

export default ProductPrice;