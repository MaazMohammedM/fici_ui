/**
 * Image Optimization Utilities
 * Handles Firebase Storage image transformations, WebP conversion, and sizing
 */

// Firebase Storage URL pattern
const FIREBASE_STORAGE_URL_PATTERN = /firebasestorage\.googleapis\.com\/v0\/b\/([^\/]+)\/o\/(.+)/;

// Cache for optimized URLs to prevent duplicate processing
const optimizedUrlCache = new Map<string, string>();

/**
 * Gets Firebase Storage download URL with proper token
 * @param storagePath The storage path (e.g., 'images/thumbnails/image.jpg') or full URL
 * @returns Promise that resolves to the download URL
 */
export const getFirebaseDownloadUrl = async (storagePath: string): Promise<string> => {
  try {
    // If it's already a full Firebase Storage URL with token, return it
    if (storagePath.includes('firebasestorage.googleapis.com') && storagePath.includes('alt=media')) {
      return storagePath;
    }

    // If it's a Firebase Storage URL without token, extract the path
    if (storagePath.includes('firebasestorage.googleapis.com')) {
      const match = storagePath.match(FIREBASE_STORAGE_URL_PATTERN);
      if (match) {
        const [, bucket, encodedPath] = match;
        const decodedPath = decodeURIComponent(encodedPath);
        // Remove bucket name from path if present
        const cleanPath = decodedPath.replace(new RegExp(`^${bucket}/`), '');
        storagePath = cleanPath;
      }
    }

    // Import Firebase Storage dynamically to avoid circular dependencies
    const { getStorage, ref, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Failed to get Firebase download URL:', error);
    throw error;
  }
};

/**
 * Gets optimized Firebase Storage URL with proper token handling
 * @param imageUrl Original Firebase Storage URL
 * @returns Promise that resolves to the optimized URL
 */
export const getOptimizedFirebaseUrl = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) {
    return '';
  }

  // Check cache first
  if (optimizedUrlCache.has(imageUrl)) {
    return optimizedUrlCache.get(imageUrl)!;
  }

  try {
    // If the URL already has a token (alt=media), use it directly
    if (imageUrl.includes('alt=media')) {
      // Cache and return the existing URL
      optimizedUrlCache.set(imageUrl, imageUrl);
      return imageUrl;
    }

    // Parse Firebase Storage URL to extract the path
    const match = imageUrl.match(FIREBASE_STORAGE_URL_PATTERN);
    if (!match) {
      return imageUrl; // Not a Firebase Storage URL
    }

    const [, bucket, encodedPath] = match;
    const decodedPath = decodeURIComponent(encodedPath);
    
    // Remove bucket name from path if present
    const cleanPath = decodedPath.replace(new RegExp(`^${bucket}/`), '');
    
    // Get proper download URL with token
    const downloadUrl = await getFirebaseDownloadUrl(cleanPath);
    
    // Cache the result
    optimizedUrlCache.set(imageUrl, downloadUrl);
    
    return downloadUrl;
  } catch (error) {
    console.warn('Failed to get optimized Firebase URL:', error);
    // If optimization fails, return the original URL
    optimizedUrlCache.set(imageUrl, imageUrl);
    return imageUrl;
  }
};

/**
 * Converts Firebase Storage URL to WebP version
 * @param imageUrl Original Firebase Storage URL
 * @returns WebP version of the URL
 */
export const convertToWebPUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '';
  }

  // If it's already a WebP URL, return as-is
  if (imageUrl.endsWith('.webp')) {
    return imageUrl;
  }

  // Convert Firebase Storage URLs to WebP
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    // Replace .jpg, .jpeg, .png with .webp
    return imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  // For non-Firebase URLs, return as-is
  return imageUrl;
};

/**
 * Gets optimized image URL using Firebase Storage
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

  // For Firebase Storage URLs, return them as-is since they already have proper tokens
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    return imageUrl;
  }

  // Handle other URLs (CDN, local, etc.)
  try {
    const url = new URL(imageUrl);
    
    // Add optimization parameters for supported CDNs
    if (url.hostname.includes('cloudinary') || url.hostname.includes('imgix')) {
      if (options.width) url.searchParams.set('w', options.width.toString());
      if (options.height) url.searchParams.set('h', options.height.toString());
      if (options.quality) url.searchParams.set('q', options.quality.toString());
      if (options.format) url.searchParams.set('f', options.format);
      
      return url.toString();
    }
  } catch (error) {
    // URL parsing failed, return original
  }

  // Return original URL if no optimization is possible
  return imageUrl;
};

/**
 * Gets thumbnail URL using Firebase Storage
 * @param imageUrl Original image URL
 * @returns Thumbnail URL
 */
export const getThumbnailUrl = async (imageUrl: string | null | undefined): Promise<string> => {
  if (!imageUrl) {
    return '';
  }

  try {
    // Try to get thumbnail from Firebase Storage
    const { storageService } = await import('@/services/storageService');
    return await storageService.getThumbnailURL(imageUrl);
  } catch (error) {
    console.error('Error getting thumbnail URL:', error);
    return imageUrl;
  }
};

/**
 * Synchronous version of getThumbnailUrl for compatibility
 * @param imageUrl Original image URL
 * @returns Thumbnail URL
 */
export const getThumbnailUrlSync = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '';
  }

  // For now, return original URL. In production, you might want to implement
  // a naming convention for thumbnails (e.g., image_thumb.jpg)
  return imageUrl;
};

/**
 * Gets listing image URL optimized for product cards
 * @param imageUrl Original image URL
 * @returns Optimized listing URL
 */
export const getListingImageUrl = (imageUrl: string | null | undefined): string => {
  // Convert to WebP first for Firebase Storage URLs
  const webpUrl = convertToWebPUrl(imageUrl);
  
  // For Firebase Storage URLs, return the WebP version as-is
  if (webpUrl.includes('firebasestorage.googleapis.com')) {
    return webpUrl;
  }

  // For other URLs, apply optimization
  return getOptimizedImageUrl(webpUrl, {
    width: 600,
    height: 600,
    quality: 80,
    format: 'webp'
  });
};

/**
 * Gets detail page image URL optimized for product galleries
 * @param imageUrl Original image URL
 * @returns Optimized detail URL
 */
export const getDetailImageUrl = (imageUrl: string | null | undefined): string => {
  // Convert to WebP first for Firebase Storage URLs
  const webpUrl = convertToWebPUrl(imageUrl);
  
  // For Firebase Storage URLs, return the WebP version as-is
  if (webpUrl.includes('firebasestorage.googleapis.com')) {
    return webpUrl;
  }

  // For other URLs, apply optimization
  return getOptimizedImageUrl(webpUrl, {
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
  // For thumbnail use case, try to get actual thumbnail from Firebase Storage
  if (useCase.toLowerCase() === 'thumbnail') {
    return await getThumbnailUrl(imageUrl);
  }
  
  return getImageForUseCase(imageUrl, useCase);
};
