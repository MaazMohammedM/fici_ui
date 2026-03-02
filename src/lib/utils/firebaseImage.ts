import React, { useState, useEffect } from 'react';
import { getOptimizedFirebaseUrl } from './imageOptimization';

// Simple in-memory cache for optimized Firebase URLs
const optimizedUrlCache = new Map<string, string>();

/**
 * Hook to use optimized Firebase Storage images
 * @param url The original Firebase Storage URL
 * @param fallback Fallback URL if the image fails to load
 * @returns Object containing the optimized image URL and loading state
 */
export const useFirebaseImage = (url: string, fallback?: string) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Handle empty or invalid URLs
    if (!url || url.trim() === '') {
      setImageUrl(fallback || '');
      setIsLoading(false);
      setError(null);
      return;
    }

    const trimmedUrl = url.trim();
    
    // Check cache first
    if (optimizedUrlCache.has(trimmedUrl)) {
      setImageUrl(optimizedUrlCache.get(trimmedUrl)!);
      setIsLoading(false);
      setError(null);
      return;
    }

    // For Firebase Storage URLs, use them directly if they have tokens
    const optimizeUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let finalUrl = trimmedUrl;
        
        // Only try to optimize if it's a Firebase URL without alt=media
        if (trimmedUrl.includes('firebasestorage.googleapis.com') && !trimmedUrl.includes('alt=media')) {
          try {
            finalUrl = await getOptimizedFirebaseUrl(trimmedUrl);
          } catch (optError) {
            console.warn('Failed to optimize Firebase URL, using original:', optError);
            finalUrl = trimmedUrl; // Fallback to original
          }
        }
        
        // Cache the result
        optimizedUrlCache.set(trimmedUrl, finalUrl);
        setImageUrl(finalUrl);
        
        // Preload the image to validate it
        const img = new Image();
        img.onload = () => {
          setIsLoading(false);
        };
        img.onerror = (err) => {
          console.warn('Image failed to load, using fallback:', finalUrl, err);
          setError(err instanceof Error ? err : new Error('Image load failed'));
          
          // Try to use fallback image
          if (fallback && fallback !== trimmedUrl) {
            setImageUrl(fallback);
            setError(null);
          } else {
            setImageUrl('');
          }
          setIsLoading(false);
        };
        img.src = finalUrl;
        
      } catch (err) {
        console.error('Failed to process Firebase URL:', err);
        setError(err instanceof Error ? err : new Error('Image processing failed'));
        
        // Use fallback immediately
        if (fallback) {
          setImageUrl(fallback);
          setError(null);
        } else {
          setImageUrl('');
        }
        setIsLoading(false);
      }
    };

    optimizeUrl();
  }, [url, fallback]);

  return { imageUrl, isLoading, error };
};
