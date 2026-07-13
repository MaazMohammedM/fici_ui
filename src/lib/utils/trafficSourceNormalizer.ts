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
 * Handles WhatsApp, GBP, and case-insensitive grouping
 */
export function normalizeTrafficSource(input: NormalizationInput): string {
  const { source, referrer, current_url } = input;
  
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
  
  // Normalize WhatsApp variants
  if (isWhatsApp(source, referrer, utmSource)) {
    return 'Whatsapp';
  }
  
  // Normalize GBP variants
  if (isGBP(source, utmSource)) {
    return 'GBP';
  }
  
  // Case-insensitive normalization for other sources
  if (source) {
    return capitalizeFirstLetter(source.toLowerCase());
  }
  
  // Default to direct if no source
  return 'Direct';
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
  
  // Check source field
  if (sourceLower === 'whatsapp' || sourceLower === 'wa') {
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
  
  // Check source field
  if (sourceLower === 'gbp' || 
      sourceLower === 'google business profile' ||
      sourceLower === 'googlebusinessprofile') {
    return true;
  }
  
  // Check UTM source
  if (utmLower === 'gbp' || 
      utmLower === 'google business profile' ||
      utmLower === 'googlebusinessprofile') {
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
  rows: Array<{ source: string | null; visit_count: number | null; last_visited_at?: string | null }>
): Array<{ source: string; total: number; last_visited_at?: string | null }> {
  const map = new Map<string, { total: number; last_visited_at?: string | null }>();
  
  for (const row of rows) {
    const normalized = normalizeTrafficSource({ 
      source: row.source,
      referrer: null,
      current_url: null
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
