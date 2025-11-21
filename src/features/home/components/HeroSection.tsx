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
      className="relative w-full overflow-hidden mt-0 bg-white dark:bg-black"
      aria-label="Featured banners carousel"
      style={{ position: "relative", left: 0, right: 0 }}
    >
      {/* Slides container - keep slides absolutely positioned so they overlap */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh]">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => handleSlideClick(slide.ctaLink)}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={index !== currentSlide}
          >
            {/* Desktop Image - the image fills viewport width (full-bleed) */}
            <img
              src={desktopImages[index]}
              alt={`Slide ${index + 1}`}
              className="hidden sm:block hero-img-desktop"
              // ensure keyboard focus / semantics remain minimal (image is just decorative in many cases)
              role="img"
            />

            {/* Mobile Image - also full-bleed */}
            <img
              src={mobileImages[index]}
              alt={`Slide ${index + 1}`}
              className="block sm:hidden hero-img-mobile"
              role="img"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            className={`w-2.5 h-2.5 rounded-full border border-white/70 transition-colors ${
              index === currentSlide ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;