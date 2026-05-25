/**
 * Google Analytics 4 (GA4) tracking utility
 * Integrates with existing analytics logic and tracks product interactions
 */

// Reuse the environment check from existing analytics
const isTestEnvironment = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isNetlifyPreview = window.location.hostname.includes('netlify.app');
  
  // Check admin role from localStorage (more reliable than dynamic require)
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  
  return isAdmin || isLocalhost || isNetlifyPreview;
};

// Check if gtag is available (much simpler now)
const isGtagAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  // If function exists, we're good to go
  return typeof (window as any).gtag === 'function';
};

// Interface for event data
interface GA4EventParams {
  [key: string]: string | number | undefined;
}

/**
 * Track an event with Google Analytics 4
 * @param eventName - The name of the event to track
 * @param params - Additional parameters to include with the event
 */
export const trackEvent = (eventName: string, params: GA4EventParams = {}) => {
  // Skip tracking for admin users or development/preview environments
  if (isTestEnvironment()) {
    return;
  }

  // Check if gtag is available
  if (!isGtagAvailable()) {
    console.log(`GA4: gtag not available, skipping ${eventName} tracking`);
    return;
  }

  try {
    // Prepare event parameters with product information
    const eventParams: GA4EventParams = {
      ...params,
      // Add timestamp for debugging
      timestamp: new Date().toISOString(),
    };

    // Track the event with GA4
    (window as any).gtag('event', eventName, eventParams);
    
    // console.log(`GA4: Tracked ${eventName}`, eventParams);
  } catch (error) {
    console.error(`GA4: Error tracking ${eventName}`, error);
  }
};

/**
 * Track product view with detailed information
 * @param product - Product information
 * @param additionalParams - Additional parameters to include
 */
export const trackProductView = (product: {
  product_id?: string;
  article_id?: string;
  name?: string;
  price?: string | number;
  discount_price?: string | number;
  category?: string;
  sub_category?: string;
  brand?: string;
}, additionalParams: GA4EventParams = {}) => {
  trackEvent('view_item', {
    item_id: product.product_id || product.article_id,
    item_name: product.name,
    price: product.discount_price || product.price,
    category: product.category || product.sub_category,
    brand: product.brand || 'FICI Shoes',
    ...additionalParams,
  });
};

/**
 * Track size selection with product information
 * @param product - Product information
 * @param size - Selected size
 * @param additionalParams - Additional parameters to include
 */
export const trackSizeSelection = (product: {
  product_id?: string;
  article_id?: string;
  name?: string;
  category?: string;
  sub_category?: string;
  gender?: string;
}, size: string, additionalParams: GA4EventParams = {}) => {
  trackEvent('select_size', {
    item_id: product.product_id || product.article_id,
    item_name: product.name,
    item_category: product.category || product.sub_category,
    item_variant: size,
    custom_size: size,
    ...additionalParams,
  });
};

/**
 * Track add to cart with product and size information
 * @param product - Product information
 * @param size - Selected size
 * @param quantity - Quantity being added
 * @param price - Price (discount price if available, otherwise regular price)
 * @param additionalParams - Additional parameters to include
 */
export const trackAddToCart = (product: {
  product_id?: string;
  article_id?: string;
  name?: string;
  price?: string | number;
  discount_price?: string | number;
  category?: string;
  sub_category?: string;
}, size: string, quantity: number = 1, additionalParams: GA4EventParams = {}) => {
  const finalPrice = product.discount_price || product.price;
  
  trackEvent('add_to_cart', {
    item_id: product.product_id || product.article_id,
    item_name: product.name,
    size: size,
    quantity: quantity,
    price: finalPrice,
    value: finalPrice ? (parseFloat(finalPrice.toString()) * quantity) : undefined,
    category: product.category || product.sub_category,
    brand: 'FICI Shoes',
    ...additionalParams,
  });
};

/**
 * Track buy now action with product and size information
 * @param product - Product information
 * @param size - Selected size
 * @param quantity - Quantity being purchased
 * @param price - Price (discount price if available, otherwise regular price)
 * @param additionalParams - Additional parameters to include
 */
export const trackBuyNow = (product: {
  product_id?: string;
  article_id?: string;
  name?: string;
  price?: string | number;
  discount_price?: string | number;
  category?: string;
  sub_category?: string;
}, size: string, quantity: number = 1, additionalParams: GA4EventParams = {}) => {
  const finalPrice = product.discount_price || product.price;
  
  trackEvent('begin_checkout', {
    item_id: product.product_id || product.article_id,
    item_name: product.name,
    size: size,
    quantity: quantity,
    price: finalPrice,
    value: finalPrice ? (parseFloat(finalPrice.toString()) * quantity) : undefined,
    category: product.category || product.sub_category,
    brand: 'FICI Shoes',
    ...additionalParams,
  });
};

/**
 * Track WhatsApp contact for product inquiry
 * @param product - Product information
 * @param size - Size being inquired about (if applicable)
 * @param additionalParams - Additional parameters to include
 */
export const trackWhatsAppContact = (product: {
  product_id?: string;
  article_id?: string;
  name?: string;
}, size?: string, additionalParams: GA4EventParams = {}) => {
  trackEvent('whatsapp_contact', {
    product_id: product.product_id || product.article_id,
    product_name: product.name,
    size: size,
    contact_method: 'whatsapp',
    ...additionalParams,
  });
};

/**
 * Track search events
 * @param searchTerm - The search term used
 * @param resultCount - Number of results returned (optional)
 * @param additionalParams - Additional parameters to include
 */
export const trackSearch = (searchTerm: string, resultCount?: number, additionalParams: GA4EventParams = {}) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultCount,
    ...additionalParams,
  });
};

/**
 * Track page views (custom page view tracking beyond the automatic GA4 tracking)
 * @param pageTitle - Page title
 * @param pageLocation - Page URL
 * @param additionalParams - Additional parameters to include
 */
export const trackPageView = (pageTitle: string, pageLocation?: string, additionalParams: GA4EventParams = {}) => {
  trackEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation || (typeof window !== 'undefined' ? window.location.href : ''),
    ...additionalParams,
  });
};

/**
 * Enhanced e-commerce tracking for product impressions
 * @param products - Array of products being viewed
 * @param listName - Name of the product list (e.g., 'Search Results', 'Related Products')
 * @param additionalParams - Additional parameters to include
 */
export const trackProductImpressions = (
  products: Array<{
    product_id?: string;
    article_id?: string;
    name?: string;
    price?: string | number;
    discount_price?: string | number;
    category?: string;
    sub_category?: string;
  }>,
  listName: string,
  additionalParams: GA4EventParams = {}
) => {
  const items = products.map((product, index) => ({
    item_id: product.product_id || product.article_id,
    item_name: product.name,
    price: product.discount_price || product.price,
    category: product.category || product.sub_category,
    brand: 'FICI Shoes',
    index: index,
  }));

  trackEvent('view_item_list', {
    item_list_name: listName,
    items: JSON.stringify(items),
    ...additionalParams,
  });
};

// Export a default trackEvent for backward compatibility
export default trackEvent;
