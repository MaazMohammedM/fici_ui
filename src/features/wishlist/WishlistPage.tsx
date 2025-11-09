import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Heart as HeartIcon, HeartOff, ArrowLeft } from 'lucide-react';
import { useWishlistStore } from '@store/wishlistStore';
import { useCartStore } from '@store/cartStore';
import { toast } from 'sonner';

export const WishlistPage: React.FC = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  
  const handleAddToCart = (product: any) => {
    try {
      // Extract available sizes from wishlist item's sizes field
      const availableSizes = product.sizes
        ? Object.keys(product.sizes).filter(size => (product.sizes[size] ?? 0) > 0)
        : [];

      // If no sizes available, show error
      if (availableSizes.length === 0) {
        toast.error('No sizes available for this product');
        return;
      }

      // Use the first available size as default, or user's previously selected size if available
      const defaultSize = availableSizes[0];

      const cartItem = {
        product_id: product.product_id || product.article_id,
        article_id: product.article_id,
        name: product.name,
        color: product.color || 'default',
        size: defaultSize, // Use first available size as default
        image: product.thumbnail_url || product.images?.[0] || '/placeholder-product.jpg',
        price: product.price || 0,
        mrp: product.mrp_price ? parseFloat(product.mrp_price) : (product.price || 0),
        quantity: 1,
        discount_percentage: product.discount_percentage || 0,
        thumbnail_url: product.thumbnail_url || product.images?.[0] || '/placeholder-product.jpg',
        availableSizes: availableSizes // Pass all available sizes for dropdown selection
      };

      addToCart(cartItem);
      toast.success('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <HeartIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Your wishlist is empty</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Save items you love to your wishlist</p>
            <div className="mt-4 sm:mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Your Wishlist</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={clearWishlist}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <X className="-ml-0.5 mr-2 h-4 w-4" />
              Clear All
            </button>
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => {
            // Check if product is out of stock (all sizes have 0 stock)
            const availableSizes = product.sizes
              ? Object.keys(product.sizes).filter(size => (product.sizes[size] ?? 0) > 0)
              : [];
            const isOutOfStock = availableSizes.length === 0;

            return (
              <div key={product.article_id} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700 relative">
                  <Link to={`/products/${product.article_id}`} className="block h-full w-full">
                    <img
                      src={product.thumbnail_url || product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className={`h-full w-full object-cover object-center ${isOutOfStock ? 'opacity-40' : 'group-hover:opacity-75'}`}
                    />
                  </Link>

                  {/* Out of Stock Overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 flex items-center justify-center z-5">
                      <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center backdrop-blur-sm shadow-lg border border-red-400/50">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l6-3m0 0l6 3m-6-3v12" />
                        </svg>
                        Out of Stock
                      </div>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromWishlist(product.article_id);
                      toast.success('Removed from wishlist');
                    }}
                    className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-full bg-white dark:bg-gray-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors z-20"
                    aria-label="Remove from wishlist"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className={`text-sm mb-1 ${isOutOfStock ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'} line-clamp-2`}>
                    <Link to={`/products/${product.article_id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {product.name}
                    </Link>
                  </h3>
                  <p className={`text-sm font-medium ${isOutOfStock ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    ₹{product.price?.toLocaleString('en-IN')}
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      className="w-full px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWishlist(product.article_id);
                        toast.success('Removed from wishlist');
                      }}
                    >
                      <HeartOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Remove</span>
                    </button>
                    <button
                      disabled={isOutOfStock}
                      className={`w-full px-3 py-2 text-xs sm:text-sm font-medium border rounded-md flex items-center justify-center transition-colors whitespace-nowrap ${
                        isOutOfStock
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'text-white bg-blue-600 border-transparent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isOutOfStock) {
                          handleAddToCart(product);
                        }
                      }}
                    >
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
