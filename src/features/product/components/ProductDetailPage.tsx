import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '@store/productStore';
import { useCartStore } from '@store/cartStore';
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
    fetchSingleProductByArticleId,
  } = useProductStore();

  const { addToCart } = useCartStore();

  // Track selected variant by its article_id (variant.article_id)
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  // Keep requested article id so we can set selection after fetch completes
  const [requestedArticleId, setRequestedArticleId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

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
  const handleColorChange = (articleId: string) => {
    console.log("Article",articleId);
    // set requested so after fetch we can re-select that variant
    setRequestedArticleId(articleId);
    // fetch product/variant data for that article id
    fetchSingleProductByArticleId(articleId);
    // optimistically set selectedArticleId so UI can give immediate feedback (optional)
    // setSelectedArticleId(articleId);
    // clear size
    setSelectedSize('');
  };

  const handleAddToCart = () => {
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
      color: selectedVariant.color,
      size: selectedSize,
      image: productImage,
      price: parseFloat(selectedVariant.discount_price),
      mrp: parseFloat(selectedVariant.mrp_price),
      quantity,
      discount_percentage: selectedVariant.discount_percentage,
      thumbnail_url: selectedVariant.thumbnail_url || ''
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cartpage');
  };

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

  // Determine currently selected variant object
  const selectedVariant = currentProduct.variants.find(v => v.article_id === selectedArticleId) ?? currentProduct.variants[0];
  const availableSizes = selectedVariant ? Object.keys(selectedVariant.sizes).filter(s => (selectedVariant.sizes[s] ?? 0) > 0) : [];

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
            onColorChange={handleColorChange}        // expects article_id
            onSizeChange={(s) => setSelectedSize(s)}
            onQuantityChange={(q) => setQuantity(q)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </div>

        {/* Customer Reviews */}
        <CustomerReviews />

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
};

export default ProductDetailPage;