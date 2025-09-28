import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../../../types/product';
import fallbackImage from '../../../assets/Fici_logo.png';
import { ZoomIn, ZoomOut, X } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface ProductImageGalleryProps {
  selectedVariant: Product | undefined;
  productName: string;
}

const LENS_SIZE = 250; // Increased lens size for better visibility
const ZOOM_LEVEL = 3.5; // Increased zoom level for better detail

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  selectedVariant, 
  productName 
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [lensPosition, setLensPosition] = useState<Position>({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const zoomedImgRef = useRef<HTMLDivElement>(null);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  // Parse images with proper type safety
  const parseImages = useCallback((images: unknown): string[] => {
    if (!images) return [];
    
    if (Array.isArray(images)) {
      return images.filter((img): img is string => 
        Boolean(img) && typeof img === 'string' && img.trim() !== ''
      );
    }
    
    if (typeof images === 'string') {
      const trimmed = images.trim();
      if (!trimmed) return [];
      
      if (trimmed.startsWith('http')) {
        return trimmed
          .split(',')
          .map(url => url.trim())
          .filter(Boolean);
      }
      
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((img): img is string => 
            Boolean(img) && typeof img === 'string' && img.trim() !== ''
          );
        }
        return [];
      } catch {
        return [trimmed];
      }
    }
    
    return [];
  }, []);

  // Get valid images with proper typing
  const finalImages = useMemo(() => {
    if (!selectedVariant) return [fallbackImage];
    
    let validImages = parseImages(selectedVariant.images);
    
    if (validImages.length === 0 && selectedVariant.thumbnail_url?.trim()) {
      validImages = [selectedVariant.thumbnail_url];
    }
    
    return validImages.length > 0 ? validImages : [fallbackImage];
  }, [selectedVariant, parseImages]);

  // Navigation handlers
  const nextImage = useCallback(() => {
    setSelectedImage(prev => (prev + 1) % finalImages.length);
  }, [finalImages.length]);

  const prevImage = useCallback(() => {
    setSelectedImage(prev => (prev - 1 + finalImages.length) % finalImages.length);
  }, [finalImages.length]);

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const timer = setTimeout(() => {
      setIsHovering(false);
      setShowLens(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const lensX = Math.max(0, Math.min(x - LENS_SIZE / 2, rect.width - LENS_SIZE));
    const lensY = Math.max(0, Math.min(y - LENS_SIZE / 2, rect.height - LENS_SIZE));
    
    setLensPosition({ x: lensX, y: lensY });
    setPosition({
      x: (lensX / (rect.width - LENS_SIZE || 1)) * 100,
      y: (lensY / (rect.height - LENS_SIZE || 1)) * 100
    });
    
    if (!showLens) {
      setShowLens(true);
    }
  }, [isHovering, showLens]);

  const toggleZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLens(prev => !prev);
  }, []);

  const openImageModal = useCallback((index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeImageModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  }, []);

  const closeZoomModal = useCallback(() => {
    setIsZoomOpen(false);
    document.body.style.overflow = 'unset';
  }, []);

  const navigateModalImage = useCallback((direction: 'prev' | 'next') => {
    setModalImageIndex(prev => 
      direction === 'next' 
        ? (prev + 1) % finalImages.length 
        : (prev - 1 + finalImages.length) % finalImages.length
    );
  }, [finalImages.length]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== fallbackImage) {
      target.src = fallbackImage;
    }
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
      setTouchEnd(e.touches[0].clientX);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50;
    const swipeDiff = touchStart - touchEnd;
    
    if (Math.abs(swipeDiff) > swipeThreshold) {
      if (swipeDiff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  }, [nextImage, prevImage, touchEnd, touchStart]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isZoomOpen) {
        if (e.key === 'Escape') {
          closeZoomModal();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        } else if (e.key === 'ArrowLeft') {
          prevImage();
        }
      }
      
      if (e.key === 'Escape' && isModalOpen) {
        closeImageModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeImageModal, closeZoomModal, isModalOpen, isZoomOpen, nextImage, prevImage]);

  if (!selectedVariant) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <div className="text-gray-400">No product selected</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image with Zoom Lens */}
      <div className="relative group">
        {/* Navigation Arrows */}
        {finalImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors z-10 opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              ❮
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors z-10 opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              ❯
            </button>
          </>
        )}
        <div 
          ref={containerRef}
          className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={imgRef}
            src={finalImages[selectedImage]}
            alt={productName}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isHovering ? 'cursor-crosshair' : 'cursor-default'
            }`}
            onClick={() => openImageModal(selectedImage)}
            onError={handleImageError}
          />

          {/* Zoom Lens */}
          {isHovering && showLens && (
            <div 
              ref={lensRef}
              className="absolute border-2 border-white/50 rounded-full pointer-events-none z-10"
              style={{
                width: `${LENS_SIZE}px`,
                height: `${LENS_SIZE}px`,
                left: `${lensPosition.x}px`,
                top: `${lensPosition.y}px`,
                boxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.3)',
                clipPath: `circle(${LENS_SIZE/2}px at ${LENS_SIZE/2}px ${LENS_SIZE/2}px)`
              }}
            />
          )}

          {/* Zoomed Image Preview - Larger and more prominent */}
          {isHovering && showLens && (
            <div 
              ref={zoomedImgRef}
              className="fixed left-1/2 ml-12 w-[500px] h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 hidden md:block pointer-events-none transition-all duration-300 ease-in-out transform scale-100 group-hover:scale-105"
              style={{
                backgroundImage: `url(${finalImages[selectedImage]})`,
                backgroundSize: `${100 * ZOOM_LEVEL}%`,
                backgroundPosition: `${position.x}% ${position.y}%`,
                backgroundRepeat: 'no-repeat',
                backgroundOrigin: 'border-box',
                border: '2px solid rgba(255,255,255,0.2)',
                top: '50%',
                transform: 'translateY(-50%) scale(1.05)',
                marginLeft: '30px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.3s ease-in-out',
                opacity: 1,
                transformOrigin: 'left center'
              }}
            />
          )}
        </div>
        
        {/* Enhanced Zoom Toggle Button */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
          <button 
            onClick={toggleZoom}
            className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all transform hover:scale-110"
            aria-label={showLens ? 'Disable zoom' : 'Enable zoom'}
          >
            {showLens ? (
              <ZoomOut className="w-6 h-6 text-gray-800 dark:text-white" />
            ) : (
              <ZoomIn className="w-6 h-6 text-gray-800 dark:text-white" />
            )}
          </button>
          
          {/* Slide Show Toggle Button */}
          {finalImages.length > 1 && (
            <button
              onClick={() => openImageModal(selectedImage)}
              className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all transform hover:scale-110 text-sm font-medium text-gray-800 dark:text-white"
              aria-label="View slideshow"
            >
              🖼️
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Thumbnails with Slide Indicator */}
      {finalImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {finalImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all transform hover:scale-105 ${
                index === selectedImage 
                  ? 'border-accent scale-105 ring-2 ring-accent/50' 
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

      {/* Image Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
              aria-label="Close modal"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="relative w-full h-full">
              <img
                src={finalImages[modalImageIndex]}
                alt={`${productName} - ${modalImageIndex + 1} of ${finalImages.length}`}
                className="max-w-full max-h-[80vh] mx-auto object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              {finalImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateModalImage('prev');
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    ❮
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateModalImage('next');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    ❯
                  </button>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                    {modalImageIndex + 1} / {finalImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;