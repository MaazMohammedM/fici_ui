import React, { useState, useRef, useEffect } from 'react';
import type { Product } from '../../../types/product';
import fallbackImage from '../../../assets/Fici Logo.png';

interface ProductImageGalleryProps {
  selectedVariant: Product | undefined;
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ selectedVariant, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  if (!selectedVariant) return null;

  // Helper to parse images safely
  const parseImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images.filter(img => img && typeof img === 'string' && img.trim() !== '');
    }
    if (typeof images === 'string') {
      const trimmed = images.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('http')) {
        return trimmed.split(',').map(url => url.trim()).filter(url => url !== '');
      }
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(img => img && typeof img === 'string' && img.trim() !== '');
        }
        return [];
      } catch {
        return [trimmed];
      }
    }
    return [];
  };

  let validImages = parseImages(selectedVariant.images);
  if (validImages.length === 0 && selectedVariant.thumbnail_url?.trim() !== '') {
    validImages = [selectedVariant.images[0]];
  }
  const finalImages = validImages.length > 0 ? validImages : [fallbackImage];

  // Zoom handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZooming) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== fallbackImage) {
      target.src = fallbackImage;
    }
  };

  const openZoomModal = () => {
    setIsZoomOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeZoomModal = () => {
    setIsZoomOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % finalImages.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + finalImages.length) % finalImages.length);

  // Keyboard navigation in zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomOpen) return;
      if (e.key === 'Escape') closeZoomModal();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, finalImages.length]);

  // Touch swipe support (mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 50) prevImage();
    if (diff < -50) nextImage();
    touchStartX.current = null;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image Container with Slide Controls */}
        <div className="relative flex">
          <div
            className="relative aspect-square bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl overflow-hidden group flex-1"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="relative w-full h-full cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onClick={openZoomModal}
            >
              <img
                ref={imageRef}
                src={finalImages[selectedImage]}
                alt={productName}
                className="w-full h-full object-cover transition-transform duration-300"
                onError={handleImageError}
              />

              {/* Zoom lens */}
              {isZooming && (
                <div className="hidden lg:block absolute inset-0 pointer-events-none">
                  <div
                    className="absolute w-32 h-32 border-2 border-white rounded-full shadow-lg opacity-75"
                    style={{
                      left: `${zoomPosition.x}%`,
                      top: `${zoomPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
              )}

              {/* Zoom indicator */}
              <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>

            {/* Slide arrows */}
            {finalImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Hover zoom panel (desktop only) */}
          {isZooming && (
            <div className="hidden lg:block absolute left-[calc(100%+1rem)] top-0 w-96 h-96 bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 z-30">
              <div
                className="w-full h-full bg-no-repeat"
                style={{
                  backgroundImage: `url(${finalImages[selectedImage]})`,
                  backgroundSize: '300%',
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundRepeat: 'no-repeat'
                }}
              />
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {finalImages.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {finalImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedImage 
                    ? 'border-[color:var(--color-accent)] shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-[color:var(--color-accent)]/50'
                }`}
              >
                <img
                  src={image}
                  alt={`${productName} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Modal remains same as before */}
      {isZoomOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          {/* Close */}
          <button
            onClick={closeZoomModal}
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation */}
          {finalImages.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative max-w-[90vw] max-h-[90vh] overflow-hidden">
            <img
              src={finalImages[selectedImage]}
              alt={productName}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
            />
          </div>

          {finalImages.length > 1 && (
            <>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-full">
                {selectedImage + 1} of {finalImages.length}
              </div>
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2 max-w-[90vw] overflow-x-auto scrollbar-hide">
                {finalImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImage ? 'border-[color:var(--color-accent)]' : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img src={image} alt={`${productName} ${index + 1}`} className="w-full h-full object-cover" onError={handleImageError} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ProductImageGallery;