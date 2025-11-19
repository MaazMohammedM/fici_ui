import { supabase } from '../supabase';

// Enhanced traffic source analysis
export const analyzeTrafficSource = (url: string, userAgent: string, referrer: string) => {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  
  // Check UTM parameters first
  let source = params.get('utm_source')?.toLowerCase();
  let medium = params.get('utm_medium')?.toLowerCase() || 'none';
  let campaign = params.get('utm_campaign')?.toLowerCase() || 'none';
  
  // If no UTM, analyze referrer
  if (!source && referrer) {
    const refHost = new URL(referrer).hostname.toLowerCase();
    source = getSourceFromReferrer(refHost);
    medium = source ? 'referral' : 'none';
  }
  
  // If still no source, analyze user agent and other indicators
  if (!source) {
    source = detectSourceFromUserAgent(userAgent);
    medium = 'direct';
  }
  
  // Categorize medium if not set
  if (medium === 'none') {
    if (['google', 'bing', 'yahoo', 'duckduckgo'].includes(source)) {
      medium = 'search';
    } else if (['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'snapchat', 'pinterest', 'reddit'].includes(source)) {
      medium = 'social';
    } else if (['email', 'mail', 'outlook', 'gmail'].includes(source)) {
      medium = 'email';
    } else if (source === 'direct') {
      medium = 'direct';
    } else if (source === 'mobile_app') {
      medium = 'mobile';
    }
  }
  
  return {
    source: source || 'direct',
    medium: medium || 'direct',
    campaign: campaign || 'none',
    referrer: referrer || 'direct'
  };
};

const getSourceFromReferrer = (host: string): string | null => {
  if (!host) return null;
  if (host.includes('facebook')) return 'facebook';
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('linkedin')) return 'linkedin';
  if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'twitter';
  if (host.includes('google.')) return 'google';
  if (host.includes('bing.')) return 'bing';
  if (host.includes('whatsapp')) return 'whatsapp';
  return host;
};

const detectSourceFromUserAgent = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  
  // Check for mobile apps
  if (ua.includes('instagram') || ua.includes('fb_iab')) return 'instagram';
  if (ua.includes('fb') || ua.includes('facebook')) return 'facebook';
  if (ua.includes('twitter') || ua.includes('x.com')) return 'twitter';
  if (ua.includes('linkedin')) return 'linkedin';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('telegram')) return 'telegram';
  if (ua.includes('snapchat')) return 'snapchat';
  if (ua.includes('pinterest')) return 'pinterest';
  if (ua.includes('reddit')) return 'reddit';
  if (ua.includes('tiktok')) return 'tiktok';
  if (ua.includes('youtube')) return 'youtube';
  
  // Check for mobile indicators
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('ios')) {
    return 'mobile_app';
  }
  
  // Check for email clients
  if (ua.includes('outlook') || ua.includes('gmail') || ua.includes('mail')) {
    return 'email';
  }
  
  // Check for search engines (even without referrer)
  if (ua.includes('googlebot') || ua.includes('google')) return 'google';
  if (ua.includes('bingbot') || ua.includes('bing')) return 'bing';
  if (ua.includes('yahoo')) return 'yahoo';
  if (ua.includes('duckduckbot') || ua.includes('duckduckgo')) return 'duckduckgo';
  
  // Check for browsers
  if (ua.includes('chrome')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari')) return 'safari';
  if (ua.includes('edge')) return 'edge';
  
  return 'direct';
};

// Update traffic source with enhanced analysis
export const updateTrafficSource = async (url: string, userAgent: string, referrer: string) => {
  const analysis = analyzeTrafficSource(url, userAgent, referrer);
  
  try {
    // Try RPC first
    const { error: rpcError } = await supabase.rpc('increment_traffic_source', {
      p_source: analysis.source,
      p_medium: analysis.medium,
      p_campaign: analysis.campaign,
      p_referrer: analysis.referrer
    });
    
    if (!rpcError) return true;
    
    // Fallback to direct table update
    const { data: rows } = await supabase
      .from('traffic_sources')
      .select('id, visit_count')
      .eq('source', analysis.source)
      .eq('medium', analysis.medium)
      .eq('campaign', analysis.campaign)
      .limit(1);
    
    const row = rows?.[0];
    
    if (!row) {
      await supabase.from('traffic_sources').insert({
        source: analysis.source,
        medium: analysis.medium,
        campaign: analysis.campaign,
        referrer: analysis.referrer,
        visit_count: 1,
        last_visited_at: new Date().toISOString()
      });
    } else {
      await supabase
        .from('traffic_sources')
        .update({
          visit_count: (row.visit_count || 0) + 1,
          referrer: analysis.referrer,
          last_visited_at: new Date().toISOString()
        })
        .eq('id', row.id);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update traffic source:', error);
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
