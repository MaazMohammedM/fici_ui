import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Heart as HeartIcon, HeartOff, ArrowLeft } from 'lucide-react';
import { useWishlistStore } from '@store/wishlistStore';

export const WishlistPage: React.FC = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <HeartIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Your wishlist is empty</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Save items you love to your wishlist</p>
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Wishlist</h1>
          <div className="flex space-x-3">
            <button
              onClick={clearWishlist}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="-ml-0.5 mr-2 h-4 w-4" />
              Clear All
            </button>
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {items.map((product) => (
            <div key={product.article_id} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
                <img
                  src={product.images?.[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="h-full w-full object-cover object-center group-hover:opacity-75"
                />
                <button
                  onClick={() => removeFromWishlist(product.article_id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white dark:bg-gray-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                  <Link to={`/products/${product.article_id}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </Link>
                </h3>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ₹{product.price?.toLocaleString('en-IN')}
                </p>
                <div className="mt-4 flex justify-between">
                  <button
                    className="flex-1 mr-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                    onClick={() => removeFromWishlist(product.product_id)}
                  >
                    <HeartOff className="h-4 w-4 mr-2" />
                    <span>Remove</span>
                  </button>
                  <button
                    className="flex-1 ml-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                    onClick={() => {
                      // TODO: Add to cart functionality
                      console.log('Add to cart', product);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
