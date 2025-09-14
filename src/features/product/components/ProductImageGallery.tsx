import React, { useState, useRef, useEffect } from 'react';
import type { Product } from '../../../types/product';
import fallbackImage from '../../../assets/Fici Logo.png';
import { ZoomIn, ZoomOut, X } from 'lucide-react';

interface ProductImageGalleryProps {
  selectedVariant: Product | undefined;
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ selectedVariant, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

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

  // Zoom state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const zoomedImgRef = useRef<HTMLDivElement>(null);

  // Zoom lens size and zoom level
  const LENS_SIZE = 200; // Slightly larger lens for better visibility
  const ZOOM_LEVEL = 3; // Increased zoom level for better detail

  // Handle mouse enter/leave for the container
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before hiding to prevent flickering when moving to zoom preview
    const timer = setTimeout(() => {
      setIsHovering(false);
      setShowLens(false);
    }, 100);
    
    return () => clearTimeout(timer);
  };

  // Handle mouse move for the lens effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering || !containerRef.current || !imgRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate cursor position relative to the container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate lens position (centered on cursor)
    const lensX = x - (LENS_SIZE / 2);
    const lensY = y - (LENS_SIZE / 2);
    
    // Keep lens within container bounds
    const maxX = rect.width - LENS_SIZE;
    const maxY = rect.height - LENS_SIZE;
    
    const boundedX = Math.max(0, Math.min(lensX, maxX));
    const boundedY = Math.max(0, Math.min(lensY, maxY));
    
    // Calculate the percentage for the zoomed image
    // Invert the x-axis for more natural movement
    const xPercent = (boundedX / (maxX || 1)) * 100;
    const yPercent = (boundedY / (maxY || 1)) * 100;
    
    setLensPosition({ x: boundedX, y: boundedY });
    setPosition({ 
      x: xPercent, 
      y: yPercent 
    });
    
    // Only update showLens if we're not currently showing the lens
    if (!showLens) {
      setShowLens(true);
    }
  };
  
  // Modal and zoom state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Toggle zoom lens visibility
  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLens(prev => !prev);
  };

  const openImageModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  };

  const navigateModalImage = (direction: 'prev' | 'next') => {
    setModalImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % finalImages.length;
      } else {
        return (prev - 1 + finalImages.length) % finalImages.length;
      }
    });
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== fallbackImage) {
      target.src = fallbackImage;
    }
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

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeImageModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Touch gesture handling for image navigation
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
      setTouchEnd(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    // Handle swipe for image navigation
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
  };

  return (
    <div className="space-y-4">
      {/* Main Image with Zoom Lens */}
      <div className="relative">
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
            className={`w-full h-full object-cover transition-all duration-300 ${isHovering ? 'cursor-crosshair' : 'cursor-default'}`}
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

          {/* Zoomed Image Preview - Fixed position on the right */}
          {isHovering && showLens && (
            <div 
              ref={zoomedImgRef}
              className="fixed left-1/2 ml-8 w-[400px] h-[400px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden z-50 hidden md:block pointer-events-none"
              style={{
                backgroundImage: `url(${finalImages[selectedImage]})`,
                backgroundSize: `${100 * ZOOM_LEVEL}%`,
                backgroundPosition: `${position.x}% ${position.y}%`,
                backgroundRepeat: 'no-repeat',
                backgroundOrigin: 'border-box',
                border: '1px solid rgba(0,0,0,0.1)',
                top: '50%',
                transform: 'translateY(-50%)',
                marginLeft: '20px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            />
          )}
        </div>
        
        {/* Zoom Toggle Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); toggleZoom(e); }}
          className="absolute bottom-4 right-4 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors z-10"
          aria-label={showLens ? 'Disable zoom' : 'Enable zoom'}
        >
          {showLens ? (
            <ZoomOut className="w-5 h-5 text-gray-800 dark:text-white" />
          ) : (
            <ZoomIn className="w-5 h-5 text-gray-800 dark:text-white" />
          )}
        </button>
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