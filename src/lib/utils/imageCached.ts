import React from 'react';
import { getOptimizedFirebaseUrl } from './imageOptimization';

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
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Handle empty or invalid URLs
    if (!url || url.trim() === '') {
      setImageUrl(fallback || '');
      setIsLoading(false);
      setError(null);
      return;
    }

    const trimmedUrl = url.trim();
    
    // If image is already in cache, use it
    if (imageCache.has(trimmedUrl)) {
      setImageUrl(imageCache.get(trimmedUrl)!);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Otherwise, load and cache the image
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Preload the image to validate it
        await cacheImage(trimmedUrl);
        setImageUrl(trimmedUrl);
      } catch (err) {
        console.warn('Image failed to load, using fallback:', trimmedUrl, err);
        setError(err as Error);
        
        // Try to use fallback image
        if (fallback && fallback !== trimmedUrl) {
          try {
            await cacheImage(fallback);
            setImageUrl(fallback);
            setError(null);
          } catch (fallbackErr) {
            console.error('Fallback image also failed:', fallbackErr);
            setImageUrl('');
          }
        } else {
          setImageUrl('');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [url, fallback]);

  return { imageUrl, isLoading, error };
};