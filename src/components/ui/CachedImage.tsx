import React from 'react';

import { useCachedImage } from '@/utils/imageCache';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

const CachedImage: React.FC<CachedImageProps> = ({
  src,
  fallbackSrc,
  loadingFallback,
  errorFallback,
  ...props
}) => {
  const { imageUrl, isLoading, error } = useCachedImage(src, fallbackSrc);

  // Show loading fallback while image is loading
  if (isLoading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  // Show error fallback if image failed to load
  if (error && errorFallback) {
    return <>{errorFallback}</>;
  }

  // Use the cached image URL or fallback
  return <img src={imageUrl} {...props} onError={(e) => {
    if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
  }} />;
};

export default CachedImage;
