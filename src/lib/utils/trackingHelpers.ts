/**
 * Shared tracking utility functions
 * Reused by both analytics.ts and productEventTracker.ts
 */

// ========================================
// Device Detection Helpers
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

/**
 * Detect device type from user agent and screen width
 * @param userAgent - The user agent string
 * @param screenWidth - Screen width in pixels
 * @returns Device type: 'mobile' | 'tablet' | 'desktop'
 */
export const detectDeviceType = (userAgent: string, screenWidth: number): 'mobile' | 'tablet' | 'desktop' => {
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    deviceType = screenWidth < 768 ? 'mobile' : 'tablet';
  }
  return deviceType;
};

/**
 * Get comprehensive device metadata
 * @returns Device metadata object
 */
export const getDeviceInfo = (): {
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  timezone: string;
  language: string;
  user_agent: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  timestamp: string;
} => {
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
    };
  }

  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const userAgent = navigator.userAgent;

  const deviceType = detectDeviceType(userAgent, screenWidth);

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
  };
};

// ========================================
// Session ID Generation
// ========================================

let sessionId: string | null = null;

/**
 * Generate or retrieve session ID
 * Uses sessionStorage to persist session ID across page navigations
 * @returns Session ID string
 */
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
// Traffic Source Detection
// ========================================

export interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
}

/**
 * Detect if user is coming from a mobile app (Android WebView or iOS WKWebView)
 * @param userAgent - The user agent string
 * @returns 'android_app' | 'ios_app' | null
 */
const detectMobileApp = (userAgent: string): 'android_app' | 'ios_app' | null => {
  const ua = userAgent.toLowerCase();
  
  // Android WebView detection
  if (ua.includes('wv') && ua.includes('android')) {
    return 'android_app';
  }
  
  // iOS WKWebView detection
  if (ua.includes('wkwebview') || (ua.includes('mobile') && ua.includes('safari') && !ua.includes('version'))) {
    return 'ios_app';
  }
  
  return null;
};

/**
 * Get source from referrer hostname
 * @param hostname - Referrer hostname
 * @returns Source name or null
 */
const getSourceFromReferrer = (hostname: string): string | null => {
  if (!hostname) return null;
  
  const host = hostname.toLowerCase();
  
  // Google Business Profile
  if (host.includes('business.google') || host.includes('business.site')) {
    return 'Google Business Profile';
  }
  
  // Social platforms
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
  
  // WhatsApp
  if (host.includes('whatsapp') || host.includes('wa.me') || host.includes('web.whatsapp')) {
    return 'WhatsApp';
  }
  
  // Search engines
  if (host.includes('google.')) return 'Google';
  if (host.includes('bing.')) return 'Bing';
  if (host.includes('duckduckgo')) return 'DuckDuckGo';
  if (host.includes('yahoo')) return 'Yahoo';
  
  return host;
};

/**
 * Get source from user agent
 * @param userAgent - The user agent string
 * @returns Source name or null
 */
const getSourceFromUserAgent = (userAgent: string): string | null => {
  const ua = userAgent.toLowerCase();
  
  // WhatsApp - highest priority to prevent Mobile App misclassification
  if (ua.includes('whatsapp')) return 'Whatsapp';
  
  // Mobile apps (check after WhatsApp)
  const mobileApp = detectMobileApp(userAgent);
  if (mobileApp) {
    return 'Mobile App';
  }
  
  // Social / messaging apps
  if (ua.includes('instagram') || ua.includes('fb_iab')) return 'Instagram';
  if (ua.includes('facebook')) return 'Facebook';
  if (ua.includes('twitter') || ua.includes('x.com')) return 'X';
  if (ua.includes('linkedin')) return 'LinkedIn';
  if (ua.includes('telegram')) return 'Telegram';
  if (ua.includes('snapchat')) return 'Snapchat';
  if (ua.includes('pinterest')) return 'Pinterest';
  if (ua.includes('reddit')) return 'Reddit';
  if (ua.includes('tiktok')) return 'TikTok';
  if (ua.includes('youtube')) return 'YouTube';
  
  // Email clients
  if (ua.includes('outlook') || ua.includes('gmail') || ua.includes('mail')) {
    return 'Email';
  }
  
  // Search engines
  if (ua.includes('googlebot') || ua.includes('google')) return 'Google';
  if (ua.includes('bingbot') || ua.includes('bing')) return 'Bing';
  if (ua.includes('yahoo')) return 'Yahoo';
  if (ua.includes('duckduckbot') || ua.includes('duckduckgo')) return 'DuckDuckGo';
  
  return null;
};

/**
 * Normalize medium based on source
 * @param source - Detected source
 * @param originalMedium - Original medium from UTM
 * @returns Normalized medium
 */
