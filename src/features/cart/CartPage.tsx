import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@store/cartStore";
import { useWishlistStore } from "@store/wishlistStore";
import { usePincodeStore } from "@store/pincodeStore";
import CartItemCard from "./components/CartItemCard";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import AlertModal from "@components/ui/AlertModal";
import { supabase } from "@lib/supabase";
import { toast } from 'sonner';
import { validateCartItems } from '@lib/utils/productValidation';
import { parseProductSizes } from '@lib/productAvailability';
import { validateCartItemStock } from '@lib/stock/stockValidator';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items: cartItems, 
    removeFromCart, 
    updateQuantity, 
    updateSize,
    updateProductDetails,
    getCartTotal, 
    getCartSavings,
    getTotalMrp,
    clearCart
  } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const { checkServiceabilityAvailable } = usePincodeStore();

  const [filteredCartItems, setFilteredCartItems] = useState(cartItems);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });
  const [isServiceabilityAvailable, setIsServiceabilityAvailable] = useState<boolean | null>(null);
  const [serviceabilityLoading, setServiceabilityLoading] = useState(true);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsUpdateTrigger, setProductDetailsUpdateTrigger] = useState(0);
  
  // Store stable reference to productDetails to prevent infinite loops
  const productDetailsRef = useRef(productDetails);
  productDetailsRef.current = productDetails;
  
  // Store stable reference to loading state to prevent infinite loops
  const productDetailsLoadingRef = useRef(productDetailsLoading);
  productDetailsLoadingRef.current = productDetailsLoading;
  
  // Store stable reference to updateProductDetails to prevent infinite loops
  const updateProductDetailsRef = useRef(updateProductDetails);
  updateProductDetailsRef.current = updateProductDetails;

  // Trigger updates when productDetails actually changes
  useEffect(() => {
    setProductDetailsUpdateTrigger(prev => prev + 1);
  }, [productDetails]);

  // Handler to validate cart before checkout
  const handleProceedToCheckout = () => {
    // Check if serviceability is available first
    if (isServiceabilityAvailable === false) {
      setAlertModal({
        isOpen: true,
        message: 'Checkout is not available at the moment. Our delivery services are temporarily unavailable. Kindly come back later or contact our customer support for assistance.',
        type: 'error'
      });
      return;
    }

    // Check if serviceability is still loading
    if (serviceabilityLoading) {
      setAlertModal({
        isOpen: true,
        message: 'We are checking delivery availability. Please wait a moment and try again.',
        type: 'info'
      });
      return;
    }

    // Validate cart items with specific messaging
    const validation = validateCartItems(cartItems, productDetails);
    if (validation.invalidItems.length > 0) {
      // Build specific messages for each invalid item
      const itemMessages: string[] = [];
      
      validation.invalidItems.forEach(item => {
        const result = validation.validationResults[item.id];
        if (result && result.errors.length > 0) {
          const stock = result.stock;
          if (stock) {
            if (stock.availableQty === 0) {
              // True out of stock
              itemMessages.push(`"${item.name}" (Size ${item.size}) is out of stock. Please remove or move to wishlist.`);
            } else if (stock.availableQty < item.quantity) {
              // Quantity exceeds available stock
              itemMessages.push(`"${item.name}" (Size ${item.size}): Only ${stock.availableQty} unit${stock.availableQty !== 1 ? 's' : ''} available, but you have added ${item.quantity}. Please reduce quantity to ${stock.availableQty} to continue.`);
            } else {
              // Other stock issues
              itemMessages.push(`"${item.name}" (Size ${item.size}): ${result.errors.join(', ')}. Please adjust or remove from cart.`);
            }
          } else {
            // Fallback for general validation errors
            itemMessages.push(`"${item.name}" needs attention: ${result.errors.join(', ')}.`);
          }
        }
      });

      setAlertModal({
        isOpen: true,
        message: `Some items need your attention before checkout:\n\n${itemMessages.join('\n\n')}`,
        type: 'warning'
      });
      return;
    }
    navigate('/checkout');
  }

  // Filter and validate cart items
  useEffect(() => {
    if (cartItems.length === 0) {
      setFilteredCartItems([]);
      setValidationResults({});
      return;
    }

    const validation = validateCartItems(cartItems, productDetailsRef.current);
    setFilteredCartItems(validation.validItems);
    setValidationResults(validation.validationResults);

    // Only show toast notifications for invalid items on initial load, not on quantity changes
    // This prevents showing stock errors when user is reducing quantity
    if (Object.keys(productDetailsRef.current).length === 0) {
      Object.entries(validation.validationResults).forEach(([itemId, result]) => {
        if (!result.isValid && result.errors.length > 0) {
          const item = cartItems.find(item => item.id === itemId);
          if (item) {
            result.errors.forEach(error => {
              toast.error(`"${item.name}": ${error}`);
            });
          }
        }
      });
    }
  }, [cartItems, productDetailsUpdateTrigger]);

  // Check serviceability availability on component mount
  useEffect(() => {
    const checkServiceability = async () => {
      try {
        setServiceabilityLoading(true);
        const isAvailable = await checkServiceabilityAvailable();
        setIsServiceabilityAvailable(isAvailable);
      } catch (error) {
        // On error, assume serviceability is available to avoid blocking users
        setIsServiceabilityAvailable(true);
      } finally {
        setServiceabilityLoading(false);
      }
    };

    checkServiceability();
  }, [checkServiceabilityAvailable]);

    // Load product details and set up real-time updates
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!cartItems.length || productDetailsLoadingRef.current) return;

      setProductDetailsLoading(true);

      try {
      // Extract UUIDs and create a map of UUID to full cart item IDs
      const uuidToCartIds: Record<string, string> = {};
      const productIds = cartItems.map(item => {
        // Extract the full UUID (first 36 characters of the cart item ID)
        const uuid = item.id.substring(0, 36);
        uuidToCartIds[uuid] = item.id; // Map UUID back to full cart item ID
        return uuid;
      });

      // Only proceed if we have valid UUIDs (36 characters)
      const validUuids = productIds.filter(id => id.length >= 36);
      
      let products: any[] = [];
      
      // Try UUID-based fetch first
      if (validUuids.length > 0) {
        try {
          
          // Use .or() with multiple .eq() conditions instead of .in() for better UUID handling
          let query = supabase
            .from('products')
            .select('*');

          // Add each UUID as a separate condition
          validUuids.forEach((uuid, index) => {
            if (index === 0) {
              query = query.or(`product_id.eq.${uuid}`);
            } else {
              query = query.or(`product_id.eq.${uuid}`, { foreignTable: '' });
            }
          });

          const { data: uuidProducts, error } = await query;

          if (error) {
            // Error handled silently
          } else {
            products = uuidProducts || [];
          }
        } catch (error) {
        }
      } else {
      }

      // Always try fallback by article_id to ensure we get product details
      const articleIds = cartItems.map(item => item.article_id).filter(Boolean);
      
      if (articleIds.length > 0) {
        try {
          const { data: fallbackProducts, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .in('article_id', articleIds);
            
          if (fallbackError) {
            // Error handled silently
          } else {
            
            // Merge with UUID products (avoid duplicates)
            const existingIds = new Set(products.map(p => p.product_id));
            const newProducts = (fallbackProducts || []).filter(p => !existingIds.has(p.product_id));
            products = [...products, ...newProducts];
            
          }
        } catch (error) {
        }
      }

      if (products.length === 0) {
        return;
      }

      // Update product details
      const details = products.reduce((acc, product) => {
        // Try UUID mapping first
        let cartItemId = uuidToCartIds[product.product_id];
        
        // If UUID mapping fails, try article_id mapping
        if (!cartItemId) {
          const cartItem = cartItems.find(item => item.article_id === product.article_id);
          if (cartItem) {
            cartItemId = cartItem.id;
          }
        }
        
        if (cartItemId) {
          return {
            ...acc,
            [cartItemId]: product // Use the full cart item ID as the key
          };
        }
        return acc;
      }, {});

      setProductDetails(prev => ({
        ...prev,
        ...details
      }));

      // Update cart items with latest prices and details
      products.forEach(product => {
        const cartItemId = uuidToCartIds[product.product_id];
        if (cartItemId) {
          const cartItem = cartItems.find(item => item.id === cartItemId);
          if (cartItem) {
            const currentPrice = cartItem.price;
            const newPrice = parseFloat(product.discount_price || product.mrp_price || product.price || '0');
            
            // Only update if price actually changed to prevent infinite loops
            if (!isNaN(newPrice) && currentPrice !== newPrice) {
              updateProductDetailsRef.current(product);
            }
          }
        }
      });

        // Handle inactive products
        products
          .filter(p => p.is_active === false)
          .forEach(product => {
            const cartItemId = uuidToCartIds[product.product_id];
            if (cartItemId) {
              removeFromCart(cartItemId);
              toast.error(`"${product.name}" is no longer available and has been removed from your cart`);
            }
          });

      } finally {
        setProductDetailsLoading(false);
      }
    };

    loadProductDetails();

    // Set up real-time subscription for product updates
    if (cartItems.length > 0) {
      const uniqueUuids = [...new Set(cartItems.map(item => item.id.substring(0, 36)))]
        .filter(uuid => uuid.length >= 36) // Only valid UUIDs
        .slice(0, 5);

      if (uniqueUuids.length > 0) {
        const channel = supabase
          .channel('cart_product_updates')
          .on('postgres_changes', 
            { 
              event: 'UPDATE',
              schema: 'public',
              table: 'products',
              filter: `product_id=in.(${uniqueUuids.map(uuid => `"${uuid}"`).join(',')})`
            }, 
            (payload) => {
              const updatedProduct = payload.new;
              // Update product details in state
              const cartItem = cartItems.find(item => item.id.includes(updatedProduct.product_id));
              if (cartItem) {
                setProductDetails(prev => ({
                  ...prev,
                  [cartItem.id]: updatedProduct
                }));
                
                // Update cart items in local storage with new prices
                updateProductDetailsRef.current(updatedProduct);
                
                // Show notification to user about price change
                const currentPrice = cartItem.price;
                const newPrice = parseFloat(updatedProduct.discount_price || updatedProduct.mrp_price || updatedProduct.price || '0');
                
                if (!isNaN(newPrice) && currentPrice !== newPrice) {
                  if (newPrice < currentPrice) {
                    toast.success(`Good news! "${updatedProduct.name}" price dropped to ₹${newPrice.toLocaleString('en-IN')}`);
                  } else if (newPrice > currentPrice) {
                    toast.warning(`Price update: "${updatedProduct.name}" is now ₹${newPrice.toLocaleString('en-IN')}`);
                  }
                }
                
                // Handle inactive products
                if (updatedProduct.is_active === false) {
                  removeFromCart(cartItem.id);
                  toast.error(`"${updatedProduct.name}" is no longer available and has been removed from your cart`);
                }
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [cartItems, removeFromCart]);

  // Filter cart items to remove inactive products
  useEffect(() => {
    const filtered = cartItems.filter(item => {
      const product = productDetailsRef.current[item.id];
      return product ? product.is_active !== false : true;
    });
    setFilteredCartItems(filtered);
  }, [cartItems, productDetailsUpdateTrigger]);

  // Validate cart items
  useEffect(() => {
    const results = validateCartItems(cartItems, productDetailsRef.current);
    setValidationResults(results);
  }, [cartItems, productDetailsUpdateTrigger]);

  const handleMoveToWishlist = (item: typeof cartItems[0]) => {
    // Convert cart item to wishlist item format
    const wishlistItem = {
      article_id: item.article_id,
      name: item.name,
      price: item.price,
      images: [item.thumbnail_url || item.image],
      color: String(item.color),
      size: item.size,
      discount_percentage: item.discount_percentage,
      thumbnail_url: item.thumbnail_url,
      category: '',
      sub_category: '',
      description: '',
      gender: 'unisex' as const,
      mrp_price: String(item.mrp),
      discount_price: String(item.price),
      created_at: new Date().toISOString(),
      sizes: {},
      product_id: item.product_id,
      addedAt: new Date().toISOString()
    };
    
    addToWishlist(wishlistItem);
    removeFromCart(item.id);
    toast.success('Item moved to wishlist');
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      
      // Only check stock limits when increasing quantity, not when decreasing
      if (delta > 0) {
        const product = productDetails[item.id];
        if (product) {
          const stock = validateCartItemStock(product, {
            size: item.size,
            quantity: newQuantity,
          });
          
          if (stock.issues.includes('QUANTITY_EXCEEDED')) {
            // Auto-reduce to available quantity
            const adjustedQuantity = Math.max(1, stock.availableQty);
            updateQuantity(id, adjustedQuantity);
            
            // Show notification to user
            toast.error(`"${item.name}": Only ${stock.availableQty} available in size ${item.size}, but you requested ${newQuantity}. Quantity updated to ${stock.availableQty}.`);
            return;
          }
        }
      }
      
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    setAlertModal({
      isOpen: true,
      message: 'Are you sure you want to clear your cart?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await clearCart();
          toast.success('Cart cleared successfully');
        } catch (error) {
          toast.error('Failed to clear cart');
        } finally {
          setAlertModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Calculate detailed summary
  const subtotal = getCartTotal();
  const mrpTotal = getTotalMrp();
  const savings = getCartSavings();
  const total = subtotal;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {filteredCartItems.length === 0 ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
          {/* Header integrated with empty cart */}
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/')}
                className="btn-modern btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center text-text-primary dark:text-text-inverse mb-2">
              Your Shopping Cart
            </h1>
            <p className="text-center text-text-secondary dark:text-text-muted mb-12">
              {filteredCartItems.length} item{filteredCartItems.length > 1 ? 's' : ''} in your cart
            </p>
            
            <div className="max-w-lg mx-auto text-center">
              {/* Animated Shopping Bag Icon */}
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-blue-200 dark:bg-blue-800 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <ShoppingBag className="relative w-32 h-32 text-blue-500 dark:text-blue-400 mx-auto" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Your cart is empty!
              </h3>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                Ready to discover amazing products? Start shopping and fill your cart with items you'll love!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/products')}
                  className="btn-modern btn-primary px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Start Shopping
                  </span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="btn-modern btn-secondary px-8 py-4 text-lg font-semibold"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/')}
                className="btn-modern btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center text-text-primary dark:text-text-inverse mb-2">
              Your Shopping Cart
            </h1>
            <p className="text-center text-text-secondary dark:text-text-muted mb-8">
              {filteredCartItems.length} item{filteredCartItems.length > 1 ? 's' : ''} in your cart
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Cart Items
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Cart
                  </button>
                </div>
                
                {filteredCartItems.map(item => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                    onMoveToWishlist={handleMoveToWishlist}
                    onOpenProduct={() => navigate(`/products/${item.article_id}`)}
                    productDetails={productDetails[item.id]}
                    validationResults={validationResults}
                  />
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="card-modern p-6 border-2 border-blue-200 dark:border-blue-800 sticky top-24 bg-white dark:bg-gray-900">
                  <h3 className="text-2xl font-bold text-center text-text-primary dark:text-text-inverse mb-6">
                    Order Summary
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary dark:text-muted">MRP</span>
                        <span className="text-primary dark:text-inverse">
                          ₹{mrpTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between items-center text-success">
                          <span>You Save</span>
                          <span>-₹{savings.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-secondary dark:text-muted">Items ({filteredCartItems.length})</span>
                        <span className="font-semibold text-primary dark:text-inverse">
                          ₹{subtotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 dark:border-gray-600">
                      <span className="text-xl font-bold text-primary dark:text-inverse">Total</span>
                      <span className="text-2xl font-bold text-primary dark:text-inverse">
                        ₹{total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Unavailable Message */}
                  {isServiceabilityAvailable === false && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                            Checkout Temporarily Unavailable
                          </h3>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Our delivery services are temporarily unavailable. Kindly come back later or contact our customer support for assistance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleProceedToCheckout}
                    className={`btn-modern w-full text-lg relative ${
                      filteredCartItems.length === 0 
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60' 
                        : serviceabilityLoading 
                          ? 'bg-blue-400 dark:bg-blue-600 text-white cursor-wait opacity-80' 
                          : isServiceabilityAvailable === false 
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={filteredCartItems.length === 0 || serviceabilityLoading || isServiceabilityAvailable === false}
                  >
                  <span className={`flex items-center justify-center gap-2 ${
                    serviceabilityLoading ? 'animate-pulse' : ''
                  }`}>
                    {serviceabilityLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 818 8 018 8 018z"></path>
                        </svg>
                        Checking Availability...
                      </>
                    ) : isServiceabilityAvailable === false ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Checkout Unavailable
                      </>
                    ) : filteredCartItems.length === 0 ? (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Add Items to Cart
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
        
                <p className="text-xs text-muted text-center mt-3">
                  Secure checkout powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
      
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertModal.onConfirm}
        showCancel={!!alertModal.onConfirm}
      />
    </main>
  );
};

export default CartPage;