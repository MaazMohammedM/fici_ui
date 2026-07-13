import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import {
  parseBrowser,
  parseOS,
  getDeviceInfo,
  generateSessionId,
  analyzeTrafficSource,
  isProductionEnvironment,
} from '@lib/utils/trackingHelpers';

// ========================================
// TypeScript Interfaces
// ========================================

export type ProductEventType =
  | 'view_product'
  | 'size_selected'
  | 'add_to_cart'
  | 'buy_now'
  | 'wishlist'
  | 'out_of_stock_click';

export interface DeviceMetadata {
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  timezone: string;
  language: string;
  user_agent: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  timestamp: string;
  connection_type?: string;
  color_scheme?: string;
  is_touch_device?: boolean;
  scroll_depth_at_event?: number;
  time_on_page_seconds?: number;
  wishlist_action?: 'add' | 'remove';
}

export interface ProductEventPayload {
  event_type: ProductEventType;
  product_id: string;
  article_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  gender?: string;
  thumbnail_url?: string;
  user_id?: string;
  guest_session_id?: string;
  session_id: string;
  current_url: string;
  page_path: string;
  referrer: string;
  selected_size?: string | null;
  quantity?: number;
  mrp_price?: number;
  selling_price?: number;
  metadata: DeviceMetadata;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  operating_system: string;
  source: string;
  medium: string;
  campaign?: string;
}



// ========================================
// Auth & Session Helpers
// ========================================

export const getUserAndSessionInfo = (): {
  userId: string | null;
  guestSessionId: string | null;
} => {
  try {
    const authState = useAuthStore.getState();
    return {
      userId: authState.getCurrentUserId(),
      guestSessionId: authState.getCurrentSessionId(),
    };
  } catch (error) {
    console.error('Error getting auth info:', error);
    return {
      userId: null,
      guestSessionId: null,
    };
  }
};

/**
 * Build extended device metadata with product event specific fields
 * Extends the base device info with scroll depth, time on page, etc.
 */
const buildExtendedMetadata = (): DeviceMetadata => {
  const baseDeviceInfo = getDeviceInfo();
  
  if (typeof window === 'undefined') {
    return baseDeviceInfo as DeviceMetadata;
  }
  
  // Calculate scroll depth
  const scrollDepth = document.body.scrollHeight > window.innerHeight
    ? Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
    : 0;
  
  // Calculate time on page
  const timeOnPage = typeof (window as any).__pageLoadTime === 'number'
    ? Math.round((Date.now() - (window as any).__pageLoadTime) / 1000)
    : 0;
  
  return {
    ...baseDeviceInfo,
    connection_type: (navigator as any).connection?.effectiveType || 'unknown',
    color_scheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    is_touch_device: navigator.maxTouchPoints > 0,
    scroll_depth_at_event: scrollDepth,
    time_on_page_seconds: timeOnPage,
  };
};

// ========================================
// Main Tracking Function
// ========================================

export const trackProductEvent = async (payload: ProductEventPayload): Promise<void> => {
  // Fire-and-forget async tracking
  try {
    await supabase.from('product_user_events').insert(payload);
  } catch (error) {
    // Silent fail - never block UI
    console.error('Failed to track product event:', error);
  }
};

// ========================================
// Specific Event Trackers
// ========================================

// Track product view (once per session per product)
// Independent from analytics.ts to avoid conflicts
const PRODUCT_VIEWS_SESSION_KEY = 'product_user_events_views';

const getProductViewsSessionCache = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();

  try {
    const raw = sessionStorage.getItem(PRODUCT_VIEWS_SESSION_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const saveProductViewsSessionCache = (set: Set<string>) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(PRODUCT_VIEWS_SESSION_KEY, JSON.stringify([...set]));
  }
};

export const trackProductView = (product: {
  product_id: string;
  article_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  gender?: string;
  thumbnail_url?: string;
}): void => {
  // Skip tracking in development environments
  if (!isProductionEnvironment()) {
    return;
  }

  const sessionId = generateSessionId();
  const key = `${sessionId}_${product.product_id}`;

  // Prevent duplicate tracking per session per product
  const cache = getProductViewsSessionCache();
  if (cache.has(key)) {
    return;
  }
  cache.add(key);
  saveProductViewsSessionCache(cache);

  const { userId, guestSessionId } = getUserAndSessionInfo();
  const metadata = buildExtendedMetadata();
  const trafficSource = analyzeTrafficSource(
    window.location.href,
    navigator.userAgent,
    document.referrer
  );

  // Get campaign from URL params
  let campaign: string | undefined;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    campaign = urlParams.get('utm_campaign') || undefined;
  }

  const payload: ProductEventPayload = {
    event_type: 'view_product',
    product_id: product.product_id,
    article_id: product.article_id,
    product_name: product.product_name,
    category: product.category,
    sub_category: product.sub_category,
    gender: product.gender,
    thumbnail_url: product.thumbnail_url,
    user_id: userId || undefined,
    guest_session_id: guestSessionId || undefined,
    session_id: sessionId,
    current_url: typeof window !== 'undefined' ? window.location.href : '',
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    metadata,
    device_type: metadata.device_type,
    browser: parseBrowser(metadata.user_agent),
    operating_system: parseOS(metadata.user_agent),
    source: trafficSource.source,
    medium: trafficSource.medium,
    campaign,
  };

  // Fire-and-forget
  trackProductEvent(payload);
};

