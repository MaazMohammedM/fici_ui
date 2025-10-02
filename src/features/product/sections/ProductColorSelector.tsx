import React from "react";
import type { Product, ProductDetail } from "../../../types/product";

interface Props {
  currentProduct: ProductDetail;
  selectedVariant: Product | undefined;
  selectedArticleId: string;
  onColorChange: (articleId: string) => void;
}

const ProductColorSelector: React.FC<Props> = ({
  currentProduct,
  selectedVariant,
  selectedArticleId,
  onColorChange,
}) => {
  const displayColorLabel =
    selectedVariant?.color ||
    currentProduct.variants[0]?.color ||
    "";

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-black dark:text-secondary">
        Color:{" "}
        <span className="font-normal capitalize text-accent">
          {displayColorLabel}
        </span>
      </h3>
      <div className="flex flex-wrap gap-3">
        {currentProduct.variants.map((variant) => {
          const colorLabel =
            String(variant.color || variant.article_id.split("_")[1] || "");
          const isSelected = variant.article_id === selectedArticleId;
          const thumbnailUrl =
            variant.thumbnail_url ||
            (Array.isArray(variant.images) && variant.images.length > 0
              ? variant.images[0]
              : "");

          return (
            <button
              key={variant.article_id}
              onClick={() => onColorChange(variant.article_id)}
              title={colorLabel}
              disabled={currentProduct.variants.length === 1}
              className={`relative flex items-center justify-center w-16 h-16 rounded-md overflow-hidden transition-transform transform ${
                isSelected
                  ? "ring-2 ring-accent shadow-lg scale-105"
                  : "hover:scale-105"
              } ${
                currentProduct.variants.length === 1 ? "cursor-default" : ""
              }`}
              aria-pressed={isSelected}
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={colorLabel}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = "";
                    target.style.backgroundColor = "#f3f4f6";
                    target.alt = `${colorLabel} color`;
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center bg-gray-100"
                  style={{
                    backgroundColor: colorLabel
                      ? `#${colorLabel}`
                      : "#f3f4f6",
                  }}
                >
                  <span className="text-xs text-gray-500">
                    {colorLabel || "N/A"}
                  </span>
                </div>
              )}
              <span className="sr-only">{colorLabel} color option</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductColorSelector;