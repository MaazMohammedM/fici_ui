import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '@store/productStore';
import { useCartStore } from '@store/cartStore';
import { useWishlistStore } from '@store/wishlistStore';
import { trackProductVisit } from '../../../services/productAnalytics';
import FiciLoader from '@components/ui/FiciLoader';
import ProductImageGallery from './ProductImageGallery';
import ProductDetails from './ProductDetails';
import CustomerReviews from './CustomerReviews';
import RelatedProducts from './RelatedProducts';

const ProductDetailPage: React.FC = () => {
  const { article_id } = useParams<{ article_id: string }>();
  const navigate = useNavigate();
  const [isTrackingVisit, setIsTrackingVisit] = useState(false);

  const {
    currentProduct,
    relatedProducts,
    loading,
    error,
    fetchProductByArticleId,
    fetchRelatedProducts,
  } = useProductStore();

  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  // Track selected variant by its article_id (variant.article_id)
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  // Keep requested article id so we can set selection after fetch completes
  const [requestedArticleId, setRequestedArticleId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Memoized computed values for better performance
  const selectedVariant = useMemo(() => 
    currentProduct?.variants.find(v => v.article_id === selectedArticleId),
    [currentProduct, selectedArticleId]
  );


  const availableSizes = useMemo(() => {
    if (!selectedVariant?.sizes) return [];
    return Object.keys(selectedVariant.sizes).filter(s => (selectedVariant.sizes[s] ?? 0) > 0);
  }, [selectedVariant]);

  // Get full size range based on product category/subcategory
  const getFullSizeRange = useMemo(() => {
    const subcategory = currentProduct?.sub_category?.toLowerCase() || '';
    const category = currentProduct?.category?.toLowerCase() || '';
    
    // Determine if it's men's or women's based on category or subcategory
    const isMens = category.includes('men') || subcategory.includes('men');
    const isWomens = category.includes('women') || subcategory.includes('women');
    
    if (isMens) {
      return Array.from({ length: 9 }, (_, i) => (39 + i).toString()); // 39-47
    } else if (isWomens) {
      return Array.from({ length: 6 }, (_, i) => (39 + i).toString()); // 39-44
    } else {
      // Default to men's range if unclear
      return Array.from({ length: 9 }, (_, i) => (39 + i).toString()); // 39-47
    }
  }, [currentProduct]);

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

  // Track product view when product data is loaded
  useEffect(() => {
    if (currentProduct?.article_id && !isTrackingVisit) {
      setIsTrackingVisit(true);
      // Use the first variant's image if available, or fallback to empty string
      const thumbnailUrl = currentProduct.variants?.[0]?.images?.[0] || '';
      trackProductVisit({
        product_id: currentProduct.variants?.[0]?.product_id || currentProduct.article_id,
        name: currentProduct.name,
        thumbnail_url: thumbnailUrl
      }).catch(console.error);
    }
  }, [currentProduct?.article_id, isTrackingVisit, currentProduct?.name, currentProduct?.variants]);

  // Initial load from route
  useEffect(() => {
    if (article_id) {
      fetchProductByArticleId(article_id).catch(console.error);
      setRequestedArticleId(article_id);
    }
  }, [article_id, fetchProductByArticleId]);

  // When currentProduct updates, determine selection
  useEffect(() => {
    if (!currentProduct) return;

    // If we requested a specific article_id (via color click or route), prefer that if it exists in variants
    if (requestedArticleId) {
      const found = currentProduct.variants.find(v => v.article_id === requestedArticleId);
      if (found) {
        setSelectedArticleId(requestedArticleId);
        // fetch related products for that variant
        fetchRelatedProducts(currentProduct.category, found.product_id);
        setRequestedArticleId(null);
        return;
      }
      // If requested ArticleId not found in this product's variants, fall-through to default
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
    // reset size selection when product changes
    setSelectedSize('');
  }, [currentProduct, requestedArticleId]); // intentionally only when product or a pending requested id changes

  // Handler when ProductDetails color button clicked -> receives variant.article_id
  const handleColorChange = useCallback((articleId: string) => {
    // Find the variant in the current product's variants
    const variant = currentProduct?.variants.find(v => v.article_id === articleId);
    if (!variant) return;
    
    // Update the selected article ID
    setSelectedArticleId(articleId);
    // Update the URL to reflect the selected variant
    navigate(`/products/${articleId}`, { replace: true });
    // Clear size selection when changing colors
    setSelectedSize('');
    
    // Fetch related products for the selected variant
    if (currentProduct?.category) {
      fetchRelatedProducts(currentProduct.category, variant.product_id);
    }
  }, [currentProduct, navigate, fetchRelatedProducts]);

  const handleAddToCart = useCallback((): boolean => {
    if (!selectedSize) {
      alert('Please select a size');
      return false;
    }

    const selectedVariant = currentProduct?.variants.find(v => v.article_id === selectedArticleId);
    if (!selectedVariant) {
      alert('Please select a product variant');
      return false;
    }

    const productImage =
      Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
        ? selectedVariant.images[0]:
        selectedVariant.thumbnail_url || '';
    console.log(productImage);
    
    addToCart({
      product_id: selectedVariant.product_id,
      article_id: selectedVariant.article_id,
      name: currentProduct?.name || '',
      price: Number(selectedVariant.discount_price) || 0,
      mrp: selectedVariant.mrp,
      quantity,
      size: selectedSize,
      color: String(selectedVariant.color),
      image: selectedVariant.thumbnail_url || '',
      thumbnail_url: selectedVariant.thumbnail_url || '',
      discount_percentage: selectedVariant.discount_percentage || 0
    });
    
    // Show success message and return true to indicate success
    alert('Product added to cart successfully!');
    return true;
  }, [selectedArticleId, currentProduct, selectedSize, addToCart, quantity]);

  const handleBuyNow = useCallback(() => {
    const added = handleAddToCart();
    if (added) {
      navigate('/cart');
    }
  }, [handleAddToCart, navigate]);

  // Handle wishlist toggle
  // Update wishlist status when selectedVariant changes
  useEffect(() => {
    if (selectedVariant) {
      setIsWishlisted(isInWishlist(selectedVariant.article_id));
    }
  }, [selectedVariant, isInWishlist]);

  const handleWishlistToggle = useCallback(async () => {
    if (!selectedVariant || !currentProduct) return;
    
    try {
if (isInWishlist(selectedVariant.article_id)) {
        await removeFromWishlist(selectedVariant.article_id);
      } else {
        const wishlistItem = {
          product_id: selectedVariant.product_id,
          article_id: selectedVariant.article_id,
          name: currentProduct.name,
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
      // Update the local state to reflect the change
      setIsWishlisted(!isInWishlist(selectedVariant.article_id));
    } catch (error) {
      console.error('Error updating wishlist:', error);
      // Optionally show an error message to the user
    }
  }, [selectedVariant, isWishlisted, currentProduct, addToWishlist, removeFromWishlist]);

  // Update wishlist status when selected variant changes
  useEffect(() => {
    if (selectedVariant) {
      const wishlisted = isInWishlist(selectedVariant.article_id);
      setIsWishlisted(wishlisted);
    } else {
      setIsWishlisted(false);
    }
  }, [selectedVariant, isInWishlist]);

  // Ensure we have the selected variant
  const currentVariant = selectedVariant || (currentProduct?.variants?.[0]);
  if (loading || !currentProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiciLoader 
          size="xl" 
          message="Loading product details..." 
          aria-label="Loading product details"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the product you're looking for. It might have been moved or no longer available.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex-1 sm:flex-none"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return null;
  }

  return (
    <div className="bg-white">
      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Product Images */}
          <div className="mb-8 lg:mb-0">
            <ProductImageGallery
              selectedVariant={currentVariant}
              productName={currentProduct.name}
            />
          </div>

          {/* Right Column - Product Details */}
          <div className="sticky top-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <ProductDetails
                currentProduct={currentProduct}
                selectedVariant={currentVariant}
                selectedArticleId={selectedArticleId}
                selectedSize={selectedSize}
                quantity={quantity}
                availableSizes={availableSizes}
                fullSizeRange={getFullSizeRange}
                onColorChange={handleColorChange}
                onSizeChange={setSelectedSize}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onWishlistToggle={handleWishlistToggle}
                onWhatsAppContact={handleWhatsAppContact}
              />
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-gray-600 text-sm">Free Shipping</div>
                <div className="text-xs text-gray-500">On all orders</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-gray-600 text-sm">Easy Returns</div>
                <div className="text-xs text-gray-500">30-day policy</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-gray-600 text-sm">Secure Payment</div>
                <div className="text-xs text-gray-500">100% secure</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Minimal description */}
      {currentProduct.description && (
        <div className="bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-600">{currentProduct.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
        <CustomerReviews productId={selectedVariant?.product_id} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <RelatedProducts products={relatedProducts} />
          </div>
        </div>
      )}

      {/* Newsletter removed for minimal design */}
    </div>
  );
};

export default ProductDetailPage;