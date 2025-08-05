import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroImage from "../assets/Hero image.png";

const heroSlides = [
  {
    id: "1",
    title: "Real Leather. Real You.",
    subtitle: "Premium leather shoes made from genuine materials and honest design.",
    image: heroImage,
    ctaText: "Shop Now",
    ctaLink: "/products"
  },
  {
    id: "2",
    title: "For Him",
    subtitle: "Discover our exclusive collection of men's footwear.",
    image: heroImage,
    ctaText: "Shop Men",
    ctaLink: "/products?gender=men",
    gender: "men"
  },
  {
    id: "3",
    title: "For Her",
    subtitle: "Elegant designs crafted for the modern woman.",
    image: heroImage,
    ctaText: "Shop Women",
    ctaLink: "/products?gender=women",
    gender: "women"
  },
  {
    id: "4",
    title: "New Arrivals",
    subtitle: "Be the first to explore our latest collection.",
    image: heroImage,
    ctaText: "Explore",
    ctaLink: "/products"
  },
  {
    id: "5",
    title: "Premium Quality",
    subtitle: "Every stitch tells a story of craftsmanship.",
    image: heroImage,
    ctaText: "Learn More",
    ctaLink: "/about"
  }
];

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <section className="bg-gradient-light dark:bg-gradient-dark h-[calc(100svh-4rem)] w-full relative overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex flex-col lg:flex-row w-full h-full items-center justify-between px-4 lg:px-16">
              <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center text-center lg:text-left">
                <h1 className="font-secondary text-3xl lg:text-6xl font-bold text-primary dark:text-secondary z-10 mb-4 px-4">
                  {slide.title}
                </h1>
                <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md px-4">
                  {slide.subtitle}
                </p>
                <Link
                  to={slide.ctaLink}
                  className="bg-accent hover:bg-accent/80 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-lg text-base lg:text-lg font-semibold transition-colors duration-300 transform hover:scale-105"
                >
                  {slide.ctaText}
                </Link>
              </div>
              <div className="w-full lg:w-1/2 h-full flex items-center justify-center relative">
                <img
                  src={slide.image}
                  alt="hero"
                  className="w-3/4 lg:w-fit h-auto lg:h-fit inline-block object-contain -rotate-45 z-10"
                />
                <div className="hidden lg:block w-1/2 h-[50%] rounded-full bg-accent/75 absolute top-48 left-48 shadow-2xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 lg:p-3 rounded-full transition-all duration-300 backdrop-blur-sm z-20"
      >
        <ChevronLeft className="w-4 lg:w-6 h-4 lg:h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 lg:p-3 rounded-full transition-all duration-300 backdrop-blur-sm z-20"
      >
        <ChevronRight className="w-4 lg:w-6 h-4 lg:h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 lg:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 lg:space-x-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 lg:w-3 h-2 lg:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-accent scale-125"
                : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;