import React from "react";
import { Check } from "lucide-react";
import type { Product, ProductDetail } from "../../../types/product";

const getColorValue = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#FFFFFF",
    brown: "#8B4513",
    tan: "#D2B48C",
    navy: "#000080",
    blue: "#0000FF",
    red: "#FF0000",
    green: "#008000",
    gray: "#808080",
    grey: "#808080",
    beige: "#F5F5DC",
    cream: "#FFFDD0",
    pink: "#FFC0CB",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080",
    silver: "#C0C0C0",
    gold: "#FFD700",
    maroon: "#800000",
    olive: "#808000",
    lime: "#00FF00",
    aqua: "#00FFFF",
    teal: "#008080",
    fuchsia: "#FF00FF",
  };
  return colorMap[colorName.toLowerCase()] || "#6B7280";
};

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
  if (currentProduct.variants.length <= 1) return null;

  const displayColorLabel =
    selectedVariant?.color || currentProduct.variants[0]?.color || "";

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-primary dark:text-secondary">
        Color:{" "}
        <span className="font-normal capitalize text-accent">
          {displayColorLabel}
        </span>
      </h3>
      <div className="flex flex-wrap gap-3">
        {currentProduct.variants.map((variant) => {
          const colorLabel =
            variant.article_id.split("_")[1] || variant.color;
          const isSelected = variant.article_id === selectedArticleId;

          return (
            <button
              key={variant.article_id}
              onClick={() => onColorChange(variant.article_id)}
              title={colorLabel}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-transform transform ${
                isSelected
                  ? "scale-110 ring-2 ring-accent/40 shadow-lg"
                  : "hover:scale-105"
              }`}
              aria-pressed={isSelected}
            >
              <span
                className="block w-10 h-10 rounded-full border"
                style={{
                  backgroundColor: getColorValue(colorLabel),
                  borderColor: isSelected
                    ? "rgba(0,0,0,0.06)"
                    : undefined,
                }}
              />
              {isSelected && (
                <Check className="absolute w-4 h-4 text-white" />
              )}
              <span className="sr-only">{colorLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductColorSelector;