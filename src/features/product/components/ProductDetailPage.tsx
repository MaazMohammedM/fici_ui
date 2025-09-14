import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '@store/productStore';
import { useCartStore } from '@store/cartStore';
import { useWishlistStore, type WishlistItem } from '@store/wishlistStore';
import { Heart, HeartOff } from 'lucide-react';
import ProductImageGallery from './ProductImageGallery';
import ProductDetails from './ProductDetails';
import CustomerReviews from './CustomerReviews';
import RelatedProducts from './RelatedProducts';

const ProductDetailPage: React.FC = () => {
  const { article_id } = useParams<{ article_id: string }>();
  const navigate = useNavigate();

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

  // Update wishlist status when variant changes
  useEffect(() => {
    if (selectedVariant) {
      setIsWishlisted(isInWishlist(selectedVariant.article_id));
    }
  }, [selectedVariant, isInWishlist]);

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
    const productUrl = currentProduct?.variants[0].thumbnail_url || '';
    const color = selectedVariant?.color || '';
    
    const message = `Hi! I'm interested in ${productName} in ${color} color, size ${size}. 

Product Link: ${productUrl}

Could you please let me know when this size will be available?`;
    
    const whatsappUrl = `https://wa.me/918122003006?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, [currentProduct, selectedVariant]);

  // Initial load from route
  useEffect(() => {
    if (article_id) {
      fetchProductByArticleId(article_id);
      // set requestedArticleId so selection will be honored after load
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
    console.log("Article", articleId);
    // Set the requested article ID to trigger the product fetch
    setRequestedArticleId(articleId);
    // Fetch the product details for the selected article ID
    fetchProductByArticleId(articleId);
    // Update the URL to reflect the selected variant
    navigate(`/products/${articleId}`, { replace: true });
    // Clear size selection when changing colors
    setSelectedSize('');
  }, [navigate, fetchProductByArticleId]);

  const handleAddToCart = useCallback(() => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    const selectedVariant = currentProduct?.variants.find(v => v.article_id === selectedArticleId);
    if (!selectedVariant) {
      alert('Please select a product variant');
      return;
    }

    const productImage =
      Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
        ? selectedVariant.images[0]
        : selectedVariant.thumbnail_url || '';

    addToCart({
      product_id: selectedVariant.product_id,
      // original code used article_id split — keeping that behaviour
      article_id: (selectedVariant.article_id || '').split('_')[0],
      name: selectedVariant.name,
      color: String(selectedVariant.color),
      size: selectedSize,
      image: productImage,
      price: parseFloat(selectedVariant.discount_price),
      mrp: parseFloat(selectedVariant.mrp_price),
      quantity,
      discount_percentage: selectedVariant.discount_percentage,
      thumbnail_url: selectedVariant.thumbnail_url || ''
    });
  }, [selectedSize, currentProduct, selectedArticleId, quantity, addToCart]);

  const handleBuyNow = useCallback(() => {
    handleAddToCart();
    navigate('/cart');
  }, [handleAddToCart, navigate]);

  const toggleWishlist = useCallback(() => {
    if (!selectedVariant || !currentProduct) return;
    
    if (isWishlisted) {
      removeFromWishlist(selectedVariant.article_id);
    } else {
      const wishlistItem: WishlistItem = {
        product_id: selectedVariant.product_id,
        article_id: selectedVariant.article_id,
        name: currentProduct.name || selectedVariant.name,
        price: parseFloat(selectedVariant.discount_price) || 0,
        images: Array.isArray(selectedVariant.images) 
          ? selectedVariant.images 
          : [selectedVariant.thumbnail_url || ''],
        addedAt: new Date().toISOString(),
        mrp_price: selectedVariant.mrp_price || '0',
        discount_price: selectedVariant.discount_price || '0',
        gender: (currentProduct.gender === 'men' || currentProduct.gender === 'women' 
          ? currentProduct.gender 
          : 'unisex') as 'men' | 'women' | 'unisex',
        created_at: new Date().toISOString(),
        description: currentProduct.description || '',
        sub_category: currentProduct.sub_category || '',
        category: currentProduct.category || 'Footwear',
        sizes: selectedVariant.sizes || {},
        color: String(selectedVariant.color || ''),
        discount_percentage: Number(selectedVariant.discount_percentage) || 0,
        thumbnail_url: selectedVariant.thumbnail_url || ''
      };
      
      addToWishlist(wishlistItem);
    }
    setIsWishlisted(!isWishlisted);
  }, [selectedVariant, isWishlisted, currentProduct, addToWishlist, removeFromWishlist]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-4">Product not found</h2>
          <button 
            onClick={() => navigate('/products')}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/80 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex-1 bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        {/* Wishlist button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? (
            <Heart className="w-6 h-6 text-red-500 fill-current" />
          ) : (
            <HeartOff className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors" />
          )}
        </button>
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a href="/" className="hover:text-primary">Home</a></li>
            <li>/</li>
            <li><a href="/products" className="hover:text-primary">Products</a></li>
            <li>/</li>
            <li className="text-primary">{currentProduct.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <ProductImageGallery 
            selectedVariant={selectedVariant}
            productName={currentProduct.name}
            key={selectedArticleId} // re-render when selected variant changes
          />

          {/* Product Details */}
          <ProductDetails
            currentProduct={currentProduct}
            selectedVariant={selectedVariant}
            selectedArticleId={selectedArticleId}
            selectedSize={selectedSize}
            quantity={quantity}
            availableSizes={availableSizes}
            fullSizeRange={getFullSizeRange}
            onColorChange={handleColorChange}        // expects article_id
            onSizeChange={(s) => setSelectedSize(s)}
            onQuantityChange={(q) => setQuantity(q)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onWhatsAppContact={handleWhatsAppContact}
          />
        </div>

        {/* Customer Reviews */}
        <CustomerReviews productId={selectedVariant?.product_id} />

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
};

export default ProductDetailPage;