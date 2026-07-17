/**
 * Traffic Source Normalizer
 * Normalizes traffic source names for consistent display in Admin Dashboard
 * Groups equivalent sources together without modifying database values
 */

export interface NormalizationInput {
  source?: string | null;
  referrer?: string | null;
  current_url?: string | null;
}

/**
 * Normalize traffic source to canonical display name
 * Handles WhatsApp, GBP, LinkedIn, Facebook, Instagram, Mobile App, and case-insensitive grouping
 */
export function normalizeTrafficSource(input: NormalizationInput): string {
  const { source, referrer, current_url } = input;

  // UTM parameters from the original landing URL always win.
  const utmSource = getUtmSource(current_url);
  if (utmSource) {
    return normalizeUtmSource(utmSource);
  }

  if (!source) return 'Direct';

  const sourceLower = source.toLowerCase();
  const normalizedSource = normalizeExplicitSource(source);

  // Keep explicit sources stable. Only fallback values are allowed to be upgraded.
  if (!isFallbackSource(sourceLower)) {
    return normalizedSource;
  }

  const referrerSource = getSourceFromReferrer(referrer);
  if (referrerSource) {
    return referrerSource;
  }

  // Source fallback only applies when UTM and referrer are absent.
  if (isWhatsApp(source, referrer, null)) return 'Whatsapp';
  if (isGBP(source, null)) return 'GBP';
  if (isLinkedIn(source)) return 'LinkedIn';
  if (isFacebook(source)) return 'Facebook';
  if (isInstagram(source)) return 'Instagram';
  if (sourceLower === 'direct') return 'Direct';
  if (isMobileApp(source)) return 'Mobile App';

  // Case-insensitive normalization for other sources
  return normalizedSource;
}

/**
 * Detect if traffic is from WhatsApp
 */
function isWhatsApp(
  source: string | null | undefined,
  referrer: string | null | undefined,
  utmSource: string | null | undefined
): boolean {
  const sourceLower = source?.toLowerCase() || '';
  const referrerLower = referrer?.toLowerCase() || '';
  const utmLower = utmSource?.toLowerCase() || '';
  
  // Check source field - all WhatsApp variants
  if (sourceLower === 'whatsapp' || 
      sourceLower === 'wa' ||
      sourceLower === 'whatsapp.com' ||
      sourceLower === 'wa.me' ||
      sourceLower.startsWith('whatsapp_')) {
    return true;
  }
  
  // Check UTM source
  if (utmLower === 'whatsapp' || utmLower === 'wa') {
    return true;
  }
  
  // Check referrer for WhatsApp domains
  if (referrerLower.includes('whatsapp.com') || 
      referrerLower.includes('wa.me') || 
      referrerLower.includes('l.wl.co')) {
    return true;
  }
  
  return false;
}

/**
 * Detect if traffic is from Google Business Profile
 */
function isGBP(
  source: string | null | undefined,
  utmSource: string | null | undefined
): boolean {
  const sourceLower = source?.toLowerCase() || '';
  const utmLower = utmSource?.toLowerCase() || '';
  
  // Check source field - all GBP variants
  if (sourceLower === 'gbp' || 
      sourceLower === 'google business profile' ||
      sourceLower === 'googlebusinessprofile' ||
      sourceLower === 'google-business') {
    return true;
  }
  
  // Check UTM source
  if (utmLower === 'gbp' || 
      utmLower === 'google business profile' ||
      utmLower === 'googlebusinessprofile' ||
      utmLower === 'google-business') {
    return true;
  }
  
  return false;
}

/**
 * Detect if traffic is from LinkedIn
 */
function isLinkedIn(source: string | null | undefined): boolean {
  const sourceLower = source?.toLowerCase() || '';
  
  // Check all LinkedIn variants
  if (sourceLower === 'linkedin' || 
      sourceLower === 'linkedin.com' ||
      sourceLower === 'lnkd.in' ||
      sourceLower === 'linkedin ads' ||
      sourceLower === 'linkedin_ads' ||
      sourceLower === 'social_linkedin') {
    return true;
  }
  
  return false;
}

/**
 * Detect if traffic is from Facebook
 */
function isFacebook(source: string | null | undefined): boolean {
  const sourceLower = source?.toLowerCase() || '';
  
  // Check all Facebook variants
  if (sourceLower === 'facebook' || 
      sourceLower === 'facebook.com' ||
      sourceLower === 'fb' ||
      sourceLower === 'fb.com' ||
      sourceLower === 'facebook ads' ||
      sourceLower === 'facebook_ads' ||
      sourceLower === 'social_facebook') {
    return true;
  }
  
  return false;
}

/**
 * Detect if traffic is from Instagram
 */
function isInstagram(source: string | null | undefined): boolean {
  const sourceLower = source?.toLowerCase() || '';
  
  // Check all Instagram variants
  if (sourceLower === 'instagram' || 
      sourceLower === 'instagram.com' ||
      sourceLower === 'ig' ||
      sourceLower === 'instagram ads' ||
      sourceLower === 'instagram_ads' ||
      sourceLower === 'social_instagram') {
    return true;
  }
  
  return false;
}

/**
 * Detect if traffic is from Mobile App
 */
function isMobileApp(source: string | null | undefined): boolean {
  const sourceLower = source?.toLowerCase() || '';
  
  // Check all Mobile App variants
  if (sourceLower === 'mobile app' || 
      sourceLower === 'mobile_app' ||
      sourceLower === 'mobileapp' ||
      sourceLower === 'mobile-native' ||
      sourceLower === 'mobile_native' ||
      sourceLower === 'mobile-copy' ||
      sourceLower === 'mobile_copy') {
    return true;
  }
  
  return false;
}

