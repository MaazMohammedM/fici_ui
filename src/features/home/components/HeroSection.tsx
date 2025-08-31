import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroImage from "../assets/Hero image.png";
import hisHeroImage from "../assets/20250321_165625.png";
import productHeroImage from "../assets/20250710_160720.png";
import heroImage1 from "../assets/20250503_145045.png";

const heroSlides = [
  {
    id: "1",
    title: "Real Leather. Real You.",
    subtitle: "Premium leather shoes made from genuine materials and honest design.",
    image: heroImage,
    ctaText: "Shop Now",
    ctaLink: "/products",
  },
  {
    id: "2",
    title: "For Him",
    subtitle: "Discover our exclusive collection of men's footwear.",
    image: hisHeroImage,
    ctaText: "Shop Men",
    ctaLink: "/products?gender=men",
  },
  {
    id: "3",
    title: "For Her",
    subtitle: "Elegant designs crafted for the modern woman.",
    image: heroImage,
    ctaText: "Shop Women",
    ctaLink: "/products?gender=women",
  },
  {
    id: "4",
    title: "New Arrivals",
    subtitle: "Be the first to explore our latest collection.",
    image: productHeroImage,
    ctaText: "Explore",
    ctaLink: "/products",
  },
  {
    id: "5",
    title: "Premium Quality",
    subtitle: "Every stitch tells a story of craftsmanship.",
    image: heroImage1,
    ctaText: "Learn More",
    ctaLink: "/about",
  },
];

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () =>
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const goToNext = () =>
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

  return (
    <section className="relative w-full h-[80vh] sm:h-[90vh] md:h-screen overflow-hidden">
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center md:items-start justify-center h-full px-6 md:px-16 lg:px-24 text-center md:text-left">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg mb-4">
              {slide.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-xl mb-6">
              {slide.subtitle}
            </p>
            <Link
              to={slide.ctaLink}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-full shadow-lg transition-transform duration-300 hover:scale-105"
            >
              {slide.ctaText}
            </Link>
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-accent scale-125"
                : "bg-white/70 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
