import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';

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
// Device Info Helpers
// ========================================

/**
 * Parse browser name from user agent string
 * @param userAgent - The user agent string
 * @returns Browser name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'samsung' | 'opera' | 'unknown'
 */
export const parseBrowser = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/') || ua.includes('edge/')) return 'edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
  if (ua.includes('chrome') && !ua.includes('edg/') && !ua.includes('opr/')) return 'chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('samsung')) return 'samsung';
  return 'unknown';
};

/**
 * Parse operating system from user agent string
 * @param userAgent - The user agent string
 * @returns OS name: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown'
 */
export const parseOS = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'ios';
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
};

export const getDeviceInfo = (): DeviceMetadata => {
  if (typeof window === 'undefined') {
    return {
      screen_width: 0,
      screen_height: 0,
      viewport_width: 0,
      viewport_height: 0,
      timezone: 'UTC',
      language: 'en',
      user_agent: 'server',
      device_type: 'desktop',
      timestamp: new Date().toISOString(),
      connection_type: 'unknown',
      color_scheme: 'light',
      is_touch_device: false,
      scroll_depth_at_event: 0,
      time_on_page_seconds: 0,
    };
  }

  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const userAgent = navigator.userAgent;

  // Detect device type
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    deviceType = screenWidth < 768 ? 'mobile' : 'tablet';
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
    screen_width: screenWidth,
    screen_height: screenHeight,
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    user_agent: userAgent,
    device_type: deviceType,
    timestamp: new Date().toISOString(),
    connection_type: (navigator as any).connection?.effectiveType || 'unknown',
    color_scheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    is_touch_device: navigator.maxTouchPoints > 0,
    scroll_depth_at_event: scrollDepth,
    time_on_page_seconds: timeOnPage,
  };
};

// ========================================
// Environment Check
// ========================================

/**
 * Check if the current environment is production
 * Returns true if NOT localhost, 127.0.0.1, or netlify
 */
export const isProductionEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return !(
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('netlify')
  );
};

// ========================================
// Session ID Generator
// ========================================

let sessionId: string | null = null;

export const generateSessionId = (): string => {
  if (sessionId) {
    return sessionId;
  }

  // Try to get existing session ID from sessionStorage
  if (typeof window !== 'undefined') {
    const existingSessionId = sessionStorage.getItem('product_event_session_id');
    if (existingSessionId) {
      sessionId = existingSessionId;
      return sessionId;
    }

    // Generate new session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('product_event_session_id', sessionId);
    return sessionId;
  }

  // Fallback for server-side
  sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  return sessionId;
};

// ========================================
// Traffic Source Helper
// ========================================

export const getTrafficSource = (): { source: string; medium: string } => {
  if (typeof window === 'undefined') {
    return { source: 'direct', medium: 'direct' };
  }

  const url = window.location.href;
  const userAgent = navigator.userAgent;
  const referrer = document.referrer;

  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);

  // Check UTM parameters first
  let source = params.get('utm_source')?.toLowerCase();
  let medium = params.get('utm_medium')?.toLowerCase() || 'none';

  // If no UTM, analyze referrer
  if (!source && referrer) {
    const refHost = new URL(referrer).hostname.toLowerCase();
    if (refHost.includes('facebook')) source = 'facebook';
    else if (refHost.includes('instagram')) source = 'instagram';
    else if (refHost.includes('linkedin')) source = 'linkedin';
    else if (refHost.includes('twitter') || refHost.includes('t.co') || refHost.includes('x.com')) source = 'twitter';
    else if (refHost.includes('google.')) source = 'google';
    else if (refHost.includes('bing.')) source = 'bing';
    else if (refHost.includes('whatsapp') || refHost.includes('wa.me')) source = 'whatsapp';
    else source = refHost;
    medium = source ? 'referral' : 'none';
  }

  // If still no source, detect from user agent
  if (!source) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('whatsapp')) source = 'whatsapp';
    else if (ua.includes('instagram') || ua.includes('fb_iab')) source = 'instagram';
    else if (ua.includes('facebook')) source = 'facebook';
    else if (ua.includes('twitter') || ua.includes('x.com')) source = 'twitter';
    else if (ua.includes('linkedin')) source = 'linkedin';
    else if (ua.includes('telegram')) source = 'telegram';
    else if (ua.includes('snapchat')) source = 'snapchat';
    else if (ua.includes('pinterest')) source = 'pinterest';
    else if (ua.includes('reddit')) source = 'reddit';
    else if (ua.includes('tiktok')) source = 'tiktok';
    else if (ua.includes('youtube')) source = 'youtube';
    else if (ua.includes('outlook') || ua.includes('gmail') || ua.includes('mail')) source = 'email';
    else if (ua.includes('googlebot') || ua.includes('google')) source = 'google';
    else if (ua.includes('bingbot') || ua.includes('bing')) source = 'bing';
    else if (ua.includes('yahoo')) source = 'yahoo';
    else if (ua.includes('duckduckbot') || ua.includes('duckduckgo')) source = 'duckduckgo';
    else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) source = 'mobile_app';
    else source = 'direct';
    medium = source === 'whatsapp' ? 'social' : 'direct';
  }

  // Normalize medium
  if (medium === 'none') {
    if (['google', 'bing', 'yahoo', 'duckduckgo'].includes(source)) medium = 'search';
    else if (['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'snapchat', 'pinterest', 'reddit', 'whatsapp'].includes(source)) medium = 'social';
    else if (source === 'email') medium = 'email';
    else if (source === 'mobile_app') medium = 'mobile';
    else medium = 'direct';
  }

  return { source: source || 'direct', medium: medium || 'direct' };
};

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

// Track product view (once per page load)
const trackedViewProducts = new Set<string>();

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

  const key = product.product_id;

  // Prevent duplicate tracking
  if (trackedViewProducts.has(key)) {
    return;
  }
  trackedViewProducts.add(key);

  const { userId, guestSessionId } = getUserAndSessionInfo();
  const metadata = getDeviceInfo();
  const sessionId = generateSessionId();
  const trafficSource = getTrafficSource();

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
  const metadata = getDeviceInfo();
  const sessionId = generateSessionId();
  const trafficSource = getTrafficSource();

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
  const metadata = getDeviceInfo();
  const sessionId = generateSessionId();
  const trafficSource = getTrafficSource();

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
  const metadata = getDeviceInfo();
  const sessionId = generateSessionId();
  const trafficSource = getTrafficSource();

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
  const metadata = getDeviceInfo();
  const sessionId = generateSessionId();
  const trafficSource = getTrafficSource();

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
  const metadata = getDeviceInfo();
  const sessionId = generateSessionId();
  const trafficSource = getTrafficSource();

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
  trackedViewProducts.clear();
  lastTrackedSize = null;
};
