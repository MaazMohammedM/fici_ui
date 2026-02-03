import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import desktop images
import pc1 from "../../assets/1000805150_pc.jpg";
import pc2 from "../../assets/1000805146_pc.jpg";
import pc4 from "../../assets/1000805148_pc.jpg";
import pc5 from "../../assets/1000805157_pc.jpg";
import pc6 from "../../assets/1000805149_pc.jpg";

// Import mobile images
import mobile1 from "../../assets/1000806049_mobile.png";
import mobile2 from "../../assets/1000806046_mobile.jpg";
import mobile3 from "../../assets/1000806089_mobile.jpg";
import mobile5 from "../../assets/1000806094_mobile.jpg";
import mobile6 from "../../assets/1000806095_mobile.jpg";

const desktopImages = [pc1, pc2, pc4, pc5, pc6];
const mobileImages = [mobile1, mobile2, mobile3, mobile5, mobile6];

const heroSlides = [
  { 
    id: "1", 
    ctaLink: "/products/Woxmsch265_brown",
    title: "Premium Leather Collections",
    subtitle: "Handcrafted Excellence",
    description: "Discover our curated selection of premium leather goods"
  },
  { 
    id: "2", 
    ctaLink: "/products?gender=men",
    title: "Men's Collection",
    subtitle: "Sophisticated Style",
    description: "Elevate your wardrobe with our premium leather essentials"
  },
  { 
    id: "3", 
    ctaLink: "/products?gender=women",
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
      {/* Responsive container with safe height boundaries */}
      <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] sm:h-[55vh] sm:min-h-[450px] md:h-[60vh] md:min-h-[500px] lg:h-[65vh] lg:min-h-[550px] xl:h-[70vh] xl:min-h-[600px]">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === currentSlide 
                ? "opacity-100 scale-100 z-10" 
                : "opacity-0 scale-95 z-0 pointer-events-none"
            }`}
          >
            {/* Image container */}
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
              <div className="absolute inset-0">
                <picture className="w-full h-full">
                  <source 
                    media="(min-width: 768px)" 
                    srcSet={desktopImages[index]}
                  />
                  <img
                    src={mobileImages[index]}
                    alt={`Featured collection ${index + 1}`}
                    className="w-full h-full object-contain object-center bg-gray-100 cursor-pointer"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </picture>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-6 md:px-8 pointer-events-none z-20">
        <button
          onClick={goToPrevious}
          className="pointer-events-auto group relative p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        <button
          onClick={goToNext}
          className="pointer-events-auto group relative p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
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
