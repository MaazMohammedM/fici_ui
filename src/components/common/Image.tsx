import { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  blurHash?: string;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({ 
  src, 
  alt, 
  blurHash, 
  className = '',
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    const img = new window.Image();
    img.src = src;
    
    const handleLoad = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    const handleError = () => {
      setImageSrc('/assets/placeholder.jpg');
      setIsLoading(false);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && blurHash && (
        <div className="absolute inset-0">
          <Blurhash
            hash={blurHash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}
      <img
        {...props}
        src={imageSrc || src}
        alt={alt}
        loading="lazy"
        className={`transition-opacity duration-300 w-full h-full object-cover ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/assets/placeholder.jpg';
        }}
      />
    </div>
  );
};
