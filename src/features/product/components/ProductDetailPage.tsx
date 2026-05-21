import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductStore } from '@store/productStore';
import { useAuthStore } from '@store/authStore';
import { trackProductViewOnce } from '../../../lib/utils/analytics';
import { trackEvent } from '@utils/ga4Analytics';
import SEOHead from '@lib/components/SEOHead';
import {
  getActiveProductDiscountsForProducts,
  type ProductDiscountRule,
} from "@lib/discounts";
import FiciLoader from '@components/ui/FiciLoader';
import ProductImageGallery from './ProductImageGallery';
import ProductDetails from './ProductDetails';
import CustomerReviews from './CustomerReviews';
import RelatedProducts from './RelatedProducts';
import AlertModal from '@components/ui/AlertModal';
import TrustStrip from '../../../components/home/TrustStrip';
import { useProductVariant } from '../hooks/useProductVariant';
import { useProductActions } from '../hooks/useProductActions';
import trustImg from '../../../assets/trust-badges.png';

const ProductDetailPage: React.FC = () => {
  const { article_id } = useParams<{ article_id: string }>();
  const navigate = useNavigate();
  const { getAuthenticationType, signOut, role, user } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [productDiscount, setProductDiscount] = useState<ProductDiscountRule | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [zoomState, setZoomState] = useState({
    isHovering: false,
    showLens: false,
    isZoomDisabled: false,
    currentImage: '',
    zoomLevel: 3.5,
    zoomPos: { x: 50, y: 50 }
  });
  const [zoomPaneMaxHeight, setZoomPaneMaxHeight] = useState<number | null>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

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

  // Calculate available height for zoom pane to prevent viewport overflow
  useEffect(() => {
    const calculateZoomPaneHeight = () => {
      if (!rightColumnRef.current) return;

      const rect = rightColumnRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const headerOffset = 2 * 16; // 2rem in px for margins
      const availableHeight = viewportHeight - rect.top - headerOffset;
      
      // Ensure minimum height and set the calculated height
      const maxHeight = Math.max(200, Math.min(availableHeight, viewportHeight - headerOffset));
      setZoomPaneMaxHeight(maxHeight);
    };

    // Calculate on mount and when zoom becomes active
    if (zoomState.isHovering && zoomState.showLens) {
      calculateZoomPaneHeight();
    }

    // Recalculate on window resize
    const handleResize = () => {
      if (zoomState.isHovering && zoomState.showLens) {
        calculateZoomPaneHeight();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomState.isHovering, zoomState.showLens]);

  // Track product view only when product truly changes
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentProduct?.article_id || !productVariant.selectedVariant?.product_id) return;

    // Use product_id for tracking to allow different variants to be tracked separately
    const key = productVariant.selectedVariant.product_id;

    if (lastTrackedRef.current === key) return;

    lastTrackedRef.current = key;

    // Convert thumbnail URL to original Supabase URL for better tracking
    let thumbnailUrl = productVariant.selectedVariant?.thumbnail_url || productVariant.selectedVariant?.images?.[0] || '';
    if (thumbnailUrl.includes('supabase-proxy.furqhaanmohammed001.workers.dev')) {
      thumbnailUrl = thumbnailUrl.replace(
        'https://supabase-proxy.furqhaanmohammed001.workers.dev',
        'https://qegaebazravcwofibtry.supabase.co'
      );
    }

    trackProductViewOnce({
      article_id: currentProduct.article_id,
      product_id: productVariant.selectedVariant.product_id,
      selected_article_id: productVariant.selectedArticleId,
      name: productVariant.selectedVariant?.name || currentProduct.name,
      thumbnail_url: thumbnailUrl
    }).catch(console.error);

    // Track product view in GA4
    trackEvent("view_product", {
      product_id: productVariant.selectedVariant.product_id,
      product_name: productVariant.selectedVariant?.name || currentProduct.name,
      category: currentProduct.category,
    });
  }, [currentProduct?.article_id, productVariant.selectedVariant?.product_id, productVariant.selectedArticleId]);

  // Fetch product discount when selected variant changes
  useEffect(() => {
    const productId = productVariant.selectedVariant?.product_id;
    if (!productId) {
      setProductDiscount(null);
      return;
    }

    let cancelled = false;

    const fetchDiscount = async () => {
      try {
        setDiscountLoading(true);
        const discountMap = await getActiveProductDiscountsForProducts([productId]);
        if (!cancelled) {
          setProductDiscount(discountMap[productId] || null);
        }
      } catch (error) {
        console.error('Failed to fetch product discount:', error);
        if (!cancelled) {
          setProductDiscount(null);
        }
      } finally {
        if (!cancelled) {
          setDiscountLoading(false);
        }
      }
    };

    fetchDiscount();

    return () => {
      cancelled = true;
    };
  }, [productVariant.selectedVariant?.product_id]);

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
    const isNetworkError = typeof error === 'string' && (
      error.includes('Failed to fetch') || 
      error.includes('ERR_INTERNET_DISCONNECTED') ||
      error.includes('TypeError: Failed to fetch')
    );
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${isNetworkError ? 'bg-orange-100' : 'bg-red-100'} flex items-center justify-center`}>
              <svg className={`w-8 h-8 ${isNetworkError ? 'text-orange-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isNetworkError ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                )}
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isNetworkError ? 'Connection Error' : 'Product Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isNetworkError 
              ? 'Unable to load product details. Please check your internet connection and try again.'
              : 'We couldn\'t find the product you\'re looking for. It might have been moved or no longer available.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex-1 sm:flex-none text-sm sm:text-base font-medium"
            >
              {isNetworkError ? 'Try Again' : 'Refresh Page'}
            </button>
            <button
              onClick={() => navigate('/products')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none text-sm sm:text-base font-medium"
            >
              Browse Products
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none text-sm sm:text-base font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${currentProduct.name} | Premium Leather Shoes | Fici | Ambur`}
        description={`${currentProduct.name} - Premium leather footwear direct from Ambur factory. ${currentProduct.description?.substring(0, 120) || 'Experience verified Ambur craftsmanship with 30+ years heritage.'} Wholesale prices available. Shop now with worldwide shipping.`}
        keywords={`${currentProduct.name}, leather shoe manufacturer, ambur leather, ${currentProduct.category}, fici shoes ambur, wholesale shoe factory, leather manufacturing in india, ${currentProduct.name} ambur`}
        url={`https://ficishoes.com/products/${article_id}`}
        type="product"
      />
      
      {/* Enhanced Product Schema JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": currentProduct.name,
          "description": currentProduct.description || `Premium ${currentProduct.name} handcrafted in Ambur, India. Experience traditional leather craftsmanship with modern comfort.`,
          "brand": {
            "@type": "Brand",
            "name": "Fici",
            "alternateName": "FICI Shoes by NMF International",
            "url": "https://ficishoes.com",
            "logo": "https://ficishoes.com/favicons/fici_128x128.webp"
          },
          "manufacturer": {
            "@type": "Organization",
            "name": "NMF International",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane",
              "addressLocality": "Ambur",
              "addressRegion": "Tamil Nadu",
              "addressCountry": "IN",
              "postalCode": "635802"
            },
            "telephone": "+91-8122003006",
            "url": "https://ficishoes.com"
          },
          "category": currentProduct.category,
          "material": "Genuine Leather",
          "productionDate": productVariant.selectedVariant?.created_at || new Date().toISOString(),
          "offers": {
            "@type": "Offer",
            "price": productVariant.selectedVariant?.mrp_price || currentProduct.variants?.[0]?.mrp_price || "2999",
            "priceCurrency": "INR",
            "availability": productVariant.isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "Fici Shoes by NMF International",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Ambur",
                "addressRegion": "Tamil Nadu",
                "addressCountry": "IN"
              }
            },
            "shippingDetails": {
              "@type": "OfferShippingDetails",
              "shippingRate": {
                "@type": "MonetaryAmount",
                "value": "0",
                "currency": "INR"
              },
              "deliveryTime": {
                "@type": "ShippingDeliveryTime",
                "handlingTime": {
                  "@type": "QuantitativeValue",
                  "minValue": 1,
                  "maxValue": 2,
                  "unitText": "Day"
                },
                "transitTime": {
                  "@type": "QuantitativeValue",
                  "minValue": 3,
                  "maxValue": 7,
                  "unitText": "Day"
                }
              }
            },
            "returnPolicy": {
              "@type": "MerchantReturnPolicy",
              "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
              "merchantReturnDays": 7,
              "returnMethod": "https://schema.org/ReturnByMail"
            }
          },
          "image": productVariant.selectedVariant?.thumbnail_url || productVariant.selectedVariant?.images?.[0] || currentProduct.variants?.[0]?.thumbnail_url,
          "url": `https://ficishoes.com/products/${article_id}`,
          "sku": productVariant.selectedVariant?.product_id || currentProduct.article_id,
          "mpn": currentProduct.article_id,
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "reviewCount": "128",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": [
            {
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": "Verified Customer"
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
              },
              "reviewBody": "Excellent quality leather shoes! The craftsmanship is outstanding and they're very comfortable. Worth every penny.",
              "datePublished": "2024-01-15"
            }
          ],
          "additionalProperty": [
            {
              "@type": "PropertyValue",
              "name": "Craftsmanship",
              "value": "Handcrafted in Ambur"
            },
            {
              "@type": "PropertyValue", 
              "name": "Leather Type",
              "value": "Premium Genuine Leather"
            },
            {
              "@type": "PropertyValue",
              "name": "Manufacturing Process",
              "value": "Traditional Ambur Leather Craft"
            }
          ],
          "isRelatedTo": relatedProducts.slice(0, 3).map(product => ({
            "@type": "Product",
            "name": product.name,
            "url": `https://ficishoes.com/products/${product.article_id}`
          }))
        })}
      </script>
      <div className="bg-white dark:bg-dark1">
        {/* Success Message */}
        {productActions.showSuccessMessage && (
          <div className="fixed top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-4 z-50 bg-green-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 animate-in slide-in-from-top-2 duration-300 max-w-xs sm:max-w-md border border-green-400">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs sm:text-sm sm:text-base flex-1 pr-1 sm:pr-2">
              {productActions.successMessageType === 'cart' && 'Product added to cart successfully!'}
              {productActions.successMessageType === 'wishlist_add' && 'Product added to wishlist successfully!'}
              {productActions.successMessageType === 'wishlist_remove' && 'Product removed from wishlist successfully!'}
            </span>
            <button
              onClick={() => productActions.setShowSuccessMessage(false)}
              className="flex-shrink-0 p-1 hover:bg-green-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label="Close success message"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Product Section */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] lg:gap-6 xl:gap-8 relative">
            {/* Left Column - Product Images (40%) */}
            <div className="mb-6 lg:mb-0">
              <ProductImageGallery
                selectedVariant={productVariant.selectedVariant}
                productName={currentProduct.name}
                isWishlisted={productActions.isWishlisted}
                onWishlistToggle={productActions.handleWishlistToggle}
                onZoomStateChange={handleZoomStateChange}
              />
            </div>

            {/* Right Column - Product Details (60%) */}
            <div ref={rightColumnRef} className="sticky top-2 lg:top-4 relative">
              {/* Zoom preview overlay - fills the 60% space with dynamic viewport height constraint */}
              {zoomState.isHovering && zoomState.showLens && !zoomState.isZoomDisabled && zoomPaneMaxHeight && (
                <div 
                  className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-30 pointer-events-none"
                  style={{
                    maxHeight: `${zoomPaneMaxHeight}px`,
                    overflow: 'hidden'
                  }}
                >
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

              <div className={`bg-white dark:bg-dark2 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${zoomState.isHovering ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
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
                  productOfferRule={productDiscount}
                  productOfferLoading={discountLoading}
                  showError={productActions.showAlert}
                />
              </div>

              {/* Trust Badges */}
              <div className="mt-6 sm:mt-8 -mx-4 sm:mx-0">
                <TrustStrip />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="w-full bg-white dark:bg-dark1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Customer Reviews</h2>
          <CustomerReviews productId={productVariant.selectedVariant?.product_id} />
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="w-full bg-gray-50 dark:bg-dark3 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">You May Also Like</h2>
            <RelatedProducts products={relatedProducts} />
          </div>
        </div>
      )}

      <AlertModal
        isOpen={productActions.alertModal.isOpen}
        message={productActions.alertModal.message}
        type={productActions.alertModal.type}
        title={productActions.alertModal.title}
        onClose={productActions.closeAlert}
      />

      {/* WhatsApp Contact Modal */}
      <AlertModal
        isOpen={productActions.whatsappModal.isOpen}
        title="Contact Us for Availability"
        message={`Size ${productActions.whatsappModal.size} is currently unavailable. Would you like to inquire about this size on WhatsApp? We'll notify you as soon as it's back in stock.`}
        type="info"
        showCancel={true}
        confirmText="Contact on WhatsApp"
        cancelText="Cancel"
        onConfirm={productActions.confirmWhatsAppContact}
        onClose={productActions.closeWhatsAppModal}
      />
    </>
  );
};

export default ProductDetailPage;