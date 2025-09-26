import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, ShoppingCart } from 'lucide-react';

// Lazy imports for code splitting
const CustomerReviews = React.lazy(() => import('./components/CustomerReviews'));
const RelatedProducts = React.lazy(() => import('./components/RelatedProducts'));

// Hooks and Stores
import { useProductVisit } from '../../hooks/useProductVisit';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { preloadImages } from '../../lib/utils/performance';

// Components
import SEOHead from '../../lib/components/SEOHead';

// UI Components

// Types
import type { Product } from '../../types/product';

const ProductDetailPage1: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { trackVisit } = useProductVisit();
  const { addToCart } = useCartStore();
  const { 
    currentProduct, 
    loading, 
    error, 
    fetchProductByArticleId,
    relatedProducts,
    fetchRelatedProducts
  } = useProductStore();

  // Local state
  const [selectedVariant, setSelectedVariant] = useState<Product | undefined>();
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Memoized calculations
  const availableSizes = useMemo(() => {
    if (!selectedVariant?.sizes) return [];
    return Object.entries(selectedVariant.sizes)
      .filter(([_, available]) => available)
      .map(([size]) => size);
  }, [selectedVariant?.sizes]);

  const fullSizeRange = useMemo(() => {
    if (!selectedVariant?.sizes) return [];
    return Object.keys(selectedVariant.sizes).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numA - numB;
    });
  }, [selectedVariant?.sizes]);

  // Track if component is mounted

  // Fetch product data when component mounts or productId changes
// ✅ Fixed useEffect
useEffect(() => {
  if (!productId) return;

  const loadProduct = async () => {
    try {
      await fetchProductByArticleId(productId);
    } catch (err) {
      console.error('Error loading product:', err);
    }
  };

  loadProduct();
}, [productId]); // ❌ removed fetchProductByArticleId from deps

  
  // Set selected variant when product loads
  useEffect(() => {
    if (currentProduct?.variants?.length) {
      const firstVariant = currentProduct.variants[0];
      setSelectedVariant(firstVariant);
      setSelectedArticleId(firstVariant.article_id);
      
      // Set first available size
      const firstAvailableSize = Object.entries(firstVariant.sizes || {})
        .find(([_, available]) => available)?.[0];
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize);
      }
      
      // Preload images if available
      const variantImages = currentProduct.variants.flatMap(v => 
        v.images ? v.images.filter(Boolean) : []
      );
      
      if (variantImages.length > 0) {
        preloadImages(variantImages);
      }
      
      // Track product visit
      if (productId) {
        trackVisit(productId);
      }
    }
  }, [currentProduct, productId, trackVisit]);
  
  // Fetch related products
  useEffect(() => {
    if (currentProduct?.category) {
      fetchRelatedProducts(currentProduct.category, productId!);
    }
  }, [currentProduct?.category, productId, fetchRelatedProducts]);

  // Handle variant change
  const handleColorChange = (articleId: string) => {
    const variant = currentProduct?.variants.find((v) => v.article_id === articleId);
    if (variant) {
      setSelectedVariant(variant);
      setSelectedArticleId(articleId);

      if (!variant.sizes?.[selectedSize]) {
        const firstAvailableSize = Object.entries(variant.sizes || {})
          .find(([_, available]) => available)?.[0];
        setSelectedSize(firstAvailableSize || '');
      }
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedSize) {
      alert('Please select a size');
      return;
    }

    const cartItem = {
      product_id: productId!,
      article_id: selectedVariant.article_id,
      name: currentProduct!.name,
      color: typeof selectedVariant.color === 'string' ? selectedVariant.color : String(selectedVariant.color),
      size: selectedSize,
      quantity,
      price: parseFloat(String(selectedVariant.discount_price)),
      mrp: parseFloat(selectedVariant.mrp_price),
      discount_percentage: Number(selectedVariant.discount_percentage) || 0,
      image: selectedVariant.thumbnail_url || '',
      thumbnail_url: selectedVariant.thumbnail_url || '',
    };

    addToCart(cartItem);

    const event = new CustomEvent('cart-updated', { detail: cartItem });
    window.dispatchEvent(event);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleWhatsAppContact = (size: string) => {
    const message = `Hi! I'm interested in ${currentProduct?.name} in size ${size}. Is it available?`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentProduct?.name,
          text: currentProduct?.description,
          url: window.location.href,
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

// ✅ Unified error/loading/product checks
if (loading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <img src="/src/assets/FICI Logo no background.jpg" className="h-24 w-24 animate-pulse" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product details...</p>
    </div>
  );
}

if (error || !currentProduct) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-gray-700 dark:text-gray-300 text-lg mb-4">
        {error || "Product not found"}
      </div>
      <button
        onClick={() => navigate('/')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </button>
    </div>
  );
}

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <img 
          src="/src/assets/FICI Logo no background.jpg" 
          alt="FICI Logo" 
          className="h-24 w-24 animate-pulse"
        />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Failed to load product details. Please try again later.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!currentProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-gray-700 dark:text-gray-300 text-lg mb-4">Product not found</div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The product you are looking for does not exist.'}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={currentProduct.name}
        description={currentProduct.description || `${currentProduct.name} - Premium quality footwear`}
        image={selectedVariant?.thumbnail_url}
        type="product"
        price={String(selectedVariant?.discount_price)}
        availability={availableSizes.length > 0 ? 'in stock' : 'out of stock'}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span>/</span>
            <span>{currentProduct.category}</span>
            <span>/</span>
            <span>{currentProduct.sub_category}</span>
          </nav>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={selectedVariant?.thumbnail_url}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Title + Description */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentProduct.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentProduct.description}
                </p>
              </div>

              {/* Price */}
              {selectedVariant && (
                <div className="flex items-center space-x-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₹{selectedVariant.discount_price}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    ₹{selectedVariant.mrp_price}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                    {selectedVariant.discount_percentage}% OFF
                  </span>
                </div>
              )}

              {/* Color Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Color: {selectedVariant?.color}
                </h3>
                <div className="flex space-x-3">
                  {currentProduct.variants.map((variant) => (
                    <button
                      key={variant.article_id}
                      onClick={() => handleColorChange(variant.article_id)}
                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden ${
                        selectedArticleId === variant.article_id
                          ? 'border-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={variant.thumbnail_url}
                        alt={typeof variant.color === 'string' ? variant.color : String(variant.color)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Size
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {fullSizeRange.map((size) => {
                    const isAvailable = availableSizes.includes(size);
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        onClick={() =>
                          isAvailable ? setSelectedSize(size) : handleWhatsAppContact(size)
                        }
                        className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isAvailable
                            ? 'border-gray-300 hover:border-gray-400'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Quantity
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedSize}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-4 pt-6 border-t">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16">
            <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse" />}>
              <CustomerReviews productId={productId!} />
            </Suspense>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">You may also like</h2>
              <Suspense fallback={<div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />}>
                <RelatedProducts products={relatedProducts} />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage1;