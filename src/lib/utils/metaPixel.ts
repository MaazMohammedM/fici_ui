// Meta Pixel tracking utility
// This provides a safe interface to track events with Meta Pixel

declare global {
  interface Window {
    fbq?: any;
  }
}

// Check if we're in production (only ficishoes.com)
const isProduction = typeof window !== 'undefined' && window.location.hostname === 'ficishoes.com';

// Safe wrapper for fbq calls
const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (isProduction && typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  } else if (!isProduction) {
    return
  }
};

// Safe wrapper for custom events
const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (isProduction && typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, parameters);
  } else if (!isProduction) {
  }
};

// Standard Meta Pixel events
export const metaPixelEvents = {
  // Track page view
  pageView: () => {
    trackEvent('PageView');
  },

  // Track add to cart
  addToCart: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    content_name?: string;
    contents?: Array<{ id: string; quantity: number; item_price: number }>;
  }) => {
    trackEvent('AddToCart', params);
  },

  // Track initiate checkout
  initiateCheckout: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    num_items: number;
    contents?: Array<{ id: string; quantity: number; item_price: number }>;
  }) => {
    trackEvent('InitiateCheckout', params);
  },

  // Track purchase
  purchase: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    transaction_id: string;
    num_items?: number;
    contents?: Array<{ id: string; quantity: number; item_price: number }>;
  }) => {
    trackEvent('Purchase', params);
  },

  // Track view content (product page view)
  viewContent: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    content_name?: string;
    content_category?: string;
  }) => {
    trackEvent('ViewContent', params);
  },

  // Track search
  search: (params: {
    search_string: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
  }) => {
    trackEvent('Search', params);
  },

  // Track lead (sign up, contact form, etc.)
  lead: () => {
    trackEvent('Lead');
  },

  // Track complete registration
  completeRegistration: () => {
    trackEvent('CompleteRegistration');
  },

  // Track add to wishlist
  addToWishlist: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    content_name?: string;
  }) => {
    trackEvent('AddToWishlist', params);
  },

  // Custom event tracking
  custom: (eventName: string, parameters?: Record<string, any>) => {
    trackCustomEvent(eventName, parameters);
  },
};

export default metaPixelEvents;
