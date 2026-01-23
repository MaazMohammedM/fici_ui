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

    // For both bags and shoes, only return sizes with stock > 0
    const inStockSizes = Object.keys(selectedVariant.sizes).filter(s => (selectedVariant.sizes[s] ?? 0) > 0);
    return inStockSizes;
  }, [selectedVariant, isBag]);

  // Get full size range based on product category/subcategory
  const fullSizeRange = useMemo(() => {
    const subcategory = currentProduct?.sub_category?.toLowerCase() || '';
    const category = currentProduct?.category?.toLowerCase() || '';

    // Check if it's a shoe/sandal product (footwear)
    const isFootwear = subcategory.includes('shoe') || subcategory.includes('sandal') ||
                      category.includes('footwear') || category.includes('shoe') || category.includes('sandal');

    // For bags, show all sizes from the sizes object regardless of stock
    if (isBag && selectedVariant?.sizes) {
      const bagSizes = Object.keys(selectedVariant.sizes);
      return bagSizes.length > 0 ? bagSizes : [];
    }

    // For footwear (shoes/sandals), use gender-based sizing
    if (isFootwear) {
      const gender = currentProduct?.gender?.toLowerCase() || '';

      // Check for women first, then men, to ensure proper precedence
      if (gender === 'women' || gender.includes('women')) {
        const womenSizes = Array.from({ length: 8 }, (_, i) => (35 + i).toString()); // 35-42
        return womenSizes;
      } else if (gender === 'men' || gender.includes('men')) {
        const menSizes = Array.from({ length: 9 }, (_, i) => (39 + i).toString()); // 39-47
        return menSizes;
      } else {
        const defaultSizes = Array.from({ length: 9 }, (_, i) => (39 + i).toString()); // 39-47
        return defaultSizes;
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
        return; // Important: return early to prevent override
      }
      setRequestedArticleId(null);
    }

    // Only set default if no selection exists
    if (!selectedArticleId) {
      const first = currentProduct.variants[0];
      if (first) {
        setSelectedArticleId(first.article_id);
        fetchRelatedProducts(currentProduct.category, first.product_id);
      }
    }
    
    // Update related products for current selection (defensive)
    if (selectedArticleId) {
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
