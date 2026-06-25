import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Mumbai, India",
    rating: 5,
    text: "Absolutely love the quality of leather! The craftsmanship is exceptional and the customer service was outstanding. Will definitely be ordering again.",
    product: "Classic Leather Bag",
    avatar: "PS"
  },
  {
    id: 2,
    name: "Rahul Verma",
    location: "Delhi, India", 
    rating: 5,
    text: "The shoes are perfect! Great fit, amazing quality, and they look even better in person. Fast shipping too. Highly recommend!",
    product: "Oxford Leather Shoes",
    avatar: "RV"
  },
  {
    id: 3,
    name: "Ananya Patel",
    location: "Bangalore, India",
    rating: 5,
    text: "Beautiful accessories that exceeded my expectations. The attention to detail is remarkable. Worth every penny!",
    product: "Leather Wallet Set",
    avatar: "AP"
  },
  {
    id: 4,
    name: "Vikram Mehta",
    location: "Pune, India",
    rating: 5,
    text: "Outstanding quality and style. The sandals are comfortable and look premium. Customer service was very helpful with sizing.",
    product: "Premium Leather Sandals",
    avatar: "VM"
  }
];

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            What Our Customers Say
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Real reviews from real customers who love our products
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 text-gray-200 dark:text-gray-700">
              <Quote className="w-12 h-12" />
            </div>

            {/* Testimonial Content */}
            <div className="relative">
              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${i < currentTestimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <blockquote className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 text-center leading-relaxed mb-8">
                "{currentTestimonial.text}"
              </blockquote>

              {/* Customer Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {currentTestimonial.avatar}
                  </div>
                  
                  {/* Name and Location */}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {currentTestimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {currentTestimonial.location}
                    </div>
                  </div>
                </div>

                {/* Product */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Purchased: <span className="font-medium">{currentTestimonial.product}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={goToPrevious}
              className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-transform duration-300"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 h-2 bg-gray-800 dark:bg-white rounded-full" 
                      : "w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full hover:bg-gray-600 dark:hover:bg-gray-400"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-transform duration-300"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              10K+
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Happy Customers
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              4.9/5
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Average Rating
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              50+
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Products
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              98%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Satisfaction Rate
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
