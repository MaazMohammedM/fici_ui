import React from 'react';
import ProductDetails from '../../features/product/components/ProductDetails';
import type { Product, ProductDetail } from '../../types/product';

interface MemoizedProductDetailsProps {
  currentProduct: ProductDetail;
  selectedVariant: Product | undefined;
  selectedArticleId: string;
  selectedSize: string;
  quantity: number;
  availableSizes: string[];
  fullSizeRange: string[];
  onColorChange: (articleId: string) => void;
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onWishlistToggle: () => void;
  onWhatsAppContact: (size: string) => void;
  isWishlisted: boolean;
}

// Memoized ProductDetails component to prevent unnecessary re-renders
const MemoizedProductDetails = React.memo<MemoizedProductDetailsProps>(({
  currentProduct,
  selectedVariant,
  selectedArticleId,
  selectedSize,
  quantity,
  availableSizes,
  fullSizeRange,
  onColorChange,
  onSizeChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  onWhatsAppContact,
  isWishlisted
}) => {
  return (
    <ProductDetails
      currentProduct={currentProduct}
      selectedVariant={selectedVariant}
      selectedArticleId={selectedArticleId}
      selectedSize={selectedSize}
      quantity={quantity}
      availableSizes={availableSizes}
      fullSizeRange={fullSizeRange}
      onColorChange={onColorChange}
      onSizeChange={onSizeChange}
      onQuantityChange={onQuantityChange}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onWishlistToggle={onWishlistToggle}
      onWhatsAppContact={onWhatsAppContact}
      isWishlisted={isWishlisted}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.selectedArticleId === nextProps.selectedArticleId &&
    prevProps.selectedSize === nextProps.selectedSize &&
    prevProps.quantity === nextProps.quantity &&
    prevProps.currentProduct?.article_id === nextProps.currentProduct?.article_id &&
    prevProps.selectedVariant?.article_id === nextProps.selectedVariant?.article_id &&
    prevProps.availableSizes.length === nextProps.availableSizes.length &&
    prevProps.availableSizes.every((size, index) => size === nextProps.availableSizes[index]) &&
    prevProps.fullSizeRange.length === nextProps.fullSizeRange.length &&
    prevProps.fullSizeRange.every((size, index) => size === nextProps.fullSizeRange[index])
  );
});

MemoizedProductDetails.displayName = 'MemoizedProductDetails';

export default MemoizedProductDetails;