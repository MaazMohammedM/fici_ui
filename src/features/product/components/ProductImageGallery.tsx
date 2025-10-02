// src/features/product/components/ProductImageGallery.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../../../types/product';
import fallbackImage from '../../../assets/Fici_logo.png';
import { ZoomIn, ZoomOut, X } from 'lucide-react';

interface ProductImageGalleryProps {
  selectedVariant: Product | undefined;
  productName: string;
}

const LENS_SIZE = 250;
const ZOOM_LEVEL = 3.5;

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ selectedVariant, productName }) => {
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

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  // Parse images robustly (array / json-string / comma list / single url)
  const parseImages = useCallback((images: unknown): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter((i): i is string => !!i && typeof i === 'string');
    if (typeof images === 'string') {
      const trimmed = images.trim();
      if (!trimmed) return [];
      // comma separated
      if (trimmed.includes(',')) return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      // try JSON
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter((i): i is string => !!i && typeof i === 'string');
      } catch { /* ignore */ }
      return [trimmed];
    }
    return [];
  }, []);

  const finalImages = useMemo(() => {
    if (!selectedVariant) return [fallbackImage];
    let imgs = parseImages(selectedVariant.images);
    if (imgs.length === 0 && selectedVariant.thumbnail_url) imgs = [selectedVariant.thumbnail_url];
    return imgs.length ? imgs : [fallbackImage];
  }, [selectedVariant, parseImages]);

  const nextImage = useCallback(() => setSelectedImage(p => (p + 1) % finalImages.length), [finalImages.length]);
  const prevImage = useCallback(() => setSelectedImage(p => (p - 1 + finalImages.length) % finalImages.length), [finalImages.length]);

  // Desktop: track mouse and compute lens + zoom position.
  const handleMouseEnter = useCallback(() => {
    // do not enable hover behavior on touch devices — but mouse events will not fire there typically
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setShowLens(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
  }, [showLens]);

  // Toggle zoom lens with button (keeps old behavior: user can enable/disable)
  const toggleZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLens(s => !s);
  }, []);

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

  // image onError fallback
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.target as HTMLImageElement;
    if (t.src !== fallbackImage) t.src = fallbackImage;
  }, []);

  return (
    <div className="space-y-4">
      {/* Main image area */}
      <div className="relative group">
        {/* Prev / Next arrows
            - Mobile: always visible
            - Desktop: appear on hover (kept visually subtle via opacity)
        */}
        {finalImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg z-20
                         md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              ❮
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg z-20
                         md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              ❯
            </button>
          </>
        )}

        <div
          ref={containerRef}
          className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={finalImages[selectedImage]}
            alt={productName}
            className={`w-full h-full object-cover transition-all duration-300 ${isHovering ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={() => openImageModal(selectedImage)}
            onError={handleImageError}
          />

          {/* Lens circle (desktop only) */}
          {isHovering && showLens && (
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

          {/* Zoom preview box (desktop only) */}
          {isHovering && showLens && (
            <div
              className="hidden md:block fixed z-40 rounded-xl overflow-hidden shadow-2xl"
              style={{
                width: 500,
                height: 500,
                left: '60%', // approximate placement to the right of content (same approach as your original)
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundImage: `url(${finalImages[selectedImage]})`,
                backgroundSize: `${100 * ZOOM_LEVEL}%`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundRepeat: 'no-repeat',
                border: '2px solid rgba(255,255,255,0.12)'
              }}
            />
          )}
        </div>

        {/* Zoom toggle & slideshow button */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-30">
          <button
            onClick={toggleZoom}
            aria-label={showLens ? 'Disable zoom' : 'Enable zoom'}
            className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            {showLens ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {finalImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); openImageModal(selectedImage); }}
              aria-label="Open slideshow"
              className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg"
            >
              🖼️
            </button>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {finalImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {finalImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-transform ${
                idx === selectedImage ? 'border-accent scale-105 ring-2 ring-accent/50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              aria-label={`Thumbnail ${idx + 1}`}
            >
              <img src={img} alt={`${productName} ${idx + 1}`} className="w-full h-full object-cover" onError={handleImageError} />
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={closeImageModal}>
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
      <div className="mt-4 px-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <span className="font-medium">Color Disclaimer:</span> Product colors may appear slightly different due to
            monitor settings. Every effort is made to display colors accurately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductImageGallery;