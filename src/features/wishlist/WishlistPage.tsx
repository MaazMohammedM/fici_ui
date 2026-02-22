import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Heart as HeartIcon, HeartOff, ArrowLeft } from 'lucide-react';
import { useWishlistStore } from '@store/wishlistStore';
import { useCartStore } from '@store/cartStore';
import { toast } from 'sonner';
import { supabase } from '@lib/supabase';
import { parseProductSizes } from '@lib/productAvailability';
import { validateCartItemStock } from '@lib/stock/stockValidator';
import { getImageForUseCase } from '../../lib/utils/imageOptimization';

export const WishlistPage: React.FC = () => {
  const { items: wishlist, removeFromWishlist, addToWishlist, updateProductDetails, clearWishlist } = useWishlistStore();
  const [filteredWishlist, setFilteredWishlist] = useState(wishlist);
  const { addToCart } = useCartStore();
  const [banner, setBanner] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filter out inactive products and update when wishlist changes
  useEffect(() => {
    setFilteredWishlist(wishlist.filter(item => item.is_active !== false));
  }, [wishlist]);

  // Refresh wishlist data from database on mount to ensure current stock levels
  useEffect(() => {
    const refreshWishlistData = async () => {
      if (!wishlist.length) return;
      
      try {
        const productIds = wishlist.map(item => item.product_id);
        
        // Fetch current product data from database
        const { data: currentProducts, error } = await supabase
          .from('products')
          .select('*')
          .in('product_id', productIds);
          
        if (error) {
          return;
        }
        
        // Update each wishlist item with current database data
        currentProducts?.forEach(product => {
          updateProductDetails({
            ...product,
            product_id: product.product_id,
            article_id: product.article_id
          });
        });
        
      } catch (error) {
        // Error refreshing wishlist data
      }
    };
    
    refreshWishlistData();
  }, [wishlist.length]); // Only run when wishlist length changes

  // Set up real-time subscription for product updates
  useEffect(() => {
    if (!wishlist.length) return;

    const productIds = wishlist.map(item => item.product_id);
    const channel = supabase
      .channel('product_updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `product_id=in.(${productIds.join(',')})`
        }, 
        (payload) => {
          const updatedProduct = payload.new;
          
          // If product is now inactive, remove it from wishlist
          if (updatedProduct.is_active === false) {
            removeFromWishlist(updatedProduct.product_id);
            toast.error(`${updatedProduct.name} is no longer available and has been removed from your wishlist`);
          } else {
            // Otherwise, update the product details
            updateProductDetails(updatedProduct);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wishlist, removeFromWishlist, updateProductDetails]);

  const handleAddToCart = (product: any) => {
    try {
      // Parse sizes properly to handle triple-escaped JSON
      const parsedSizes = parseProductSizes(product.sizes);
      const availableSizes = Object.keys(parsedSizes).filter(size => (parsedSizes[size] ?? 0) > 0);

      // If no sizes available, mark as currently unavailable
      if (availableSizes.length === 0) {
        setBanner({ type: 'error', message: 'This product is currently unavailable. Please check back later.' });
        return;
      }

      const preferredSize = availableSizes[0];

      // Canonical stock validation for move-to-cart eligibility
      const stock = validateCartItemStock(product, {
        size: preferredSize,
        quantity: 1,
      });

      if (!stock.isActive) {
        setBanner({ type: 'error', message: 'This product is no longer available.' });
        return;
      }

      if (!stock.selectedSizeInStock || stock.issues.includes('SIZE_OUT_OF_STOCK')) {
        setBanner({ type: 'error', message: `Size ${preferredSize} is currently unavailable.` });
        return;
      }

      // Handle both string and array image formats
      const getFirstImage = () => {
        if (!product.images) return '';
        if (Array.isArray(product.images)) return product.images[0] || '';
        if (typeof product.images === 'string') return product.images.split(',')[0] || '';
        return '';
      };

      const cartItem = {
        product_id: product.product_id || product.id,
        article_id: product.article_id,
        name: product.name,
        color: product.color || 'default',
        size: preferredSize,
        image: getFirstImage(),
        price: parseFloat(product.price || 0),
        mrp: parseFloat(product.mrp_price || product.price || 0),
        discount_price: parseFloat(product.discount_price || product.price || 0),
        quantity: 1,
        discount_percentage: product.discount_percentage || 0,
        thumbnail_url: product.thumbnail_url || getFirstImage(),
        availableSizes,
        is_active: product.is_active !== false
      };

      addToCart(cartItem);
      setBanner({ type: 'success', message: 'Product added to cart successfully!' });
    } catch (error) {
      setBanner({ type: 'error', message: 'Failed to add to cart' });
    }
  };

  if (filteredWishlist.length === 0) {
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
        {banner && (
          <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md sm:max-w-none border ${
            banner.type === 'success'
              ? 'bg-green-500 text-white border-green-400'
              : 'bg-red-500 text-white border-red-400'
          }`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={banner.type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
              />
            </svg>
            <span className="text-sm sm:text-base flex-1 pr-2">{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/70"
              aria-label="Close message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
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
          {filteredWishlist.map((product) => {
            // Parse sizes properly to handle triple-escaped JSON
            const parsedSizes = parseProductSizes(product.sizes);
            const availableSizes = Object.keys(parsedSizes).filter(size => (parsedSizes[size] ?? 0) > 0);
            const isOutOfStock = availableSizes.length === 0;

            return (
              <div key={product.article_id} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700 relative">
                  <Link to={`/products/${product.article_id}`} className="block h-full w-full relative z-10">
                    <img
                      src={getImageForUseCase(product.thumbnail_url || product.images?.[0] || '/placeholder-product.jpg', 'LISTING')}
                      alt={product.name}
                      className={`h-full w-full object-cover object-center ${isOutOfStock ? 'opacity-40' : 'group-hover:opacity-75'}`}
                      loading="lazy"
                    />
                  </Link>

                  {/* Out of Stock Overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 flex items-center justify-center z-20 pointer-events-none">
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
