import { useState, useEffect, useCallback } from 'react';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
}

interface UseImageOptimizationReturn {
  optimizedSrc: string;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
}

export const useImageOptimization = (
  src: string,
  options: ImageOptimizationOptions = {}
): UseImageOptimizationReturn => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const generateOptimizedUrl = useCallback((originalSrc: string) => {
    try {
      // For future CDN integration (Cloudinary, ImageKit, etc.)
      // Currently returns original with query parameters
      const url = new URL(originalSrc, window.location.origin);
      
      if (options.width) url.searchParams.set('w', options.width.toString());
      if (options.height) url.searchParams.set('h', options.height.toString());
      if (options.quality) url.searchParams.set('q', options.quality.toString());
      if (options.format) url.searchParams.set('f', options.format);
      
      return url.toString();
    } catch {
      return originalSrc;
    }
  }, [options]);

  const loadImage = useCallback(() => {
    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    const optimizedUrl = generateOptimizedUrl(src);

    img.onload = () => {
      setOptimizedSrc(optimizedUrl);
      setIsLoading(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      // Fallback to original src
      setOptimizedSrc(src);
    };

    img.src = optimizedUrl;
  }, [src, generateOptimizedUrl]);

  const retry = useCallback(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    if (src) {
      loadImage();
    }
  }, [src, loadImage]);

  return {
    optimizedSrc,
    isLoading,
    hasError,
    retry
  };
};

// Hook for responsive image srcSet generation
export const useResponsiveImages = (src: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1536]) => {
  const generateSrcSet = useCallback((baseSrc: string) => {
    return sizes
      .map(size => {
        try {
          const url = new URL(baseSrc, window.location.origin);
          url.searchParams.set('w', size.toString());
          return `${url.toString()} ${size}w`;
        } catch {
          return `${baseSrc} ${size}w`;
        }
      })
      .join(', ');
  }, [sizes]);

  return {
    srcSet: generateSrcSet(src),
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  };
};
