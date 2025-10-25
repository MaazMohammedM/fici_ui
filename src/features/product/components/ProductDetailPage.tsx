import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductDescription from "./ProductDescription";
import { useProductStore } from '@store/productStore';
import { trackProductVisit } from '../../../services/productAnalytics';
import FiciLoader from '@components/ui/FiciLoader';
import ProductImageGallery from './ProductImageGallery';
import ProductDetails from './ProductDetails';
import CustomerReviews from './CustomerReviews';
import RelatedProducts from './RelatedProducts';
import AlertModal from '@components/ui/AlertModal';
import { useProductVariant } from '../hooks/useProductVariant';
import { useProductActions } from '../hooks/useProductActions';

const ProductDetailPage: React.FC = () => {
  const { article_id } = useParams<{ article_id: string }>();
  const navigate = useNavigate();
  const [isTrackingVisit, setIsTrackingVisit] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [zoomState, setZoomState] = useState({
    isHovering: false,
    showLens: false,
    isZoomDisabled: false,
    currentImage: '',
    zoomLevel: 3.5,
    zoomPos: { x: 50, y: 50 }
  });

  const {
    currentProduct,
    relatedProducts,
    loading,
    error,
    fetchProductByArticleId,
  } = useProductStore();

  // Use custom hooks for complex state management
  const productVariant = useProductVariant({
    currentProduct,
    articleId: article_id,
  });

  const productActions = useProductActions({
    currentProduct,
    selectedVariant: productVariant.selectedVariant,
    selectedArticleId: productVariant.selectedArticleId,
    selectedSize: productVariant.selectedSize,
    quantity,
  });

  // Zoom state change handler
  const handleZoomStateChange = useCallback((state: any) => {
    setZoomState(prevState => ({
      ...prevState,
      ...state
    }));
  }, []);

  // Track product view when product data is loaded
  useEffect(() => {
    if (currentProduct?.article_id && !isTrackingVisit) {
      setIsTrackingVisit(true);
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
    }
  }, [article_id, fetchProductByArticleId]);

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

  return (
    <>
      <div className="bg-white dark:bg-dark1">
        {/* Success Message */}
        {productActions.showSuccessMessage && (
          <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 max-w-md sm:max-w-none border border-green-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm sm:text-base flex-1 pr-2">Product added to cart successfully!</span>
            <button
              onClick={() => productActions.setShowSuccessMessage(false)}
              className="flex-shrink-0 p-1 hover:bg-green-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label="Close success message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Product Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-[40%_60%] lg:gap-8 relative">
            {/* Left Column - Product Images (40%) */}
            <div className="mb-8 lg:mb-0">
              <ProductImageGallery
                selectedVariant={productVariant.selectedVariant}
                productName={currentProduct.name}
                isWishlisted={productActions.isWishlisted}
                onWishlistToggle={productActions.handleWishlistToggle}
                onZoomStateChange={handleZoomStateChange}
              />
            </div>

            {/* Right Column - Product Details (60%) */}
            <div className="sticky top-4 relative">
              {/* Zoom preview overlay - fills the 60% space */}
              {zoomState.isHovering && zoomState.showLens && !zoomState.isZoomDisabled && (
                <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-30 pointer-events-none">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${zoomState.currentImage})`,
                      backgroundSize: `${zoomState.zoomLevel * 100}%`,
                      backgroundPosition: `${zoomState.zoomPos.x}% ${zoomState.zoomPos.y}%`,
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                </div>
              )}

              <div className={`bg-white dark:bg-dark2 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${zoomState.isHovering ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
                <ProductDetails
                  currentProduct={currentProduct}
                  selectedVariant={productVariant.selectedVariant}
                  selectedArticleId={productVariant.selectedArticleId}
                  selectedSize={productVariant.selectedSize}
                  quantity={quantity}
                  availableSizes={productVariant.availableSizes}
                  fullSizeRange={productVariant.fullSizeRange}
                  onColorChange={productVariant.handleColorChange}
                  onSizeChange={productVariant.setSelectedSize}
                  onQuantityChange={setQuantity}
                  onAddToCart={productActions.handleAddToCart}
                  onBuyNow={productActions.handleBuyNow}
                  onWishlistToggle={productActions.handleWishlistToggle}
                  onWhatsAppContact={productActions.handleWhatsAppContact}
                  isWishlisted={productActions.isWishlisted}
                  isBag={productVariant.isBag}
                  isOutOfStock={productVariant.isOutOfStock}
                />
              </div>

              {/* Trust Badges */}
              <div className="mt-4">
                <img
                  src="/src/assets/trust-badges.svg"
                  alt="Trust Badges - 3 Days Exchange Policy, Made in India, Free Delivery 5-7 Days"
                  className="w-full max-w-sm mx-auto rounded-lg shadow-sm"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const fallbackElement = target.nextElementSibling as HTMLElement;
                    if (fallbackElement) {
                      target.style.display = 'none';
                      fallbackElement.style.display = 'grid';
                    }
                  }}
                />
                <div className="hidden grid grid-cols-3 gap-3 mt-4 px-4" style={{display: 'none'}}>
                  <div className="p-3 bg-gray-50 dark:bg-dark3 rounded-lg text-center">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">3 Days Exchange</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Policy</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-dark3 rounded-lg text-center">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Made in India</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Quality assured</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-dark3 rounded-lg text-center">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Free Delivery</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Within 5-7 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Customer Reviews</h2>
          <CustomerReviews productId={productVariant.selectedVariant?.product_id} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-gray-50 dark:bg-dark3 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">You May Also Like</h2>
              <RelatedProducts products={relatedProducts} />
            </div>
          </div>
        )}
      </div>

      <AlertModal
        isOpen={productActions.alertModal.isOpen}
        message={productActions.alertModal.message}
        type={productActions.alertModal.type}
        title={productActions.alertModal.title}
        onClose={productActions.closeAlert}
      />
    </>
  );
};

export default ProductDetailPage;