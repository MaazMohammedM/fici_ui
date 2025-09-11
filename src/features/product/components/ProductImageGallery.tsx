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
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  if (!selectedVariant) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <div className="text-gray-400">No product selected</div>
      </div>
    );
  }

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
  const handleMouseMove = () => {
    // Zoom functionality can be implemented here if needed
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
  const handleTouchStart = () => {
    // Touch handling can be implemented here if needed
  };
  const handleTouchEnd = () => {
    // Touch handling can be implemented here if needed
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={finalImages[selectedImage]}
          alt={productName}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={openZoomModal}
          onError={handleImageError}
        />
      </div>

      {/* Thumbnails */}
      {finalImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {finalImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImage 
                  ? 'border-accent' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={closeZoomModal}
        >
          <div className="relative w-full max-w-4xl h-full max-h-[90vh] flex items-center justify-center">
            <img
              src={finalImages[selectedImage]}
              alt={`${productName} - Zoomed`}
              className="max-w-full max-h-full object-contain"
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={handleImageError}
            />
          </div>

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
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImage + 1} of {finalImages.length}
                </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;