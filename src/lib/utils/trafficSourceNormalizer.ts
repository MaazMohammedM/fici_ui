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
  
  if (!source) return 'Direct';
  
  const sourceLower = source.toLowerCase();
  
  // Extract UTM parameters from URL if available
  const getUtmSource = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('utm_source');
    } catch {
      return null;
    }
  };
  
  const utmSource = getUtmSource(current_url);
  const utmLower = utmSource?.toLowerCase() || '';
  const referrerLower = referrer?.toLowerCase() || '';
  
  // Normalize WhatsApp variants (highest priority)
  if (isWhatsApp(source, referrer, utmSource)) {
    return 'Whatsapp';
  }
  
  // Normalize GBP variants
  if (isGBP(source, utmSource)) {
    return 'GBP';
  }
  
  // Normalize LinkedIn variants
  if (isLinkedIn(source)) {
    return 'LinkedIn';
  }
  
  // Normalize Facebook variants
  if (isFacebook(source)) {
    return 'Facebook';
  }
  
  // Normalize Instagram variants
  if (isInstagram(source)) {
    return 'Instagram';
  }
  
  // Normalize Mobile App variants
  if (isMobileApp(source)) {
    return 'Mobile App';
  }
  
  // Case-insensitive normalization for other sources
  return capitalizeFirstLetter(sourceLower);
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
