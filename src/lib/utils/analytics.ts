import { supabase } from '../supabase';

export const trackProductVisit = async (product: {
  article_id: string;
  name: string;
  thumbnail_url?: string;
  product_id?: string;
}) => {
  try {
    // Get the current timestamp
    const visitedAt = new Date().toISOString();
    
    // Get user agent and referrer for analytics
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';

    // Insert visit record
    const { error } = await supabase
      .from('product_visits')
      .insert([{ 
        product_id: product.product_id || product.article_id,
        name: product.name,
        thumbnail_url: product.thumbnail_url || '',
        user_agent: userAgent,
        referrer: referrer,
        visited_at: visitedAt
      }]);

    if (error) {
      console.error('Error tracking product visit:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in trackProductVisit:', error);
    return false;
  }
};

// Utility to debounce function calls
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
  
  // Track the view
  await trackProductVisit(product);
  
  // Cache the tracking for this product for the current day
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
