/**
 * Image Optimization Utilities
 * Handles Supabase image transformations, WebP conversion, and sizing
 */

// Supabase storage URL pattern
const SUPABASE_STORAGE_URL = 'https://project.supabase.co/storage/v1/object/public';

// Cache for optimized URLs to prevent duplicate processing
const optimizedUrlCache = new Map<string, string>();

/**
 * Gets optimized image URL with Supabase transformations
 * @param imageUrl Original image URL
 * @param options Optimization options
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  imageUrl: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
    isThumbnail?: boolean;
  } = {}
): string => {
  if (!imageUrl) {
    return '';
  }

  // If it's not a Supabase URL, return as-is
  if (!imageUrl.includes(SUPABASE_STORAGE_URL)) {
    return imageUrl;
  }

  // Create cache key for this specific optimization
  const cacheKey = `${imageUrl}-${JSON.stringify(options)}`;
  
  // Return cached URL if available
  if (optimizedUrlCache.has(cacheKey)) {
    return optimizedUrlCache.get(cacheKey)!;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    isThumbnail = false
  } = options;

  // Default sizes based on usage
  const targetWidth = width || (isThumbnail ? 300 : 600);
  const targetHeight = height || (isThumbnail ? 300 : 600);

  // Build transformation parameters
  const params = new URLSearchParams();
  
  if (targetWidth) params.set('width', targetWidth.toString());
  if (targetHeight) params.set('height', targetHeight.toString());
  params.set('quality', quality.toString());
  params.set('format', format);

  // Check if URL already has parameters
  const urlWithParams = imageUrl.includes('?') 
    ? `${imageUrl}&${params.toString()}`
    : `${imageUrl}?${params.toString()}`;

  // Cache the result
  optimizedUrlCache.set(cacheKey, urlWithParams);
  
  return urlWithParams;
};

/**
 * Gets thumbnail URL optimized for listing pages
 * @param imageUrl Original image URL
 * @returns Optimized thumbnail URL (300px, WebP)
 */
export const getThumbnailUrl = (imageUrl: string | null | undefined): string => {
  return getOptimizedImageUrl(imageUrl, {
    width: 300,
    height: 300,
    quality: 75,
    format: 'webp',
    isThumbnail: true
  });
};

/**
 * Gets listing image URL optimized for product cards
 * @param imageUrl Original image URL
 * @returns Optimized listing URL (600px, WebP)
 */
export const getListingImageUrl = (imageUrl: string | null | undefined): string => {
  return getOptimizedImageUrl(imageUrl, {
    width: 600,
    height: 600,
    quality: 80,
    format: 'webp'
  });
};

/**
 * Gets detail page image URL optimized for product galleries
 * @param imageUrl Original image URL
 * @returns Optimized detail URL (1000px, WebP)
 */
export const getDetailImageUrl = (imageUrl: string | null | undefined): string => {
  return getOptimizedImageUrl(imageUrl, {
    width: 1000,
    height: 1000,
    quality: 85,
    format: 'webp'
  });
};

/**
 * Checks if browser supports WebP format
 * @returns Promise that resolves to true if WebP is supported
 */
export const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Gets the best image format based on browser support
 * @param imageUrl Original image URL
 * @param options Optimization options
 * @returns Optimized image URL with appropriate format
 */
export const getBestFormatImageUrl = async (
  imageUrl: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    isThumbnail?: boolean;
  } = {}
): Promise<string> => {
  const supportsWebP = await checkWebPSupport();
  
  return getOptimizedImageUrl(imageUrl, {
    ...options,
    format: supportsWebP ? 'webp' : 'jpg'
  });
};

/**
 * Preloads an image with optimization
 * @param imageUrl Original image URL
 * @param options Optimization options
 * @returns Promise that resolves when image is loaded
 */
export const preloadOptimizedImage = (
  imageUrl: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    isThumbnail?: boolean;
  } = {}
): Promise<void> => {
  const optimizedUrl = getOptimizedImageUrl(imageUrl, options);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = optimizedUrl;
  });
};

/**
 * Generates srcset for responsive images
 * @param imageUrl Original image URL
 * @param breakpoints Array of widths
 * @param options Optimization options
 * @returns srcset string
 */
export const generateSrcSet = (
  imageUrl: string | null | undefined,
  breakpoints: number[] = [300, 600, 1000],
  options: {
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string => {
  if (!imageUrl) return '';

  return breakpoints
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(imageUrl, {
        width,
        ...options
      });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
};

/**
 * Image size presets for different use cases
 */
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 300, height: 300, quality: 75 },
  LISTING: { width: 600, height: 600, quality: 80 },
  DETAIL: { width: 1000, height: 1000, quality: 85 },
  HERO: { width: 1200, height: 600, quality: 90 }
} as const;

/**
 * Gets optimized URL using preset sizes
 * @param imageUrl Original image URL
 * @param preset Size preset
 * @returns Optimized image URL
 */
export const getPresetImageUrl = (
  imageUrl: string | null | undefined,
  preset: keyof typeof IMAGE_SIZES
): string => {
  return getOptimizedImageUrl(imageUrl, IMAGE_SIZES[preset]);
};

/**
 * Gets optimized image URL based on use case
 * @param imageUrl Original image URL
 * @param useCase Use case for the image (THUMBNAIL, LISTING, DETAIL, HERO)
 * @returns Optimized image URL
 */
export const getImageForUseCase = (
  imageUrl: string | null | undefined,
  useCase: 'THUMBNAIL' | 'LISTING' | 'DETAIL' | 'HERO' | 'thumbnail' | 'listing' | 'detail' | 'hero'
): string => {
  // Handle lowercase variants
  const normalizedUseCase = useCase.toUpperCase() as keyof typeof IMAGE_SIZES;
  
  if (normalizedUseCase in IMAGE_SIZES) {
    return getPresetImageUrl(imageUrl, normalizedUseCase);
  }
  
  // Fallback to LISTING if use case is not recognized
  return getPresetImageUrl(imageUrl, 'LISTING');
};

/**
 * Async version of getImageForUseCase for compatibility
 * @param imageUrl Original image URL
 * @param useCase Use case for the image
 * @returns Promise that resolves to optimized image URL
 */
export const getImageForUseCaseAsync = async (
  imageUrl: string | null | undefined,
  useCase: 'THUMBNAIL' | 'LISTING' | 'DETAIL' | 'HERO' | 'thumbnail' | 'listing' | 'detail' | 'hero'
): Promise<string> => {
  return getImageForUseCase(imageUrl, useCase);
};
