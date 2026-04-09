import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  format = 'webp'
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && imgSrc.includes('api.ficishoes.com')) {
      // Fallback to Cloudflare proxy URL
      const fallbackSrc = imgSrc.replace(
        'https://api.ficishoes.com',
        'https://supabase-proxy.furqhaanmohammed001.workers.dev'
      );
      console.log('Image failed, falling back:', imgSrc, '->', fallbackSrc);
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  // Construct URL with parameters
  const constructUrl = (baseSrc: string) => {
    const url = new URL(baseSrc);
    if (width) url.searchParams.set('width', width.toString());
    if (height) url.searchParams.set('height', height.toString());
    if (quality) url.searchParams.set('quality', quality.toString());
    if (format) url.searchParams.set('format', format);
    return url.toString();
  };

  return (
    <img
      src={constructUrl(imgSrc)}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageWithFallback;
