import React from 'react';
import { useCachedImage } from '@lib/utils/imageCached';
import { useFirebaseImageSimple } from '@lib/utils/firebaseImageSimple';
interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
}

const CachedImage: React.FC<CachedImageProps> = ({
  src,
  fallbackSrc,
  loadingFallback,
  errorFallback,
  loading = 'lazy',
  decoding = 'async',
  ...props
}) => {
  // Use Firebase image hook for Firebase Storage URLs, regular hook for others
  const isFirebaseUrl = src && src.includes('firebasestorage.googleapis.com');
  const { imageUrl, isLoading, error } = isFirebaseUrl 
    ? useFirebaseImageSimple(src, fallbackSrc)
    : useCachedImage(src, fallbackSrc);

  // Show loading fallback while image is loading
  if (isLoading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  // Show error fallback if image failed to load
  if (error && errorFallback) {
    return <>{errorFallback}</>;
  }

  // If no image URL is available, show fallback or nothing
  if (!imageUrl && fallbackSrc) {
    return <img 
      src={fallbackSrc} 
      loading={loading}
      decoding={decoding}
      {...props} 
      onError={(e) => {
        console.warn('Fallback image also failed to load:', fallbackSrc);
      }} 
    />;
  }

  // If no image URL and no fallback, render nothing
  if (!imageUrl) {
    return null;
  }

  // Use the optimized image URL
  return <img 
    src={imageUrl} 
    loading={loading}
    decoding={decoding}
    {...props} 
    onError={(e) => {
      console.warn('Image failed to load, trying fallback:', imageUrl);
      if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
        e.currentTarget.src = fallbackSrc;
      }
    }} 
  />;
};

export default CachedImage;
