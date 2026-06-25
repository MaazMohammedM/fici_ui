import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import desktop images
import pc1 from "../../assets/desktop_slide_04.png";
import pc2 from "../../assets/desktop_slide_4.png"
import pc4 from "../../assets/desktop_slide_Pdd54_dk.tan.png";
import pc5 from "../../assets/desktop_slide_04.png";

// Import mobile images
import mobile1 from "../../assets/mobile_slide_04.png";
import mobile2 from "../../assets/monthly_slide_3.png";
import mobile3 from "../../assets/mobile_slide_Pdd54_dk.tan.png";
import mobile5 from "../../assets/mobile_slide_04.png";

const desktopImages = [pc1, pc2, pc4, pc5];
const mobileImages = [mobile1, mobile2, mobile3, mobile5];

const heroSlides = [
  { 
    id: "1", 
    ctaLink: "/products/Pslc22_black",
    title: "Premium Leather Collections",
    subtitle: "Handcrafted Excellence",
    description: "Discover our curated selection of premium leather goods"
  },
  { 
    id: "2", 
    ctaLink: "/products/Woxmsch265_brown",
    title: "Men's Collection",
    subtitle: "Sophisticated Style",
    description: "Elevate your wardrobe with our premium leather essentials"
  },
  { 
    id: "3", 
    ctaLink: "/products/Pdd54_dk.tan.png",
    title: "Women's Collection", 
    subtitle: "Timeless Elegance",
    description: "Discover elegant leather pieces designed for the modern woman"
  },
  { 
    id: "4", 
    ctaLink: "/about",
    title: "Our Heritage",
    subtitle: "Crafted Since 2020",
    description: "Learn about our commitment to quality and craftsmanship"
  },
];

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
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

  const currentSlideData = heroSlides[currentSlide];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
      {/* Responsive container with aspect-ratio based on image dimensions */}
      <div className="relative w-full">
        {/* Dynamic height based on current slide's aspect ratio */}
        <div 
          className="relative w-full"
          style={{
            aspectRatio: isMobile 
              ? '800/1200' // Mobile aspect ratio (2:3 for 800x1200 images)
              : '2125/914', // Use original aspect ratio for both tablet and desktop
            minHeight: '400px',
            maxHeight: '90vh'
          }}
        >
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                index === currentSlide 
                  ? "opacity-100 scale-100 z-10" 
                  : "opacity-0 scale-95 z-0 pointer-events-none"
              }`}
            >
              {/* Image container with proper aspect ratio */}
              <Link 
                to={slide.ctaLink}
                className="absolute inset-0 block"
                onClick={(e) => {
                  // Prevent navigation if clicking on navigation buttons
                  if ((e.target as HTMLElement).closest('button')) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="absolute inset-0 bg-white">
                  {/* Desktop image - object-cover to fill container and eliminate gaps */}
                  <img
                    src={desktopImages[index]}
                    alt={`Featured collection ${index + 1}`}
                    className="hidden md:block w-full h-full object-cover cursor-pointer"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  {/* Tablet image - object-contain to show full content */}
                  <img
                    src={desktopImages[index]}
                    alt={`Featured collection ${index + 1}`}
                    className="hidden md:hidden lg:block w-full h-full object-contain cursor-pointer"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  {/* Mobile image - object-contain to maintain aspect ratio on mobile */}
                  <img
                    src={mobileImages[index]}
                    alt={`Featured collection ${index + 1}`}
                    className="block md:hidden lg:hidden w-full h-full object-contain cursor-pointer"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons - positioned absolutely over the entire hero section */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none" style={{ height: '100%' }}>
        <button
          onClick={goToPrevious}
          className="pointer-events-auto absolute left-4 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-gray-800 hover:bg-white hover:text-gray-900 transition-all duration-300 hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        <button
          onClick={goToNext}
          className="pointer-events-auto absolute right-4 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-gray-800 hover:bg-white hover:text-gray-900 transition-all duration-300 hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            className={`transition-all duration-300 ${
              index === currentSlide 
                ? "w-8 h-2 bg-white rounded-full" 
                : "w-2 h-2 bg-white/40 hover:bg-white/60 rounded-full"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
