import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@store/cartStore';
import fallbackImage from '../../../assets/Fici Logo.png';

interface ProductCardProps {
  product: any;
  viewMode: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  const { addToCart } = useCartStore();
  
  const discountPercentage = Math.round(
    ((parseFloat(product.mrp_price) - parseFloat(product.discount_price)) / parseFloat(product.mrp_price)) * 100
  );

  // Helper function to format sizes
  const formatSizes = (sizes: Record<string, number>) => {
    if (!sizes || typeof sizes !== 'object') return 'No sizes available';
    
    const sizeEntries = Object.entries(sizes);
    if (sizeEntries.length === 0) return 'No sizes available';
    
    return sizeEntries
      .filter(([_, quantity]) => quantity > 0)
      .map(([size, quantity]) => `${size}: ${quantity}`)
      .join(', ');
  };

  // Helper function to get image URL
  const getImageUrl = (url: string) => {
    if (!url) return fallbackImage;
    return url.startsWith('http') ? url : fallbackImage;
  };

  // Get article_id without color suffix for routing
  const getArticleId = (articleId: string) => {
    return articleId.split('_')[0];
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get first available size
    const availableSizes = Object.keys(product.sizes).filter(size => product.sizes[size] > 0);
    if (availableSizes.length === 0) {
      alert('No sizes available for this product');
      return;
    }

    addToCart({
      product_id: product.product_id,
      article_id: getArticleId(product.article_id),
      name: product.name,
      color: product.color || 'Default',
      size: availableSizes[0],
      image: product.thumbnail_url || product.images?.[0] || fallbackImage,
      price: parseFloat(product.discount_price),
      mrp: parseFloat(product.mrp_price),
      quantity: 1,
      discount_percentage: discountPercentage,
      thumbnail_url: product.thumbnail_url
    });
  };

  // List view
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col lg:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
        <div className="flex-shrink-0">
          <img
            src={getImageUrl(product.thumbnail_url || product.images?.[0])}
            alt={product.name}
            className="w-32 h-32 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImage;
            }}
          />
        </div>
        
        <div className="flex-1 space-y-2">
          <Link to={`/products/${getArticleId(product.article_id)}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 line-through">₹{product.mrp_price}</span>
            <span className="text-lg font-bold text-primary">₹{product.discount_price}</span>
            {discountPercentage > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {product.category}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              {product.gender}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sizes: {formatSizes(product.sizes)}
          </p>
          
          <div className="flex gap-2">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-primary hover:bg-primary-active text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Add to Cart
            </button>
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/products/${getArticleId(product.article_id)}`}>
        <div className="relative">
          <img
            src={getImageUrl(product.thumbnail_url || product.images?.[0])}
            alt={product.name}
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImage;
            }}
          />
          
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              {discountPercentage}% OFF
            </div>
          )}
          
          <button className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full transition-colors">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </Link>
      
      <div className="p-4 space-y-2">
        <Link to={`/products/${getArticleId(product.article_id)}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 line-through">₹{product.mrp_price}</span>
          <span className="font-bold text-primary">₹{product.discount_price}</span>
        </div>
        
        <div className="flex gap-1">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {product.category}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            {product.gender}
          </span>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Sizes: {formatSizes(product.sizes)}
        </p>
        
        <button 
          onClick={handleAddToCart}
          className="w-full bg-primary hover:bg-primary-active text-white py-2 rounded text-sm transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;