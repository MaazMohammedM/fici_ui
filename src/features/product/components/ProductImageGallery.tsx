// src/features/product/components/ProductImageGallery.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../../../types/product';
import fallbackImage from '../../../assets/Fici_logo.png';
import { ZoomIn, ZoomOut, X, Heart } from 'lucide-react';

interface ProductImageGalleryProps {
  selectedVariant: Product | undefined;
  productName: string;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
  onZoomStateChange?: (state: {
    isHovering: boolean;
    showLens: boolean;
    isZoomDisabled: boolean;
    currentImage: string;
    zoomLevel: number;
    zoomPos: { x: number; y: number };
  }) => void;
}

const LENS_SIZE = 250;
const ZOOM_LEVEL = 3.5;

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  selectedVariant,
  productName,
  isWishlisted = false,
  onWishlistToggle,
  onZoomStateChange
}: ProductImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);

  // Hover / lens state (desktop)
  const [isHovering, setIsHovering] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Modal & slideshow
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Touch/swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Zoom level detection and management
  const [browserZoomLevel, setBrowserZoomLevel] = useState(100);
  const [isZoomDisabled, setIsZoomDisabled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  // Detect browser zoom level and disable zoom functionality at 150%+
  useEffect(() => {
    const detectZoomLevel = () => {
      let zoom = 100;

      // Method 1: Use visualViewport API if available (most accurate)
      if (window.visualViewport) {
        zoom = Math.round(window.visualViewport.scale * 100);
      }
      // Method 2: Fallback using devicePixelRatio
      else {
        zoom = Math.round((window.devicePixelRatio * window.screen.width) / window.innerWidth * 100);
      }

      // Additional check for high DPI displays
      if (window.devicePixelRatio > 1) {
        const calculatedZoom = Math.round((window.innerWidth * window.devicePixelRatio) / window.screen.width * 100);
        if (Math.abs(calculatedZoom - zoom) < 10) { // Within 10% tolerance
          zoom = calculatedZoom;
        }
      }

      console.log('Detected zoom level:', zoom);
      setBrowserZoomLevel(zoom);
      setIsZoomDisabled(zoom >= 150);

      // Force reset hover and zoom state when zoom is disabled
      if (zoom >= 150) {
        setIsHovering(false);
        setShowLens(false);
      }
    };

    // Listen for zoom changes with multiple methods
    const handleResize = () => detectZoomLevel();
    const handleVisualViewportChange = () => detectZoomLevel();

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    // Also listen for orientation changes (mobile)
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const parseImages = useCallback((images: unknown): string[] => {
    if (!images) return [];

    // Handle null/undefined
    if (images === null || images === undefined) return [];

    // Handle arrays
    if (Array.isArray(images)) {
      return images
        .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
        .map(img => img.trim());
    }

    // Handle strings
    if (typeof images === 'string') {
      const trimmed = images.trim();
      if (!trimmed) return [];

      // Check if it's a JSON string
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed
              .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
              .map(img => img.trim());
          }
        } catch (e) {
          console.warn('Failed to parse images as JSON:', e);
        }
      }

      // Check if it's comma-separated URLs
      if (trimmed.includes(',')) {
        return trimmed
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0);
      }

      // Single URL
      return [trimmed];
    }

    return [];
  }, []);

  const finalImages = useMemo(() => {
    if (!selectedVariant) {
      console.log('No selectedVariant available');
      return [fallbackImage];
    }

    console.log('Processing images for variant:', selectedVariant.article_id);
    console.log('Raw images data:', selectedVariant.images);

    let imgs = parseImages(selectedVariant.images);

    console.log('Parsed images:', imgs);

    // If no images from parsing, try thumbnail_url
    if (imgs.length === 0 && selectedVariant.thumbnail_url) {
      console.log('Using thumbnail_url as fallback:', selectedVariant.thumbnail_url);
      imgs = [selectedVariant.thumbnail_url];
    }

    // Final fallback to default image
    const result = imgs.length ? imgs : [fallbackImage];
    console.log('Final images array:', result);

    return result;
  }, [selectedVariant, parseImages]);

  // Notify parent component of zoom state changes - only when actual state changes
  useEffect(() => {
    // Only call onZoomStateChange if the actual zoom state values have changed
    // This prevents unnecessary re-renders when only the callback reference changes
    if (onZoomStateChange && typeof onZoomStateChange === 'function') {
      onZoomStateChange({
        isHovering,
        showLens,
        isZoomDisabled,
        currentImage: finalImages[selectedImage] || '',
        zoomLevel: ZOOM_LEVEL,
        zoomPos
      });
    }
  }, [isHovering, showLens, isZoomDisabled, selectedImage, zoomPos, finalImages, onZoomStateChange]);

  const nextImage = useCallback(() => setSelectedImage(p => (p + 1) % finalImages.length), [finalImages.length]);
  const prevImage = useCallback(() => setSelectedImage(p => (p - 1 + finalImages.length) % finalImages.length), [finalImages.length]);

  // Desktop: track mouse and compute lens + zoom position.
  const handleMouseEnter = useCallback(() => {
    // do not enable hover behavior on touch devices — but mouse events will not fire there typically
    if (isZoomDisabled) {
      console.log('Mouse enter blocked - zoom disabled');
      return;
    }
    setIsHovering(true);
  }, [isZoomDisabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setShowLens(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomDisabled) {
      console.log('Mouse move blocked - zoom disabled');
      return;
    }
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // compute lens top-left limited inside container
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const left = Math.max(0, Math.min(rawX - LENS_SIZE / 2, rect.width - LENS_SIZE));
    const top = Math.max(0, Math.min(rawY - LENS_SIZE / 2, rect.height - LENS_SIZE));
    setLensPosition({ x: left, y: top });

    // background position for zoom box (percentage)
    const px = (left / (rect.width - LENS_SIZE || 1)) * 100;
    const py = (top / (rect.height - LENS_SIZE || 1)) * 100;
    setZoomPos({ x: px, y: py });

    // only show lens when mouse is moving inside container
    if (!showLens) setShowLens(true);
  }, [showLens, isZoomDisabled]);

  // Toggle zoom lens with button (keeps old behavior: user can enable/disable)
  const toggleZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isZoomDisabled) {
      console.log('Zoom toggle blocked - zoom disabled');
      return;
    }
    setShowLens(s => !s);
  }, [isZoomDisabled]);

  // Modal controls
  const openImageModal = useCallback((index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);
  const closeImageModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  }, []);
  const navigateModalImage = useCallback((dir: 'prev' | 'next') => {
    setModalImageIndex(p => (dir === 'next' ? (p + 1) % finalImages.length : (p - 1 + finalImages.length) % finalImages.length));
  }, [finalImages.length]);

  // Touch (swipe) handlers for mobile — don't show lens for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchEndX(null);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) setTouchEndX(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStartX == null || touchEndX == null) {
      setTouchStartX(null);
      setTouchEndX(null);
      return;
    }
    const diff = touchStartX - touchEndX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      diff > 0 ? nextImage() : prevImage();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Keyboard navigation (modal / zoom)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isModalOpen) {
        if (e.key === 'Escape') closeImageModal();
        if (e.key === 'ArrowRight') navigateModalImage('next');
        if (e.key === 'ArrowLeft') navigateModalImage('prev');
      } else {
        // when not modal, allow left/right for images
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen, closeImageModal, navigateModalImage, nextImage, prevImage]);

  // image onError fallback with better error handling
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.target as HTMLImageElement;
    console.warn('Image failed to load:', t.src);

    // If it's not already the fallback image, try the fallback
    if (t.src !== fallbackImage) {
      console.log('Trying fallback image:', fallbackImage);
      t.src = fallbackImage;
    } else {
      // If even fallback fails, hide the image or show a placeholder
      console.error('Even fallback image failed to load');
      t.style.display = 'none';
      // Optionally show a placeholder div
      const placeholder = t.nextElementSibling as HTMLElement;
      if (placeholder && placeholder.classList.contains('image-placeholder')) {
        placeholder.style.display = 'flex';
      }
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Main image area - Simple single column layout for 40% container */}
      <div className="relative group">
        {/* Desktop & Mobile Layout - Single column within allocated space */}
        <div className="relative">
          {/* Prev / Next arrows - Mobile: always visible, Desktop: appear on hover */}
          {finalImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg z-20
                           opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                ❮
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg z-20
                           opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                ❯
              </button>
            </>
          )}

          <div
            ref={containerRef}
            className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden"
            onMouseEnter={window.innerWidth >= 768 ? handleMouseEnter : undefined}
            onMouseLeave={window.innerWidth >= 768 ? handleMouseLeave : undefined}
            onMouseMove={window.innerWidth >= 768 ? handleMouseMove : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Wishlist Icon - Top Right */}
            {onWishlistToggle && (
              <button
                onClick={(e) => { e.stopPropagation(); onWishlistToggle(); }}
                className={`absolute top-2 right-2 z-30 p-2 rounded-full shadow-lg transition-all duration-200 ${
                  isWishlisted
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700'
                }`}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Zoom disabled indicator */}
            {isZoomDisabled && (
              <div className="absolute top-3 left-3 bg-yellow-100 dark:bg-yellow-900/80 text-yellow-800 dark:text-yellow-200 px-2 py-1.5 rounded text-xs font-medium shadow-lg z-30">
                Zoom disabled at {browserZoomLevel}% browser zoom
              </div>
            )}

            <img
              src={finalImages[selectedImage]}
              alt={productName}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isZoomDisabled || window.innerWidth < 768 ? 'cursor-default' : (isHovering ? 'cursor-crosshair' : 'cursor-default')
              }`}
              onClick={() => openImageModal(selectedImage)}
              onError={handleImageError}
            />

            {/* Image loading placeholder */}
            {finalImages[selectedImage] === fallbackImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">Image not available</p>
                </div>
              </div>
            )}

            {/* Lens circle (desktop only) - Only show when zoom is NOT disabled and not on mobile */}
            {isHovering && showLens && !isZoomDisabled && window.innerWidth >= 768 && (
              <div
                className="absolute rounded-full pointer-events-none z-30"
                style={{
                  width: `${LENS_SIZE}px`,
                  height: `${LENS_SIZE}px`,
                  left: `${lensPosition.x}px`,
                  top: `${lensPosition.y}px`,
                  boxShadow: '0 0 0 1000px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.6)',
                  clipPath: `circle(${LENS_SIZE/2}px at ${LENS_SIZE/2}px ${LENS_SIZE/2}px)`
                }}
              />
            )}
          </div>

          {/* Slideshow button - Always visible when multiple images
          {finalImages.length > 1 && (
            <div className="absolute bottom-3 right-3 z-30">
              <button
                onClick={(e) => { e.stopPropagation(); openImageModal(selectedImage); }}
                aria-label="Open slideshow"
                className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                🖼️
              </button>
            </div>
          )} */}
        </div>
      </div>

      {/* Thumbnails */}
      {finalImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {finalImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform ${idx === selectedImage ? 'border-accent scale-105 ring-2 ring-accent/50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
              aria-label={`Thumbnail ${idx + 1}`}
            >
              <img src={img} alt={`${productName} ${idx + 1}`} className="w-full h-full object-cover" onError={handleImageError} />
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4" onClick={closeImageModal}>
          <div className="relative w-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeImageModal} className="absolute -top-10 right-0 text-white">
              <X className="w-8 h-8" />
            </button>

            <img
              src={finalImages[modalImageIndex]}
              alt={`${productName} - ${modalImageIndex + 1}`}
              className="max-w-full max-h-[80vh] mx-auto object-contain"
              onError={handleImageError}
            />

            {finalImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateModalImage('prev'); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                  aria-label="Previous"
                >
                  ❮
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateModalImage('next'); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                  aria-label="Next"
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
      )}

      {/* Color disclaimer */}
      <div className="mt-4 px-3">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-2 rounded text-sm">
          <p className="text-yellow-700 dark:text-yellow-300">
            <span className="font-medium">Color Disclaimer:</span> Product colors may appear slightly different due to
            monitor settings. Every effort is made to display colors accurately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductImageGallery;