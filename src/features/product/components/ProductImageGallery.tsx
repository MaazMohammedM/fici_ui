// src/features/product/components/ProductImageGallery.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../../../types/product';
import fallbackImage from '../../../assets/Fici_logo.png';
import { ZoomIn, ZoomOut, X, Heart, Share2 } from 'lucide-react';
import ShareModal from './ShareModal';
import { getDetailImageUrl, getThumbnailUrl } from '../../../lib/utils/imageOptimization';

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
const ZOOM_LEVEL = 2;

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  selectedVariant,
  productName,
  isWishlisted = false,
  onWishlistToggle,
  onZoomStateChange
}: ProductImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const [isHovering, setIsHovering] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [browserZoomLevel, setBrowserZoomLevel] = useState(100);
  const [isZoomDisabled, setIsZoomDisabled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedImage(0);
    // Reset zoom state when variant changes
    setIsHovering(false);
    setShowLens(false);
    setLensPosition({ x: 0, y: 0 });
    setZoomPos({ x: 50, y: 50 });
  }, [selectedVariant]);

  useEffect(() => {
    const detectZoomLevel = () => {
      let zoom = 100;

      if (window.visualViewport) {
        zoom = Math.round(window.visualViewport.scale * 100);
      }
      else {
        zoom = Math.round((window.devicePixelRatio * window.screen.width) / window.innerWidth * 100);
      }

      if (window.devicePixelRatio > 1) {
        const calculatedZoom = Math.round((window.innerWidth * window.devicePixelRatio) / window.screen.width * 100);
        if (Math.abs(calculatedZoom - zoom) < 10) { 
          zoom = calculatedZoom;
        }
      }

      setBrowserZoomLevel(zoom);
      setIsZoomDisabled(zoom >= 150);

      if (zoom >= 150) {
        setIsHovering(false);
        setShowLens(false);
      }
    };

    const handleResize = () => detectZoomLevel();
    const handleVisualViewportChange = () => detectZoomLevel();

    // Initial detection
    detectZoomLevel();

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []); 

  const parseImages = useCallback((images: unknown): string[] => {
    if (!images) return [];

    if (images === null || images === undefined) return [];

    if (Array.isArray(images)) {
      return images
        .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
        .map(img => img.trim());
    }

    if (typeof images === 'string') {
      const trimmed = images.trim();
      if (!trimmed) return [];

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

      if (trimmed.includes(',')) {
        return trimmed
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0);
      }

      return [trimmed];
    }

    return [];
  }, []);

  const finalImages = useMemo(() => {
    if (!selectedVariant) {
      return [fallbackImage];
    }

    let imgs = parseImages(selectedVariant.images);

    if (imgs.length === 0 && selectedVariant.thumbnail_url) {
      imgs = [selectedVariant.thumbnail_url];
    }

    // Optimize images for detail page
    const optimizedImages = imgs.length 
      ? imgs.map(img => getDetailImageUrl(img))
      : [fallbackImage];

    return optimizedImages;
  }, [selectedVariant, parseImages]);

  useEffect(() => {
    // Reset zoom state when switching images
    setIsHovering(false);
    setShowLens(false);
    setLensPosition({ x: 0, y: 0 });
    setZoomPos({ x: 50, y: 50 });
  }, [selectedImage]);

  useEffect(() => {
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

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomDisabled) {
      return;
    }
    // Check if mouse is over the share or wishlist icon areas
    const target = e.target as HTMLElement;
    const isOverIcon = target.closest('[data-icon="share"], [data-icon="wishlist"]');
    if (!isOverIcon) {
      setIsHovering(true);
    }
  }, [isZoomDisabled]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Check if mouse is still over the share or wishlist icon areas
    const target = e.target as HTMLElement;
    const relatedTarget = e.relatedTarget;
    
    // Safely check if relatedTarget exists and has the closest method
    let isMovingToIcon = false;
    if (relatedTarget && relatedTarget instanceof HTMLElement) {
      isMovingToIcon = !!relatedTarget.closest('[data-icon="share"], [data-icon="wishlist"]');
    }
    
    if (!isMovingToIcon) {
      setIsHovering(false);
      setShowLens(false);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomDisabled) {
      return;
    }
    // Check if mouse is over the share or wishlist icon areas
    const target = e.target as HTMLElement;
    const isOverIcon = target.closest('[data-icon="share"], [data-icon="wishlist"]');
    if (isOverIcon) {
      setIsHovering(false);
      setShowLens(false);
      return;
    }
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const left = Math.max(0, Math.min(rawX - LENS_SIZE / 2, rect.width - LENS_SIZE));
    const top = Math.max(0, Math.min(rawY - LENS_SIZE / 2, rect.height - LENS_SIZE));
    setLensPosition({ x: left, y: top });

    const px = (left / (rect.width - LENS_SIZE || 1)) * 100;
    const py = (top / (rect.height - LENS_SIZE || 1)) * 100;
    setZoomPos({ x: px, y: py });

    if (!showLens) setShowLens(true);
  }, [showLens, isZoomDisabled]);

  const toggleZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isZoomDisabled) {
      console.log('Zoom toggle blocked - zoom disabled');
      return;
    }
    setShowLens(s => !s);
  }, [isZoomDisabled]);

  const openImageModal = useCallback((index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);
  const closeImageModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  }, []);
  const openShareModal = useCallback(() => {
    setIsShareModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);
  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
    document.body.style.overflow = 'unset';
  }, []);
  const navigateModalImage = useCallback((dir: 'prev' | 'next') => {
    setModalImageIndex(p => (dir === 'next' ? (p + 1) % finalImages.length : (p - 1 + finalImages.length) % finalImages.length));
  }, [finalImages.length]);

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

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.target as HTMLImageElement;
    console.warn('Image failed to load:', t.src);

    if (t.src !== fallbackImage) {
      t.src = fallbackImage;
    } else {
      console.error('Even fallback image failed to load');
      t.style.display = 'none';
      const placeholder = t.nextElementSibling as HTMLElement;
      if (placeholder && placeholder.classList.contains('image-placeholder')) {
        placeholder.style.display = 'flex';
      }
    }
  }, []);

  // Generate product URL and get price for sharing
  const productUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/products/${selectedVariant?.article_id || ''}`;
    }
    return '';
  }, [selectedVariant]);

  const productPrice = selectedVariant?.discount_price ? selectedVariant.discount_price.toString() : undefined;

  return (
    <div className="space-y-4">
      {/* Color disclaimer - Desktop: above image, Mobile: below image */}
      <div className="hidden md:block px-3">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-lg text-sm">
          <p className="text-yellow-700 dark:text-yellow-300">
            <span className="font-medium">Product Color Information: </span>
            We do our best to show you exactly what each product looks like, but sometimes colors may look slightly different in person due to lighting and screen differences.
          </p>
        </div>
      </div>

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
            onMouseEnter={isDesktop ? handleMouseEnter : undefined}
            onMouseLeave={isDesktop ? handleMouseLeave : undefined}
            onMouseMove={isDesktop ? handleMouseMove : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Wishlist Icon - Top Right */}
            {onWishlistToggle && (
              <button
                data-icon="wishlist"
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

            {/* Share Icon - Below Wishlist */}
            <button
              data-icon="share"
              onClick={(e) => { e.stopPropagation(); openShareModal(); }}
              className="absolute top-12 right-2 z-30 p-2 rounded-full shadow-lg transition-all duration-200 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
              aria-label="Share product"
            >
              <Share2 className="w-4 h-4" />
            </button>

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
                isZoomDisabled || !isDesktop ? 'cursor-default' : (isHovering ? 'cursor-crosshair' : 'cursor-default')
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
            {isHovering && showLens && !isZoomDisabled && isDesktop && (
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
          {finalImages.map((img, idx) => {
            // Get original image for thumbnail optimization
            const originalImage = parseImages(selectedVariant?.images)?.[idx] || selectedVariant?.thumbnail_url || fallbackImage;
            const thumbnailUrl = getThumbnailUrl(originalImage);
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform ${idx === selectedImage ? 'border-accent scale-105 ring-2 ring-accent/50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                aria-label={`Thumbnail ${idx + 1}`}
              >
                <img src={thumbnailUrl} alt={`${productName} - Premium leather shoes from Ambur manufacturer ${idx + 1}`} className="w-full h-full object-cover" onError={handleImageError} loading="lazy" decoding="async" />
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          {/* Close button positioned in the overlay */}
          <button 
            onClick={closeImageModal} 
            className="absolute top-4 right-4 text-white p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 z-50 shadow-lg"
            aria-label="Close image modal"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          
          <div className="relative w-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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

      {/* Color disclaimer - Mobile: below image */}
      <div className="md:hidden px-3">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded-lg text-sm">
          <p className="text-yellow-700 dark:text-yellow-300">
            <span className="font-medium">Product Color Information: </span>
            We do our best to show you exactly what each product looks like, but sometimes colors may look slightly different in person due to lighting and screen differences.
          </p>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        productName={productName}
        productUrl={productUrl}
        productImage={finalImages[selectedImage]}
        productPrice={productPrice}
      />
    </div>
  );
};

export default ProductImageGallery;