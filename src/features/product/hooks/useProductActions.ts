import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@store/cartStore';
import { useWishlistStore } from '@store/wishlistStore';
import { useProductStore } from '@store/productStore';
import type { ProductDetail } from '../../../types/product';

interface UseProductActionsOptions {
  currentProduct: ProductDetail | null;
  selectedVariant: any;
  selectedArticleId: string;
  selectedSize: string;
  quantity: number;
}

export const useProductActions = ({
  currentProduct,
  selectedVariant,
  selectedArticleId,
  selectedSize,
  quantity,
}: UseProductActionsOptions) => {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title?: string;
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  // Show alert modal helper
  const showAlert = useCallback((message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', title?: string) => {
    setAlertModal({
      isOpen: true,
      message,
      type,
      title: title || (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Info')
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleAddToCart = useCallback((): boolean => {
    console.log('🛒 Add to Cart clicked:', {
      selectedSize,
      selectedVariant: selectedVariant?.article_id,
      currentProduct: currentProduct?.name
    });

    if (!selectedSize) {
      console.log('❌ No size selected');
      showAlert('Please select a size', 'warning');
      return false;
    }

    if (!selectedVariant) {
      console.log('❌ No variant selected');
      showAlert('Please select a product variant', 'warning');
      return false;
    }

    console.log('✅ Adding to cart...');

    const productImage =
      Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
        ? selectedVariant.images[0]
        : selectedVariant.thumbnail_url || '';

    // Collect all available sizes across all variants for this product
    const allAvailableSizes = new Set<string>();
    currentProduct?.variants.forEach(variant => {
      if (variant.sizes) {
        Object.keys(variant.sizes).forEach(size => {
          if ((variant.sizes[size] ?? 0) > 0) {
            allAvailableSizes.add(size);
          }
        });
      }
    });

    addToCart({
      product_id: selectedVariant.product_id,
      article_id: selectedVariant.article_id,
      name: selectedVariant?.name || currentProduct?.name || '',
      price: Number(selectedVariant.discount_price) || 0,
      mrp: selectedVariant.mrp,
      quantity,
      size: selectedSize,
      color: String(selectedVariant.color),
      image: selectedVariant.thumbnail_url || '',
      thumbnail_url: selectedVariant.thumbnail_url || '',
      discount_percentage: selectedVariant.discount_percentage || 0,
      availableSizes: Array.from(allAvailableSizes).sort()
    });

    console.log('✅ Product added to cart successfully');
    setShowSuccessMessage(true);
    console.log('✅ Success message set to true');

    // Auto-close after 5 seconds if user doesn't click X
    setTimeout(() => {
      setShowSuccessMessage(false);
      console.log('✅ Success message auto-closed after 5 seconds');
    }, 5000);

    return true;
  }, [currentProduct, selectedSize, selectedVariant, addToCart, quantity, showAlert]);

  const handleBuyNow = useCallback(() => {
    const added = handleAddToCart();
    if (added) {
      navigate('/cart');
    }
  }, [handleAddToCart, navigate]);

  const handleWishlistToggle = useCallback(async () => {
    if (!selectedVariant || !currentProduct) return;

    const currentlyWishlisted = isInWishlist(selectedVariant.article_id);

    try {
      if (currentlyWishlisted) {
        await removeFromWishlist(selectedVariant.article_id);
      } else {
        const wishlistItem = {
          product_id: selectedVariant.product_id,
          article_id: selectedVariant.article_id,
          name: selectedVariant?.name || currentProduct.name,
          price: Number(selectedVariant.discount_price) || 0,
          mrp_price: String(selectedVariant.mrp),
          discount_price: String(selectedVariant.discount_price || 0),
          description: currentProduct.description || '',
          sub_category: currentProduct.sub_category || '',
          gender: (currentProduct.gender?.toLowerCase() as 'men' | 'women' | 'unisex') || 'unisex',
          category: currentProduct.category,
          sizes: selectedVariant.sizes || {},
          color: String(selectedVariant.color),
          discount_percentage: selectedVariant.discount_percentage || 0,
          thumbnail_url: selectedVariant.thumbnail_url || '',
          images: Array.isArray(selectedVariant.images) ? selectedVariant.images : [],
          created_at: new Date().toISOString(),
          addedAt: new Date().toISOString()
        };
        await addToWishlist(wishlistItem);
      }

      setIsWishlisted(!currentlyWishlisted);
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  }, [selectedVariant, currentProduct, addToWishlist, removeFromWishlist, isInWishlist]);

  const handleWhatsAppContact = useCallback((size: string) => {
    const productName = currentProduct?.name || '';
    const productUrl = window.location.href;
    const color = selectedVariant?.color || '';

    const message = `Hi! I'm interested in ${productName} in ${color} color, size ${size}.

Product Link: ${productUrl}

Could you please let me know when this size will be available?`;

    const whatsappUrl = `https://wa.me/918122003006?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, [currentProduct, selectedVariant]);

  // Update wishlist status when selected variant changes
  useEffect(() => {
    if (selectedVariant) {
      const wishlisted = isInWishlist(selectedVariant.article_id);
      setIsWishlisted(wishlisted);
    } else {
      setIsWishlisted(false);
    }
  }, [selectedVariant, isInWishlist]);

  return {
    isWishlisted,
    showSuccessMessage,
    setShowSuccessMessage,
    handleAddToCart,
    handleBuyNow,
    handleWishlistToggle,
    handleWhatsAppContact,
    showAlert,
    alertModal,
    closeAlert,
  };
};
