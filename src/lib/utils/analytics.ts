import { supabase } from '../supabase';
import { useAuthStore } from '@store/authStore';

// ─── Helper: wait for auth store to be initialized ───────────────────────────
const waitForAuthInitialized = (): Promise<void> => {
  return new Promise((resolve) => {
    const { initialized } = useAuthStore.getState();
    if (initialized) {
      resolve();
      return;
    }
    // Subscribe to store changes until initialized
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.initialized) {
        unsubscribe();
        resolve();
      }
    });
  });
};

// ─── Helper: check if current user is admin using auth store ──────────────────
const isAdminUser = async (): Promise<boolean> => {
  await waitForAuthInitialized();
  const { role, user } = useAuthStore.getState();
  return (
    role?.toLowerCase() === 'admin' ||
    user?.user_metadata?.role?.toLowerCase() === 'admin'
  );
};

// Enhanced traffic source analysis
export const analyzeTrafficSource = (url: string, userAgent: string, referrer: string) => {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  
  let source = params.get('utm_source')?.toLowerCase();
  let medium = params.get('utm_medium')?.toLowerCase() || 'none';
  const campaign = params.get('utm_campaign')?.toLowerCase() || 'none';
  
  if (!source && (url.includes('whatsapp') || url.includes('wa.me') || url.includes('api.whatsapp'))) {
    source = 'whatsapp';
    medium = 'social';
  } else if (!source && referrer) {
    const refHost = new URL(referrer).hostname.toLowerCase();
    source = getSourceFromReferrer(refHost);
    medium = source ? 'referral' : 'none';
  }
  
  if (!source && referrer) {
    const refHost = new URL(referrer).hostname.toLowerCase();
    source = getSourceFromReferrer(refHost);
    medium = source ? 'social' : 'direct';
  }

  if (!source) {
    source = detectSourceFromUserAgent(userAgent);
    medium = source === 'whatsapp' ? 'social' : 'direct';
  }

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
  if (host.includes('whatsapp') || host.includes('wa.me') || host.includes('api.whatsapp')) return 'whatsapp';
  return host;
};

const detectSourceFromUserAgent = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('instagram') || ua.includes('fb_iab')) return 'instagram';
  if (ua.includes('facebook')) return 'facebook';
  if (ua.includes('twitter') || ua.includes('x.com')) return 'twitter';
  if (ua.includes('linkedin')) return 'linkedin';
  if (ua.includes('telegram')) return 'telegram';
  if (ua.includes('snapchat')) return 'snapchat';
  if (ua.includes('pinterest')) return 'pinterest';
  if (ua.includes('reddit')) return 'reddit';
  if (ua.includes('tiktok')) return 'tiktok';
  if (ua.includes('youtube')) return 'youtube';
  if (ua.includes('outlook') || ua.includes('gmail') || ua.includes('mail')) return 'email';
  if (ua.includes('googlebot') || ua.includes('google')) return 'google';
  if (ua.includes('bingbot') || ua.includes('bing')) return 'bing';
  if (ua.includes('yahoo')) return 'yahoo';
  if (ua.includes('duckduckbot') || ua.includes('duckduckgo')) return 'duckduckgo';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'mobile_app';
  if (ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari') || ua.includes('edge')) return 'direct';
  return 'direct';
};

// Update traffic source with enhanced analysis
export const updateTrafficSource = async (url: string, userAgent: string, referrer: string) => {
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isNetlifyPreview = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
  
  if (isLocalhost || isNetlifyPreview) {
    console.log('Skipping traffic source tracking for preview environment');
    return true;
  }
  
  const analysis = analyzeTrafficSource(url, userAgent, referrer);
  
  try {
    const { data: existingRecord } = await supabase
      .from('traffic_sources')
      .select('*')
      .eq('source', analysis.source)
      .eq('medium', analysis.medium)
      .eq('campaign', analysis.campaign)
      .maybeSingle();

    const now = new Date().toISOString();
    
    if (existingRecord) {
      const { error: updateError } = await supabase
        .from('traffic_sources')
        .update({
          visit_count: (existingRecord.visit_count || 0) + 1,
          last_visited_at: now
        })
        .eq('id', existingRecord.id);
      
      if (updateError) {
        console.error('Error updating traffic source:', updateError);
        return false;
      }
    } else {
      const { error: insertError } = await supabase
        .from('traffic_sources')
        .insert({
          source: analysis.source,
          medium: analysis.medium,
          campaign: analysis.campaign,
          referrer: analysis.referrer,
          visit_count: 1,
          last_visited_at: now,
          created_at: now
        });
      
      if (insertError) {
        console.error('Error inserting traffic source:', insertError);
        return false;
      }
    }
    
    console.log('Traffic source tracked successfully:', analysis);
    return true;
  } catch (error) {
    console.error('Error updating traffic source:', error);
    return false;
  }
};