const normalizeMedium = (source: string, originalMedium: string): string => {
  if (originalMedium && originalMedium !== 'none') {
    return originalMedium;
  }
  
  const sourceLower = source.toLowerCase();
  
  // Search engines
  if (['google', 'bing', 'yahoo', 'duckduckgo'].includes(sourceLower)) {
    return 'organic';
  }
  
  // Social platforms
  if (['facebook', 'instagram', 'x', 'linkedin', 'tiktok', 'snapchat', 'pinterest', 'reddit', 'youtube', 'whatsapp', 'telegram'].includes(sourceLower)) {
    return 'social';
  }
  
  // Email
  if (sourceLower === 'email') {
    return 'email';
  }
  
  // Mobile app
  if (sourceLower === 'mobile app') {
    const mobileApp = detectMobileAgent();
    return mobileApp === 'android_app' ? 'android_app' : mobileApp === 'ios_app' ? 'ios_app' : 'mobile';
  }
  
  // Direct
  if (sourceLower === 'direct') {
    return 'none';
  }
  
  return 'referral';
};

/**
 * Detect mobile app type from user agent
 * @returns 'android_app' | 'ios_app' | null
 */
const detectMobileAgent = (): 'android_app' | 'ios_app' | null => {
  if (typeof window === 'undefined') return null;
  return detectMobileApp(navigator.userAgent);
};

/**
 * Analyze traffic source from URL, user agent, and referrer
 * Priority: UTM parameters > Google Business Profile > Referrer > User Agent > Direct
 * @param url - Current URL
 * @param userAgent - User agent string
 * @param referrer - Referrer URL
 * @returns Traffic source information
 */
export const analyzeTrafficSource = (url: string, userAgent: string, referrer: string): TrafficSource => {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  
  // 1. Check UTM parameters (highest priority)
  const utmSource = params.get('utm_source')?.toLowerCase();
  const utmMedium = params.get('utm_medium')?.toLowerCase() || 'none';
  const utmCampaign = params.get('utm_campaign')?.toLowerCase() || 'none';
  
  if (utmSource) {
    // WhatsApp special handling - highest priority to prevent Mobile App misclassification
    if (utmSource === 'whatsapp' || utmSource === 'wa') {
      return {
        source: 'Whatsapp',
        medium: utmMedium || 'social',
        campaign: utmCampaign || 'none',
        referrer: referrer || 'direct',
      };
    }
    
    // Google Business Profile special handling
    if (['google_business_profile', 'gbp', 'google-business'].includes(utmSource)) {
      return {
        source: 'Google Business Profile',
        medium: 'organic',
        campaign: 'business_profile',
        referrer: referrer || 'direct',
      };
    }
    
    // Use UTM values directly
    return {
      source: utmSource.charAt(0).toUpperCase() + utmSource.slice(1),
      medium: utmMedium,
      campaign: utmCampaign,
      referrer: referrer || 'direct',
    };
  }
  
  // 2. Check referrer
  if (referrer) {
    // WhatsApp link shortener (l.wl.co) - highest priority referrer check
    if (referrer.toLowerCase().includes('l.wl.co')) {
      return {
        source: 'Whatsapp',
        medium: 'social',
        campaign: 'none',
        referrer: referrer,
      };
    }
    
    try {
      const referrerObj = new URL(referrer);
      const referrerSource = getSourceFromReferrer(referrerObj.hostname);
      
      if (referrerSource) {
        return {
          source: referrerSource,
          medium: normalizeMedium(referrerSource, 'none'),
          campaign: 'none',
          referrer: referrer,
        };
      }
    } catch (e) {
      // Invalid referrer URL, continue to user agent detection
    }
  }
  
  // 3. Check user agent
  const uaSource = getSourceFromUserAgent(userAgent);
  if (uaSource) {
    let medium = normalizeMedium(uaSource, 'none');
    
    // Special handling for mobile app
    if (uaSource === 'Mobile App') {
      const mobileApp = detectMobileApp(userAgent);
      medium = mobileApp || 'mobile';
    }
    
    return {
      source: uaSource,
      medium,
      campaign: 'none',
      referrer: referrer || 'direct',
    };
  }
  
  // 4. Direct traffic (fallback)
  return {
    source: 'Direct',
    medium: 'none',
    campaign: 'none',
    referrer: referrer || 'direct',
  };
};

// ========================================
// Environment Check
// ========================================

/**
 * Check if the current environment is production (ficishoes.com)
 * Returns true ONLY on ficishoes.com and NOT for admin users
 * Excludes: localhost, 127.0.0.1, netlify, preview environments, and admin users
 */
export const isProductionEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // Exclude localhost, 127.0.0.1, netlify, and preview environments
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('netlify') ||
    hostname.includes('preview')
  ) {
    return false;
  }
  
  // Only allow tracking on ficishoes.com (including subdomains like www.ficishoes.com)
  if (!hostname.endsWith('ficishoes.com')) {
    return false;
  }
  
  // Exclude admin users
  try {
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    if (isAdmin) return false;
  } catch (error) {
    // If localStorage check fails, err on the side of not tracking
    return false;
  }
  
  return true;
};
