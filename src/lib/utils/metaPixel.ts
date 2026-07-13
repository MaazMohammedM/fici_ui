// Meta Pixel tracking utility
// This provides a safe interface to track events with Meta Pixel

declare global {
  interface Window {
    fbq?: any;
  }
}

// Check if we're in production (ficishoes.com or www.ficishoes.com)
const isProduction = typeof window !== 'undefined' && ['ficishoes.com', 'www.ficishoes.com'].includes(window.location.hostname);

// Generate unique event_id for deduplication with Conversions API
const generateEventId = (eventName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `meta_${eventName.toLowerCase()}_${timestamp}_${random}`;
};

// Get Meta cookies (fbp, fbc) if available
const getMetaCookies = () => {
  if (typeof document === 'undefined') return { fbp: null, fbc: null };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
  };
};

// Build common payload with optional parameters
const buildCommonPayload = (eventName: string) => {
  const { fbp, fbc } = getMetaCookies();
  const payload: Record<string, any> = {
    event_id: generateEventId(eventName),
  };

  if (fbp) payload.fbp = fbp;
  if (fbc) payload.fbc = fbc;
  if (typeof window !== 'undefined') {
    payload.event_source_url = window.location.href;
  }

  return payload;
};

// Safe wrapper for fbq calls
const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (isProduction && typeof window !== 'undefined' && window.fbq) {
    const enhancedParams = {
      ...buildCommonPayload(eventName),
      ...parameters,
    };
    window.fbq('track', eventName, enhancedParams);
  } else if (!isProduction) {
    return
  }
};

// Safe wrapper for custom events
const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (isProduction && typeof window !== 'undefined' && window.fbq) {
    const enhancedParams = {
      ...buildCommonPayload(eventName),
      ...parameters,
    };
    window.fbq('trackCustom', eventName, enhancedParams);
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
    num_items?: number;
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
    contents?: Array<{ id: string; quantity: number; item_price: number }>;
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
