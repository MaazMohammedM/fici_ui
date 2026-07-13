import { supabase } from '../supabase';
import {
  analyzeTrafficSource,
  generateSessionId,
  getDeviceInfo,
  parseBrowser,
  parseOS,
  isProductionEnvironment,
} from './trackingHelpers';


// Update traffic source with enhanced analysis
// Tracks only landing visit per session with comprehensive metadata
export const updateTrafficSource = async (url: string, userAgent: string, referrer: string) => {
  // Skip tracking in development environments
  if (!isProductionEnvironment()) {
    return true;
  }

  const analysis = analyzeTrafficSource(url, userAgent, referrer);
  const deviceInfo = getDeviceInfo();
  const sessionId = generateSessionId();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : url;
  const pagePath = typeof window !== 'undefined' ? window.location.pathname : new URL(url).pathname;
  
  // Build metadata object
  const metadata = {
    browser: parseBrowser(deviceInfo.user_agent),
    os: parseOS(deviceInfo.user_agent),
    device_type: deviceInfo.device_type,
    language: deviceInfo.language,
    timezone: deviceInfo.timezone,
    screen_width: deviceInfo.screen_width,
    screen_height: deviceInfo.screen_height,
    viewport_width: deviceInfo.viewport_width,
    viewport_height: deviceInfo.viewport_height,
    user_agent: deviceInfo.user_agent,
    landing_page: pagePath,
  };
  
  try {
    // Direct table update since RPC function doesn't exist
    const { data: existingRecord } = await supabase
      .from('traffic_sources')
      .select('*')
      .eq('source', analysis.source)
      .eq('medium', analysis.medium)
      .eq('campaign', analysis.campaign)
      .maybeSingle();

    const now = new Date().toISOString();
    
    if (existingRecord) {
      // Update existing record (UPSERT behavior)
      const { error: updateError } = await supabase
        .from('traffic_sources')
        .update({
          visit_count: (existingRecord.visit_count || 0) + 1,
          last_visited_at: now,
          // Update session tracking fields on each visit
          session_id: sessionId,
          current_url: currentUrl,
          page_path: pagePath,
          device_type: deviceInfo.device_type,
          metadata: metadata,
        })
        .eq('id', existingRecord.id);
      
      if (updateError) {
        console.error('Error updating traffic source:', updateError);
        console.error('Traffic source update failed for:', analysis);
        return false;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('traffic_sources')
        .insert({
          source: analysis.source,
          medium: analysis.medium,
          campaign: analysis.campaign,
          referrer: analysis.referrer,
          visit_count: 1,
          last_visited_at: now,
          created_at: now,
          // New fields
          session_id: sessionId,
          current_url: currentUrl,
          page_path: pagePath,
          device_type: deviceInfo.device_type,
          metadata: metadata,
        });
      
      if (insertError) {
        console.error('Error inserting traffic source:', insertError);
        console.error('Traffic source insert failed for:', analysis);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating traffic source:', error);
    console.error('Traffic source analysis failed for:', { url, userAgent: userAgent.substring(0, 100), referrer: referrer || 'none' });
    return false;
  }
};

export const trackProductVisit = async (product: {
  article_id: string;
  name: string;
  thumbnail_url?: string;
  product_id?: string;
}) => {
  try {
    // Don't track for admin users or development/preview environments
    if (!isProductionEnvironment()) {
      return true; // Return true to indicate success but no tracking
    }
    
    // Use provided product_id if available, otherwise return error
    const targetProductId = product.product_id;
    
    if (!targetProductId) {
      console.error('No product_id provided for tracking. ProductDetailPage should pass the product_id from the fetched product data.');
      return false;
    }
    
    // Get current timestamp
    const visitedAt = new Date().toISOString();    
    // Try direct table update
    try {
      // First, try to get the existing record
      const { data: existingRecord, error: fetchError } = await supabase
        .from('product_visit_stats')
        .select('visit_count')
        .eq('product_id', targetProductId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing product visit record:', fetchError);
        console.error('Product visit fetch failed for:', { product_id: targetProductId, name: product.name });
        return false;
      }

      let newCount = 1;
      if (existingRecord) {
        newCount = (existingRecord.visit_count || 0) + 1;
      }

      // Upsert with the correct count
      const { data: visitData, error } = await supabase
        .from('product_visit_stats')
        .upsert([{
          product_id: targetProductId,
          name: product.name,
          thumbnail_url: product.thumbnail_url || '',
          visit_count: newCount,
          last_visited_at: visitedAt
        }], {
          onConflict: 'product_id'
        })
        .select();

      if (error) {
        console.error('Error tracking product visit:', error);
        console.error('Product visit upsert failed for:', { product_id: targetProductId, name: product.name, thumbnail_url: product.thumbnail_url });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception in trackProductVisit:', error);
      console.error('Product visit exception for:', { product_id: targetProductId, name: product.name });
      return false;
    }
  } catch (error) {
    console.error('Error in trackProductVisit:', error);
    console.error('Product visit outer error for:', { product_id: product.product_id, name: product.name });
    return false;
  }
};

// Combined function to track both product visit and traffic source
export const trackProductPageVisit = async (product: {
  article_id: string;
  name: string;
  thumbnail_url?: string;
  product_id?: string;
}) => {
  try {
    // Track product visit stats (every time)
    const visitTracked = await trackProductVisit(product);
    
    // Track traffic source (only once per session)
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    
    const trafficTracked = await trackTrafficSourceOnce(url, userAgent, referrer);
    
    return visitTracked && trafficTracked;
  } catch (error) {
    console.error('Error tracking product page visit:', error);
    return false;
  }
};

// Track traffic source only once per session (landing visit)
export const trackTrafficSourceOnce = async (url: string, userAgent: string, referrer: string) => {
  // Check if traffic source has already been tracked in this session
  const sessionKey = 'traffic_source_tracked';
  
  if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
    return true; // Already tracked this session
  }
  
  // Track traffic source (landing visit)
  const tracked = await updateTrafficSource(url, userAgent, referrer);
  
  // Mark as tracked if successful
  if (tracked && typeof window !== 'undefined') {
    sessionStorage.setItem(sessionKey, 'true');
  }

  return tracked;
};

export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this;
    
    const later = () => {
      timeout = null;
      func.apply(context, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
};

// Session-based cache for product views
const SESSION_KEY = 'trackedProductViews';

const getSessionCache = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const saveSessionCache = (set: Set<string>) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
};

export const trackProductViewOnce = async (product: {
  article_id: string;
  product_id?: string;
  selected_article_id?: string;
  name?: string;
  thumbnail_url?: string;
}) => {
  // Use product_id as primary key, fallback to selected_article_id or article_id
  const key = product.product_id || product.selected_article_id || product.article_id;

  const cache = getSessionCache();

  if (cache.has(key)) {
    return;
  }

  cache.add(key);
  saveSessionCache(cache);

  await trackProductVisit({
    article_id: product.article_id,
    name: product.name || '',
    thumbnail_url: product.thumbnail_url || '',
    product_id: product.product_id
  });
};

// Track product variant view - allows different variants of same product
export const trackProductVariantView = async (product: {
  article_id: string;
  product_id?: string;
  selected_article_id?: string;
  name?: string;
  thumbnail_url?: string;
}) => {
  // Use product_id as primary key, fallback to selected_article_id or article_id
  const key = product.product_id || product.selected_article_id || product.article_id;

  const cache = getSessionCache();

  if (cache.has(key)) {
    return;
  }

  cache.add(key);
  saveSessionCache(cache);

  await trackProductVisit({
    article_id: product.article_id,
    name: product.name || '',
    thumbnail_url: product.thumbnail_url || '',
    product_id: product.product_id
  });
};

// Clear session cache for testing or when needed
export const clearProductViewCache = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('trackedProductViews');
  }
};

// Cache for storing tracking status to prevent duplicate tracking
const trackingCache = new Map<string, boolean>();

// Track product view with debouncing and caching
export const trackProductView = debounce(async (product: {
  article_id: string;
  name: string;
  thumbnail_url?: string;
  product_id?: string;
}) => {
  const cacheKey = `${product.article_id}_${new Date().toISOString().split('T')[0]}`;
  
  // Skip if already tracked in this session
  if (trackingCache.has(cacheKey)) {
    return;
  }
  
  // Track view
  await trackProductVisit(product);
  
  // Cache tracking for this product for current day
  trackingCache.set(cacheKey, true);
  
  // Optionally, you can persist the cache to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('productViewCache', JSON.stringify(Array.from(trackingCache.entries())));
    } catch (e) {
      console.warn('Failed to persist tracking cache to localStorage', e);
    }
  }
}, 1000); // 1 second debounce

// Initialize tracking cache from localStorage
if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem('productViewCache');
    if (cached) {
      const entries = JSON.parse(cached);
      trackingCache.clear();
      entries.forEach(([key, value]: [string, boolean]) => {
        trackingCache.set(key, value);
      });
    }
  } catch (e) {
    console.warn('Failed to load tracking cache from localStorage', e);
  }
}
