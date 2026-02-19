/**
 * Image Optimization Utility for Supabase Storage
 * Reduces storage egress by applying optimal transforms and caching strategies
 */

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  loading?: 'lazy' | 'eager';
}

export interface OptimizedImageConfig {
  // Predefined sizes for different use cases
  THUMBNAIL: ImageOptions;
  LISTING: ImageOptions;
  DETAIL: ImageOptions;
  GALLERY_THUMBNAIL: ImageOptions;
  MODAL: ImageOptions;
}

// Configuration for different image sizes
export const IMAGE_CONFIG: OptimizedImageConfig = {
  THUMBNAIL: {
    width: 300,
    quality: 75,
    format: 'webp',
    loading: 'lazy'
  },
  LISTING: {
    width: 600,
    quality: 80,
    format: 'webp',
    loading: 'lazy'
  },
  DETAIL: {
    width: 1000,
    quality: 85,
    format: 'webp',
    loading: 'eager'
  },
  GALLERY_THUMBNAIL: {
    width: 100,
    quality: 70,
    format: 'webp',
    loading: 'lazy'
  },
  MODAL: {
    width: 1200,
    quality: 90,
    format: 'webp',
    loading: 'eager'
  }
};

// Supabase storage URL for ficishoesimages bucket
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/ficishoesimages`;

/**
 * Generate optimized image URL with Supabase transforms
 */
export function getOptimizedImageUrl(
  originalUrl: string, 
  options: ImageOptions = {}
): string {
  if (!originalUrl) return '';

  // If it's already a Supabase URL, add transforms
  if (originalUrl.includes('ficishoesimages') || originalUrl.includes('storage/v1/object/public')) {
    const baseUrl = originalUrl.split('?')[0];
    const params = new URLSearchParams();
    
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.quality) params.set('quality', options.quality.toString());
    if (options.format && options.format !== 'jpg') {
      params.set('format', options.format);
    }
    
    const paramString = params.toString();
    return paramString ? `${baseUrl}?${paramString}` : baseUrl;
  }
  
  // For non-Supabase URLs, return as-is (or implement CDN transforms)
  return originalUrl;
}

/**
 * Get optimized image URL for specific use case
 */
export function getImageForUseCase(
  originalUrl: string,
  useCase: keyof OptimizedImageConfig
): string {
  const config = IMAGE_CONFIG[useCase];
  return getOptimizedImageUrl(originalUrl, config);
}

/**
 * Generate responsive image srcset for different screen sizes
 */
export function generateSrcSet(
  originalUrl: string,
  sizes: number[] = [300, 600, 900, 1200]
): string {
  return sizes
    .map(width => `${getOptimizedImageUrl(originalUrl, { width })} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(
  breakpoints: { [key: string]: string } = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '1024px': '33vw'
  }
): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `${breakpoint} ${size}`)
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(url: string, options: ImageOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getOptimizedImageUrl(url, options);
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Check if WebP is supported by the browser
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get the best format for the current browser
 */
export async function getOptimalFormat(): Promise<'webp' | 'jpg'> {
  try {
    const webPSupported = await supportsWebP();
    return webPSupported ? 'webp' : 'jpg';
  } catch {
    return 'jpg'; // Fallback
  }
}

/**
 * Create a complete optimized image configuration
 */
export async function createOptimizedImageConfig(
  originalUrl: string,
  useCase: keyof OptimizedImageConfig
): Promise<{
  src: string;
  srcSet: string;
  sizes: string;
  loading: 'lazy' | 'eager';
  alt?: string;
}> {
  const config = IMAGE_CONFIG[useCase];
  const optimalFormat = await getOptimalFormat();
  
  // Update config with optimal format
  const finalConfig = { ...config, format: optimalFormat };
  
  return {
    src: getOptimizedImageUrl(originalUrl, finalConfig),
    srcSet: generateSrcSet(originalUrl, [300, 600, 900, 1200]),
    sizes: generateSizes(),
    loading: finalConfig.loading || 'lazy'
  };
}

/**
 * Utility to convert existing image URLs to optimized versions
 */
export function optimizeExistingImages(
  container: HTMLElement | Document = document
): void {
  const images = container.querySelectorAll('img[data-optimize="true"]');
  
  images.forEach((img) => {
    const imgElement = img as HTMLImageElement;
    const originalSrc = imgElement.getAttribute('data-original-src');
    const useCase = imgElement.getAttribute('data-use-case') as keyof OptimizedImageConfig;
    
    if (originalSrc && useCase) {
      const optimizedSrc = getImageForUseCase(originalSrc, useCase);
      imgElement.src = optimizedSrc;
    }
  });
}

/**
 * Intersection Observer for lazy loading with optimized images
 */
export function createLazyImageObserver(): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const originalSrc = img.getAttribute('data-src');
          const useCase = img.getAttribute('data-use-case') as keyof OptimizedImageConfig;
          
          if (originalSrc && useCase) {
            const optimizedSrc = getImageForUseCase(originalSrc, useCase);
            img.src = optimizedSrc;
            img.removeAttribute('data-src');
            img.removeAttribute('data-use-case');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.1
    }
  );
  
  return observer;
}

// Export a singleton observer instance
export const lazyImageObserver = createLazyImageObserver();
