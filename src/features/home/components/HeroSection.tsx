
// ==========================================
// HERO SECTION - Fully Responsive Component
// ==========================================

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import desktop images
import pc1 from "../../../assets/1000805156_pc.jpg";
import pc2 from "../../../assets/1000805146_pc.jpg";
import pc3 from "../../../assets/1000805147_pc.jpg";
import pc4 from "../../../assets/1000805148_pc.jpg";
import pc5 from "../../../assets/1000805157_pc.jpg";
import pc6 from "../../../assets/1000805149_pc.jpg";

// Import mobile images
import mobile1 from "../../../assets/1000806046_mobile.jpg";
import mobile2 from "../../../assets/1000806060_mobile.jpg";
import mobile3 from "../../../assets/1000806089_mobile.jpg";
import mobile4 from "../../../assets/1000806090_mobile.jpg";
import mobile5 from "../../../assets/1000806094_mobile.jpg";
import mobile6 from "../../../assets/1000806095_mobile.jpg";

const desktopImages = [pc1, pc2, pc3, pc4, pc5, pc6];
const mobileImages = [mobile1, mobile2, mobile3, mobile4, mobile5, mobile6];

const heroSlides = [
  { id: "1", ctaLink: "/products" },
  { id: "2", ctaLink: "/products?gender=men" },
  { id: "3", ctaLink: "/products?gender=women" },
  { id: "4", ctaLink: "/products" },
  { id: "5", ctaLink: "/about" },
  { id: "6", ctaLink: "/about" },
];

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handleSlideClick = (link: string) => {
    window.location.href = link;
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black"
      aria-label="Featured banners carousel"
    >
      {/* 
        Fully responsive hero carousel with:
        1. Adaptive height that scales with viewport (mobile to ultra-wide)
        2. object-contain ensures entire image is always visible
        3. Separate mobile/desktop images for optimal viewing
        4. No cropping of key content on any device
      */}
      
      {/* Responsive container with safe height boundaries */}
      <div className="relative w-full h-[60vh] min-h-[400px] max-h-[900px] sm:h-[65vh] sm:min-h-[450px] md:h-[70vh] md:min-h-[500px] lg:h-[75vh] lg:min-h-[550px] xl:h-[80vh] xl:min-h-[600px] 2xl:h-[85vh] 2xl:min-h-[650px]">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => handleSlideClick(slide.ctaLink)}
            className={`absolute inset-0 transition-all duration-700 ease-out cursor-pointer ${
              index === currentSlide 
                ? "opacity-100 scale-100 z-10" 
                : "opacity-0 scale-95 z-0 pointer-events-none"
            }`}
            aria-hidden={index !== currentSlide}
            role="button"
            tabIndex={index === currentSlide ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSlideClick(slide.ctaLink);
              }
            }}
          >
            {/* Image container - ensures full visibility with object-contain */}
            <div className="absolute inset-0 flex items-center justify-center">
              <picture className="w-full h-full flex items-center justify-center">
                <source 
                  media="(min-width: 640px)" 
                  srcSet={desktopImages[index]}
                />
                <img
                  src={mobileImages[index]}
                  alt={`Featured collection ${index + 1}`}
                  className="w-full h-full object-contain object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              </picture>
            </div>
            
            {/* Subtle gradient overlay - doesn't interfere with image visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Navigation buttons with responsive positioning */}
      <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 pointer-events-none z-20">
        <button
          onClick={goToPrevious}
          className="pointer-events-auto group relative p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 text-white hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_40px_rgba(0,0,0,0.15)]"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform group-hover:-translate-x-0.5" />
          <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <button
          onClick={goToNext}
          className="pointer-events-auto group relative p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 text-white hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_40px_rgba(0,0,0,0.15)]"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-0.5" />
          <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Pagination dots with responsive positioning */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 md:gap-3 px-4">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            className={`group relative transition-all duration-300 focus:outline-none focus-visible:scale-110 ${
              index === currentSlide ? "scale-110" : "scale-100 hover:scale-105"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          >
            <span 
              className={`block w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.1)] ${
                index === currentSlide
                  ? "bg-gradient-to-r from-white to-gray-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.2)]"
                  : "bg-white/40 hover:bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.1)]"
              }`}
            />
            {/* Hover glow effect */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
          </button>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black/10 dark:bg-white/10 z-10">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-linear"
          style={{
            width: `${((currentSlide + 1) / heroSlides.length) * 100}%`
          }}
        />
      </div>
    </section>
  );
};

export default HeroSection;