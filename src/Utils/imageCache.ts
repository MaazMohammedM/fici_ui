import React from 'react';

// Simple in-memory cache for images
const imageCache = new Map<string, string>();

/**
 * Preloads an image and caches it
 * @param url The image URL to cache
 * @returns Promise that resolves when the image is loaded
 */
export const cacheImage = async (url: string): Promise<void> => {
  // If the image is already in cache, return immediately
  if (!url || imageCache.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(url, url);
      resolve();
    };
    
    img.onerror = (err) => {
      console.error('Failed to load image:', url, err);
      reject(err);
    };
    
    img.src = url;
  });
};

/**
 * Preloads multiple images
 * @param urls Array of image URLs to cache
 */
export const cacheImages = async (urls: string[]): Promise<void> => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  await Promise.all(uniqueUrls.map(url => cacheImage(url)));
};

/**
 * Gets an image URL from cache or returns the original URL
 * @param url The image URL
 * @returns The cached URL if available, otherwise the original URL
 */
export const getCachedImage = (url: string): string => {
  return imageCache.get(url) || url;
};

/**
 * Hook to use cached images
 * @param url The image URL to cache and display
 * @param fallback Fallback URL if the image fails to load
 * @returns Object containing the image URL and loading state
 */
export const useCachedImage = (url: string, fallback?: string) => {
  const [imageUrl, setImageUrl] = React.useState<string>(fallback || '');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!url) {
      setImageUrl(fallback || '');
      setIsLoading(false);
      return;
    }

    // If image is already in cache, use it
    if (imageCache.has(url)) {
      setImageUrl(imageCache.get(url)!);
      setIsLoading(false);
      return;
    }

    // Otherwise, load and cache the image
    const loadImage = async () => {
      try {
        setIsLoading(true);
        await cacheImage(url);
        setImageUrl(url);
      } catch (err) {
        console.error('Error loading image:', err);
        setError(err as Error);
        setImageUrl(fallback || '');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [url, fallback]);

  return { imageUrl, isLoading, error };
};
