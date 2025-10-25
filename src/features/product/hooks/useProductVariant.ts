import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '@store/productStore';
import type { ProductDetail } from '../../../types/product';

interface UseProductVariantOptions {
  currentProduct: ProductDetail | null;
  articleId?: string;
}

interface ProductVariantState {
  selectedArticleId: string;
  selectedSize: string;
  availableSizes: string[];
  fullSizeRange: string[];
  isBag: boolean;
  isOutOfStock: boolean;
  selectedVariant: any;
}

export const useProductVariant = ({ currentProduct, articleId }: UseProductVariantOptions) => {
  const navigate = useNavigate();
  const { fetchRelatedProducts } = useProductStore();

  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [requestedArticleId, setRequestedArticleId] = useState<string | null>(null);

  // Memoized computed values for better performance
  const selectedVariant = useMemo(() =>
    currentProduct?.variants.find(v => v.article_id === selectedArticleId),
    [currentProduct, selectedArticleId]
  );

  const isBag = useMemo(() => {
    return currentProduct?.sub_category?.toLowerCase().includes('bag') ||
           currentProduct?.category?.toLowerCase().includes('bag');
  }, [currentProduct]);

  const availableSizes = useMemo(() => {
    // If sizes data doesn't exist in the database, return empty array (out of stock)
    if (!selectedVariant?.sizes) {
      return [];
    }

    if (isBag) {
      // For bags, get sizes from the sizes object if available
      const bagSizes = Object.keys(selectedVariant.sizes).filter(s => (selectedVariant.sizes[s] ?? 0) > 0);
      return bagSizes.length > 0 ? bagSizes : [];
    }

    // For shoes and sandals, use existing logic
    const shoeSizes = Object.keys(selectedVariant.sizes).filter(s => (selectedVariant.sizes[s] ?? 0) > 0);
    return shoeSizes;
  }, [selectedVariant, isBag]);

  // Get full size range based on product category/subcategory
  const fullSizeRange = useMemo(() => {
    const subcategory = currentProduct?.sub_category?.toLowerCase() || '';
    const category = currentProduct?.category?.toLowerCase() || '';

    // Check if it's a shoe/sandal product (footwear)
    const isFootwear = subcategory.includes('shoe') || subcategory.includes('sandal') ||
                      category.includes('footwear') || category.includes('shoe') || category.includes('sandal');

    // For bags that are out of stock, return empty array to show "out of stock" message
    if (isBag && availableSizes.length === 0) {
      return [];
    }

    // For footwear (shoes/sandals), use gender-based sizing
    if (isFootwear) {
      const gender = currentProduct?.gender?.toLowerCase() || '';

      if (gender.includes('men')) {
        return Array.from({ length: 9 }, (_, i) => (39 + i).toString()); // 39-47
      } else if (gender.includes('women')) {
        return Array.from({ length: 8 }, (_, i) => (35 + i).toString()); // 35-43
      } else {
        // Default to men's range if unclear
        return Array.from({ length: 9 }, (_, i) => (39 + i).toString()); // 39-47
      }
    }

    // For non-footwear products (bags, accessories, etc.), use actual sizes from products table
    if (selectedVariant?.sizes) {
      const actualSizes = Object.keys(selectedVariant.sizes);
      return actualSizes.length > 0 ? actualSizes : [];
    }

    // Fallback for non-footwear products without size data
    return [];
  }, [currentProduct, availableSizes.length, isBag, selectedVariant]);

  // Check if product is out of stock (no sizes available or sizes not present)
  const isOutOfStock = useMemo(() => {
    // Consider out of stock if:
    // 1. No sizes available (all quantities are 0) - OR
    // 2. Sizes data is not present in the database (undefined/null/empty)
    const noSizesAvailable = availableSizes.length === 0;
    const noSizesData = !selectedVariant?.sizes || Object.keys(selectedVariant?.sizes || {}).length === 0;

    return noSizesAvailable || noSizesData;
  }, [availableSizes, selectedVariant]);

  // Handle color change
  const handleColorChange = useCallback((articleId: string) => {
    const variant = currentProduct?.variants.find(v => v.article_id === articleId);
    if (!variant) return;

    setSelectedArticleId(articleId);
    navigate(`/products/${articleId}`, { replace: true });
    setSelectedSize('');

    if (currentProduct?.category) {
      fetchRelatedProducts(currentProduct.category, variant.product_id);
    }
  }, [currentProduct, navigate, fetchRelatedProducts]);

  // Initial load from route
  useEffect(() => {
    if (articleId) {
      setRequestedArticleId(articleId);
    }
  }, [articleId]);

  // When currentProduct updates, determine selection
  useEffect(() => {
    if (!currentProduct) return;

    // If we requested a specific article_id (via color click or route), prefer that if it exists in variants
    if (requestedArticleId) {
      const found = currentProduct.variants.find(v => v.article_id === requestedArticleId);
      if (found) {
        setSelectedArticleId(requestedArticleId);
        fetchRelatedProducts(currentProduct.category, found.product_id);
        setRequestedArticleId(null);
        return;
      }
      setRequestedArticleId(null);
    }

    // If we don't have a selection or the selectedArticleId is not present in the new currentProduct, set default to first variant
    const exists = currentProduct.variants.some(v => v.article_id === selectedArticleId);
    if (!selectedArticleId || !exists) {
      const first = currentProduct.variants[0];
      if (first) {
        setSelectedArticleId(first.article_id);
        fetchRelatedProducts(currentProduct.category, first.product_id);
      }
    } else {
      // If current selection exists, update related products (defensive)
      const sel = currentProduct.variants.find(v => v.article_id === selectedArticleId);
      if (sel) fetchRelatedProducts(currentProduct.category, sel.product_id);
    }
    setSelectedSize('');
  }, [currentProduct, requestedArticleId, selectedArticleId, fetchRelatedProducts]);

  return {
    selectedArticleId,
    selectedSize,
    availableSizes,
    fullSizeRange,
    isBag,
    isOutOfStock,
    selectedVariant,
    setSelectedSize,
    handleColorChange,
  } as const;
};