export const trackProductVisit = async (product: {
  article_id: string;
  name: string;
  thumbnail_url?: string;
  product_id?: string;
}) => {
  // ✅ Await auth store initialization, then check role properly
  const adminUser = await isAdminUser();
  if (adminUser) {
    console.log('Skipping product visit tracking for admin user');
    return false;
  }

  try {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isNetlifyPreview = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
    
    if (isLocalhost || isNetlifyPreview) {
      return true;
    }
    
    const targetProductId = product.product_id;
    
    if (!targetProductId) {
      console.error('No product_id provided for tracking.');
      return false;
    }
    
    const visitedAt = new Date().toISOString();
    
    try {
      const { data: existingRecord, error: fetchError } = await supabase
        .from('product_visit_stats')
        .select('visit_count')
        .eq('product_id', targetProductId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing record:', fetchError);
        return false;
      }

      const newCount = existingRecord ? (existingRecord.visit_count || 0) + 1 : 1;

      const { error } = await supabase
        .from('product_visit_stats')
        .upsert([{
          product_id: targetProductId,
          name: product.name,
          thumbnail_url: product.thumbnail_url || '',
          visit_count: newCount,
          last_visited_at: visitedAt
        }], { onConflict: 'product_id' })
        .select();

      if (error) {
        console.error('Error tracking product visit:', error);
        return false;
      }
      
      console.log('Product visit tracked successfully:', { product_id: targetProductId, name: product.name, visit_count: newCount });
      return true;
    } catch (error) {
      console.error('Exception in trackProductVisit:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in trackProductVisit:', error);
    return false;
  }
};

export const trackProductPageVisit = async (product: {
  article_id: string;
  name: string;
  thumbnail_url?: string;
  product_id?: string;
}) => {
  try {
    const visitTracked = await trackProductVisit(product);
    
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

export const trackTrafficSourceOnce = async (url: string, userAgent: string, referrer: string) => {
  const sessionKey = 'traffic_source_tracked';
  
  let alreadyTracked = false;
  if (typeof window !== 'undefined') {
    if (sessionStorage.getItem(sessionKey)) {
      alreadyTracked = true;
    } else {
      const sessionCookie = document.cookie.split(';').find(c => c.trim().startsWith('traffic_tracked='));
      if (sessionCookie) alreadyTracked = true;
    }
  }
  
  if (alreadyTracked) {
    console.log('Traffic source already tracked in this session');
    return true;
  }

  // ✅ Await auth store initialization, then check role properly
  const adminUser = await isAdminUser();
  if (adminUser) {
    console.log('Skipping traffic source tracking for admin user');
    return false;
  }
  
  const tracked = await updateTrafficSource(url, userAgent, referrer);
  
  if (tracked && typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(sessionKey, 'true');
      const expiry = new Date();
      expiry.setTime(expiry.getTime() + 24 * 60 * 60 * 1000);
      document.cookie = `traffic_tracked=true; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
      console.log('Traffic source tracked for first time in session');
    } catch (error) {
      console.error('Error setting session tracking:', error);
    }
  }
  
  return tracked;
};

// ─── Rest of the file unchanged ──────────────────────────────────────────────

export const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this;
    const later = () => { timeout = null; func.apply(context, args); };
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const SESSION_KEY = 'trackedProductViews';

const getSessionCache = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
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
  const key = product.product_id || product.selected_article_id || product.article_id;
  const cache = getSessionCache();
  if (cache.has(key)) { console.log('Skipping duplicate product view:', key); return; }
  cache.add(key);
  saveSessionCache(cache);
  await trackProductVisit({ article_id: product.article_id, name: product.name || '', thumbnail_url: product.thumbnail_url || '', product_id: product.product_id });
};

export const trackProductVariantView = async (product: {
  article_id: string;
  product_id?: string;
  selected_article_id?: string;
  name?: string;
  thumbnail_url?: string;
}) => {
  const key = product.product_id || product.selected_article_id || product.article_id;
  const cache = getSessionCache();
  if (cache.has(key)) { console.log('Skipping duplicate product variant view:', key); return; }
  cache.add(key);
  saveSessionCache(cache);
  await trackProductVisit({ article_id: product.article_id, name: product.name || '', thumbnail_url: product.thumbnail_url || '', product_id: product.product_id });
};

export const clearProductViewCache = () => {
  if (typeof window !== 'undefined') sessionStorage.removeItem('trackedProductViews');
};

const trackingCache = new Map<string, boolean>();

export const trackProductView = debounce(async (product: {
  article_id: string;
  name: string;
  thumbnail_url?: string;
  product_id?: string;
}) => {
  const cacheKey = `${product.article_id}_${new Date().toISOString().split('T')[0]}`;
  if (trackingCache.has(cacheKey)) return;
  await trackProductVisit(product);
  trackingCache.set(cacheKey, true);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('productViewCache', JSON.stringify(Array.from(trackingCache.entries())));
    } catch (e) { console.warn('Failed to persist tracking cache', e); }
  }
}, 1000);

if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem('productViewCache');
    if (cached) {
      const entries = JSON.parse(cached);
      trackingCache.clear();
      entries.forEach(([key, value]: [string, boolean]) => trackingCache.set(key, value));
    }
  } catch (e) { console.warn('Failed to load tracking cache', e); }
}