import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlistStore } from '@store/wishlistStore';
import { useCartStore } from '@store/cartStore';
import { useAuthStore } from '@store/authStore';
import { validateCartItemStock } from '@lib/stock/stockValidator';
import { showAlert } from '@lib/utils/alertUtils';
import metaPixelEvents from '@/lib/utils/metaPixel';
import { trackWishlist } from '@utils/productEventTracker';
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
  const [successMessageType, setSuccessMessageType] = useState<'cart' | 'wishlist_add' | 'wishlist_remove'>('cart');
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean;
    size: string;
  }>({ isOpen: false, size: '' });

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

    if (!selectedSize) {
      showAlert('Please select a size', 'warning');
      return false;
    }

    if (!selectedVariant) {
      showAlert('Please select a product variant', 'warning');
      return false;
    }

    // Check available quantity for selected size
    const availableQty = selectedVariant.sizes?.[selectedSize] || 0;
    
    // If no stock available, show out of stock message
    if (availableQty === 0) {
      showAlert(`This product is out of stock in size ${selectedSize}.`, 'warning');
      return false;
    }
    
    // If requested quantity exceeds available stock
    if (quantity > availableQty) {
      showAlert(`Only ${availableQty} item${availableQty !== 1 ? 's' : ''} available in size ${selectedSize}, but you requested ${quantity}. Please reduce the quantity.`, 'warning');
      return false;
    }

    // Additional validation: ensure quantity is at least 1
    if (quantity < 1) {
      showAlert('Quantity must be at least 1', 'warning');
      return false;
    }

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
      discount_price: Number(selectedVariant.discount_price) || 0, // Added discount_price
      mrp: selectedVariant.mrp,
      quantity,
      size: selectedSize,
      color: String(selectedVariant.color),
      image: selectedVariant.thumbnail_url || '',
      thumbnail_url: selectedVariant.thumbnail_url || '',
      discount_percentage: selectedVariant.discount_percentage || 0,
      availableSizes: Array.from(allAvailableSizes).sort()
    });

    // Track AddToCart event with Meta Pixel
    metaPixelEvents.addToCart({
      content_ids: [selectedVariant.product_id],
      content_type: 'product',
      value: Number(selectedVariant.discount_price) || 0,
      currency: 'INR',
      content_name: selectedVariant?.name || currentProduct?.name || '',
      contents: [{
        id: selectedVariant.product_id,
        quantity: quantity,
        item_price: Number(selectedVariant.discount_price) || 0
      }]
    });

    setSuccessMessageType('cart');
    setShowSuccessMessage(true);

    // Auto-close after 5 seconds if user doesn't click X
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);

    return true;
  }, [currentProduct, selectedSize, selectedVariant, quantity, addToCart, showAlert]);

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
        setIsWishlisted(false);
        setSuccessMessageType('wishlist_remove');
        setShowSuccessMessage(true);

        // Track wishlist removal
        let thumbnailUrl = selectedVariant?.thumbnail_url || selectedVariant?.images?.[0] || '';
        if (thumbnailUrl.includes('supabase-proxy.furqhaanmohammed001.workers.dev')) {
          thumbnailUrl = thumbnailUrl.replace(
            'https://supabase-proxy.furqhaanmohammed001.workers.dev',
            'https://qegaebazravcwofibtry.supabase.co'
          );
        }

        trackWishlist({
          product_id: selectedVariant.product_id,
          article_id: currentProduct.article_id,
          product_name: selectedVariant?.name || currentProduct.name,
          category: currentProduct.category,
          sub_category: currentProduct.sub_category,
          gender: currentProduct.gender,
          thumbnail_url: thumbnailUrl,
        }, 'remove');

        // Auto-close after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
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
        setIsWishlisted(true);
        setSuccessMessageType('wishlist_add');
        setShowSuccessMessage(true);

        // Track wishlist addition
        let thumbnailUrl = selectedVariant?.thumbnail_url || selectedVariant?.images?.[0] || '';
        if (thumbnailUrl.includes('supabase-proxy.furqhaanmohammed001.workers.dev')) {
          thumbnailUrl = thumbnailUrl.replace(
            'https://supabase-proxy.furqhaanmohammed001.workers.dev',
            'https://qegaebazravcwofibtry.supabase.co'
          );
        }

        trackWishlist({
          product_id: selectedVariant.product_id,
          article_id: currentProduct.article_id,
          product_name: selectedVariant?.name || currentProduct.name,
          category: currentProduct.category,
          sub_category: currentProduct.sub_category,
          gender: currentProduct.gender,
          thumbnail_url: thumbnailUrl,
        }, 'add');

        // Auto-close after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      showAlert('Failed to update wishlist. Please try again.', 'error');
    }
  }, [selectedVariant, currentProduct, addToWishlist, removeFromWishlist, isInWishlist, showAlert]);

  const handleWhatsAppContact = useCallback((size: string) => {
    setWhatsappModal({ isOpen: true, size });
  }, []);

  const confirmWhatsAppContact = useCallback(() => {
    const { size } = whatsappModal;
    const productName = currentProduct?.name || '';
    const productUrl = window.location.href;
    const color = selectedVariant?.color || '';

    const message = `Hi! I'm interested in ${productName} in ${color} color, size ${size}.

Product Link: ${productUrl}

Could you please let me know when this size will be available?`;

    const whatsappUrl = `https://wa.me/918122003006?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setWhatsappModal({ isOpen: false, size: '' });
  }, [whatsappModal, currentProduct, selectedVariant]);

  const closeWhatsAppModal = useCallback(() => {
    setWhatsappModal({ isOpen: false, size: '' });
  }, []);

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
    successMessageType,
    setShowSuccessMessage,
    handleAddToCart,
    handleBuyNow,
    handleWishlistToggle,
    handleWhatsAppContact,
    confirmWhatsAppContact,
    closeWhatsAppModal,
    whatsappModal,
    showAlert,
    alertModal,
    closeAlert,
  };
};
