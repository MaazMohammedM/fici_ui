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
  const { currentProduct, relatedProducts, loading, error, fetchProductByArticleId, fetchRelatedProducts } = useProductStore();
  const { addToCart } = useCartStore();
  
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (article_id) {
      fetchProductByArticleId(article_id);
    }
  }, [article_id, fetchProductByArticleId]);

  useEffect(() => {
    if (currentProduct && currentProduct.variants.length > 0) {
      setSelectedColor(currentProduct.variants[0].color);
      fetchRelatedProducts(currentProduct.category, currentProduct.variants[0].product_id);
    }
  }, [currentProduct, fetchRelatedProducts]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    const selectedVariant = currentProduct?.variants.find(v => v.color === selectedColor);
    if (selectedVariant) {
      addToCart({
        product_id: selectedVariant.product_id,
        article_id: selectedVariant.article_id.split('_')[0],
        name: selectedVariant.name,
        color: selectedVariant.color,
        size: selectedSize,
        image: selectedVariant.images[0] || selectedVariant.thumbnail_url || '',
        price: parseFloat(selectedVariant.discount_price),
        mrp: parseFloat(selectedVariant.mrp_price),
        quantity,
        discount_percentage: selectedVariant.discount_percentage
      });
    }
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

  const selectedVariant = currentProduct.variants.find(v => v.color === selectedColor);
  const availableSizes = selectedVariant ? Object.keys(selectedVariant.sizes).filter(size => selectedVariant.sizes[size] > 0) : [];

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
          />

          {/* Product Details */}
          <ProductDetails
            currentProduct={currentProduct}
            selectedVariant={selectedVariant}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            availableSizes={availableSizes}
            onColorChange={setSelectedColor}
            onSizeChange={setSelectedSize}
            onQuantityChange={setQuantity}
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