// Track size selection (only when size changes)
let lastTrackedSize: string | null = null;

export const trackSizeSelection = (product: {
  product_id: string;
  article_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  gender?: string;
  thumbnail_url?: string;
}, selectedSize: string): void => {
  // Skip tracking in development environments
  if (!isProductionEnvironment()) {
    return;
  }

  // Prevent duplicate tracking of same size
  if (lastTrackedSize === selectedSize) {
    return;
  }
  lastTrackedSize = selectedSize;

  const { userId, guestSessionId } = getUserAndSessionInfo();
  const metadata = buildExtendedMetadata();
  const sessionId = generateSessionId();
  const trafficSource = analyzeTrafficSource(
    window.location.href,
    navigator.userAgent,
    document.referrer
  );

  // Get campaign from URL params
  let campaign: string | undefined;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    campaign = urlParams.get('utm_campaign') || undefined;
  }

  const payload: ProductEventPayload = {
    event_type: 'size_selected',
    product_id: product.product_id,
    article_id: product.article_id,
    product_name: product.product_name,
    category: product.category,
    sub_category: product.sub_category,
    gender: product.gender,
    thumbnail_url: product.thumbnail_url,
    user_id: userId || undefined,
    guest_session_id: guestSessionId || undefined,
    session_id: sessionId,
    current_url: typeof window !== 'undefined' ? window.location.href : '',
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    selected_size: selectedSize,
    metadata,
    device_type: metadata.device_type,
    browser: parseBrowser(metadata.user_agent),
    operating_system: parseOS(metadata.user_agent),
    source: trafficSource.source,
    medium: trafficSource.medium,
    campaign,
  };

  // Fire-and-forget
  trackProductEvent(payload);
};

// Track add to cart
export const trackAddToCart = (product: {
  product_id: string;
  article_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  gender?: string;
  thumbnail_url?: string;
}, selectedSize: string | null, quantity: number, mrpPrice: number, sellingPrice: number): void => {
  // Skip tracking in development environments
  if (!isProductionEnvironment()) {
    return;
  }

  const { userId, guestSessionId } = getUserAndSessionInfo();
  const metadata = buildExtendedMetadata();
  const sessionId = generateSessionId();
  const trafficSource = analyzeTrafficSource(
    window.location.href,
    navigator.userAgent,
    document.referrer
  );

  // Get campaign from URL params
  let campaign: string | undefined;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    campaign = urlParams.get('utm_campaign') || undefined;
  }

  const payload: ProductEventPayload = {
    event_type: 'add_to_cart',
    product_id: product.product_id,
    article_id: product.article_id,
    product_name: product.product_name,
    category: product.category,
    sub_category: product.sub_category,
    gender: product.gender,
    thumbnail_url: product.thumbnail_url,
    user_id: userId || undefined,
    guest_session_id: guestSessionId || undefined,
    session_id: sessionId,
    current_url: typeof window !== 'undefined' ? window.location.href : '',
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    selected_size: selectedSize,
    quantity,
    mrp_price: mrpPrice,
    selling_price: sellingPrice,
    metadata,
    device_type: metadata.device_type,
    browser: parseBrowser(metadata.user_agent),
    operating_system: parseOS(metadata.user_agent),
    source: trafficSource.source,
    medium: trafficSource.medium,
    campaign,
  };

  // Fire-and-forget
  trackProductEvent(payload);
};