function isFallbackSource(sourceLower: string): boolean {
  return (
    sourceLower === 'direct' ||
    sourceLower === 'none' ||
    sourceLower === 'unknown' ||
    sourceLower === 'social' ||
    sourceLower === 'mobile app' ||
    sourceLower === 'mobile_app' ||
    sourceLower === 'mobileapp' ||
    sourceLower === 'mobile-native' ||
    sourceLower === 'mobile_native' ||
    sourceLower === 'mobile-copy' ||
    sourceLower === 'mobile_copy'
  );
}

function getUtmSource(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('utm_source');
  } catch {
    return null;
  }
}

function getSourceFromReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;

  try {
    const referrerObj = new URL(referrer);
    const host = referrerObj.hostname.toLowerCase();

    if (host.includes('business.google') || host.includes('business.site')) {
      return 'GBP';
    }
    if (host.includes('facebook') || host.includes('m.facebook') || host.includes('lm.facebook')) {
      return 'Facebook';
    }
    if (host.includes('instagram') || host.includes('l.instagram')) {
      return 'Instagram';
    }
    if (host.includes('linkedin') || host.includes('lnkd.in')) {
      return 'LinkedIn';
    }
    if (host.includes('x.com') || host.includes('twitter') || host.includes('t.co')) {
      return 'X';
    }
    if (host.includes('youtube') || host.includes('youtu.be')) {
      return 'YouTube';
    }
    if (host.includes('whatsapp') || host.includes('wa.me') || host.includes('web.whatsapp') || host.includes('l.wl.co')) {
      return 'Whatsapp';
    }
    if (host.includes('google.')) return 'Google';
    if (host.includes('bing.')) return 'Bing';
    if (host.includes('duckduckgo')) return 'DuckDuckGo';
    if (host.includes('yahoo')) return 'Yahoo';

    return capitalizeFirstLetter(host);
  } catch {
    return null;
  }
}

function normalizeExplicitSource(source: string): string {
  const normalized = source.toLowerCase();

  if (normalized === 'whatsapp' || normalized === 'wa') return 'Whatsapp';
  if (normalized === 'gbp' || normalized === 'google_business_profile' || normalized === 'google-business' || normalized === 'google business profile') {
    return 'GBP';
  }
  if (normalized === 'linkedin' || normalized === 'linkedin.com' || normalized === 'lnkd.in') return 'LinkedIn';
  if (normalized === 'facebook' || normalized === 'facebook.com' || normalized === 'fb' || normalized === 'fb.com') return 'Facebook';
  if (normalized === 'instagram' || normalized === 'instagram.com' || normalized === 'ig') return 'Instagram';
  if (normalized === 'direct') return 'Direct';
  if (normalized === 'social') return 'Social';
  if (normalized === 'none') return 'Direct';
  if (normalized === 'unknown') return 'Unknown';
  if (normalized === 'mobile app' || normalized === 'mobile_app' || normalized === 'mobileapp' || normalized === 'mobile-native' || normalized === 'mobile_native' || normalized === 'mobile-copy' || normalized === 'mobile_copy') {
    return 'Mobile App';
  }

  return capitalizeFirstLetter(normalized);
}

function normalizeUtmSource(source: string): string {
  const normalized = source.toLowerCase();

  if (normalized === 'whatsapp' || normalized === 'wa') return 'Whatsapp';
  if (normalized === 'gbp' || normalized === 'google_business_profile' || normalized === 'google-business' || normalized === 'google business profile') {
    return 'GBP';
  }
  if (normalized === 'linkedin' || normalized === 'linkedin.com' || normalized === 'lnkd.in') return 'LinkedIn';
  if (normalized === 'facebook' || normalized === 'facebook.com' || normalized === 'fb' || normalized === 'fb.com') return 'Facebook';
  if (normalized === 'instagram' || normalized === 'instagram.com' || normalized === 'ig') return 'Instagram';
  if (normalized === 'google' || normalized === 'bing' || normalized === 'yahoo' || normalized === 'duckduckgo') {
    return capitalizeFirstLetter(normalized);
  }

  return toTitleCase(source);
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Aggregate traffic sources by normalized name
 * Combines counts for equivalent sources
 */
export function aggregateTrafficSources(
  rows: Array<{ 
    source: string | null; 
    visit_count: number | null; 
    last_visited_at?: string | null;
    referrer?: string | null;
    current_url?: string | null;
  }>
): Array<{ source: string; total: number; last_visited_at?: string | null }> {
  const map = new Map<string, { total: number; last_visited_at?: string | null }>();
  
  for (const row of rows) {
    const normalized = normalizeTrafficSource({ 
      source: row.source,
      referrer: row.referrer || null,
      current_url: row.current_url || null
    });
    
    const existing = map.get(normalized);
    const count = row.visit_count || 0;
    const last = row.last_visited_at || null;
    
    if (existing) {
      existing.total += count;
      // Keep the most recent last_visited_at
      if (last && (!existing.last_visited_at || new Date(last) > new Date(existing.last_visited_at))) {
        existing.last_visited_at = last;
      }
    } else {
      map.set(normalized, { total: count, last_visited_at: last });
    }
  }
  
  return Array.from(map.entries()).map(([source, data]) => ({
    source,
    total: data.total,
    last_visited_at: data.last_visited_at
  }));
}

/**
 * Get canonical source name for icon mapping
 * Used by both TrafficSourcesWidget and ProductEventsWidget
 */
export function getCanonicalSourceName(source: string | undefined): string {
  if (!source) return 'direct';
  return normalizeTrafficSource({ source });
}