// Track buy now
export const trackBuyNow = (product: {
  product_id: string;
  article_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  gender?: string;
  thumbnail_url?: string;
}, selectedSize: string | null, quantity: number, mrpPrice: number, sellingPrice: number): void => {
  // Skip tracking in development environments
  if (!isProductionEnvironment()) {
    return;
  }

  const { userId, guestSessionId } = getUserAndSessionInfo();
  const metadata = buildExtendedMetadata();
  const sessionId = generateSessionId();
  const trafficSource = analyzeTrafficSource(
    window.location.href,
    navigator.userAgent,
    document.referrer
  );

  // Get campaign from URL params
  let campaign: string | undefined;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    campaign = urlParams.get('utm_campaign') || undefined;
  }

  const payload: ProductEventPayload = {
    event_type: 'buy_now',
    product_id: product.product_id,
    article_id: product.article_id,
    product_name: product.product_name,
    category: product.category,
    sub_category: product.sub_category,
    gender: product.gender,
    thumbnail_url: product.thumbnail_url,
    user_id: userId || undefined,
    guest_session_id: guestSessionId || undefined,
    session_id: sessionId,
    current_url: typeof window !== 'undefined' ? window.location.href : '',
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    selected_size: selectedSize,
    quantity,
    mrp_price: mrpPrice,
    selling_price: sellingPrice,
    metadata,
    device_type: metadata.device_type,
    browser: parseBrowser(metadata.user_agent),
    operating_system: parseOS(metadata.user_agent),
    source: trafficSource.source,
    medium: trafficSource.medium,
    campaign,
  };

  // Fire-and-forget
  trackProductEvent(payload);
};

// Track out of stock click
export const trackOutOfStockClick = (product: {
  product_id: string;
  article_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  gender?: string;
  thumbnail_url?: string;
}, attemptedSize: string): void => {
  // Skip tracking in development environments
  if (!isProductionEnvironment()) {
    return;
  }

  const { userId, guestSessionId } = getUserAndSessionInfo();
  const metadata = buildExtendedMetadata();
  const sessionId = generateSessionId();
  const trafficSource = analyzeTrafficSource(
    window.location.href,
    navigator.userAgent,
    document.referrer
  );

  // Get campaign from URL params
  let campaign: string | undefined;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    campaign = urlParams.get('utm_campaign') || undefined;
  }

  const payload: ProductEventPayload = {
    event_type: 'out_of_stock_click',
    product_id: product.product_id,
    article_id: product.article_id,
    product_name: product.product_name,
    category: product.category,
    sub_category: product.sub_category,
    gender: product.gender,
    thumbnail_url: product.thumbnail_url,
    user_id: userId || undefined,
    guest_session_id: guestSessionId || undefined,
    session_id: sessionId,
    current_url: typeof window !== 'undefined' ? window.location.href : '',
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    selected_size: attemptedSize,
    metadata,
    device_type: metadata.device_type,
    browser: parseBrowser(metadata.user_agent),
    operating_system: parseOS(metadata.user_agent),
    source: trafficSource.source,
    medium: trafficSource.medium,
    campaign,
  };

  // Fire-and-forget
  trackProductEvent(payload);
};

// Track wishlist add/remove
export const trackWishlist = (
  product: {
    product_id: string;
    article_id: string;
    product_name: string;
    category?: string;
    sub_category?: string;
    gender?: string;
    thumbnail_url?: string;
  },
  action: 'add' | 'remove'
): void => {
  // Skip tracking in development environments
  if (!isProductionEnvironment()) {
    return;
  }

  const { userId, guestSessionId } = getUserAndSessionInfo();
  const metadata = buildExtendedMetadata();
  const sessionId = generateSessionId();
  const trafficSource = analyzeTrafficSource(
    window.location.href,
    navigator.userAgent,
    document.referrer
  );

  // Get campaign from URL params
  let campaign: string | undefined;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    campaign = urlParams.get('utm_campaign') || undefined;
  }

  const payload: ProductEventPayload = {
    event_type: 'wishlist',
    product_id: product.product_id,
    article_id: product.article_id,
    product_name: product.product_name,
    category: product.category,
    sub_category: product.sub_category,
    gender: product.gender,
    thumbnail_url: product.thumbnail_url,
    user_id: userId || undefined,
    guest_session_id: guestSessionId || undefined,
    session_id: sessionId,
    current_url: typeof window !== 'undefined' ? window.location.href : '',
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    selected_size: null, // Not applicable for wishlist
    quantity: 1,
    metadata: {
      ...metadata,
      wishlist_action: action,
    },
    device_type: metadata.device_type,
    browser: parseBrowser(metadata.user_agent),
    operating_system: parseOS(metadata.user_agent),
    source: trafficSource.source,
    medium: trafficSource.medium,
    campaign,
  };

  // Fire-and-forget
  trackProductEvent(payload);
};

// Reset tracking state (useful for testing or when navigating between products)
export const resetTrackingState = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PRODUCT_VIEWS_SESSION_KEY);
  }
  lastTrackedSize = null;
};
