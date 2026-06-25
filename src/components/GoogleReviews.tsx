import React, { useState, useCallback } from 'react';
import { Star, Quote, ExternalLink, ChevronLeft, ChevronRight, CheckCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useGoogleReviews } from '../hooks/useGoogleReviews';
import { useMockGoogleReviews } from '../hooks/useMockGoogleReviews';
import type { GoogleReview } from '../types/google-reviews';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GoogleReviews: React.FC = () => {
  const useMock = import.meta.env.VITE_USE_MOCK_REVIEWS === 'true';
  const { reviews, placeDetails, loading, error, refetch } = useMock ?
    useMockGoogleReviews() :
    useGoogleReviews({ useFallback: true });

  // Reviews are already filtered and sorted by the hook (latest 5 with valid text)
  const displayReviews = reviews;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === displayReviews.length - 1 ? 0 : prev + 1));
  }, [displayReviews.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayReviews.length - 1 : prev - 1));
  };

  const toggleReviewExpansion = (reviewIndex: number) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewIndex)) {
        newSet.delete(reviewIndex);
      } else {
        newSet.add(reviewIndex);
      }
      return newSet;
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
      />
    ));
  };

  if (loading) return <div className="py-20 text-center animate-pulse">Loading amazing experiences...</div>;

  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Premium Google Branding Pill */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border border-gray-200 rounded-full shadow-lg backdrop-blur-sm mb-6 whitespace-nowrap">
            <GoogleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Trusted by our community on Google</span>
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3 whitespace-nowrap">
            What Our Customers Say
          </h2>
          
          {placeDetails && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {renderStars(5)}
                <span className="ml-2 font-bold text-2xl text-gray-900">{placeDetails.rating.toFixed(1)}</span>
              </div>
              <p className="text-gray-600 font-medium">
                Based on  verified reviews
              </p>
            </div>
          )}
        </div>

        {/* Reviews Carousel - Full-bleed on mobile, constrained on desktop */}
        <div className="relative w-full lg:max-w-5xl xl:max-w-6xl mx-auto">
          {/* Mobile Navigation - Outside content area */}
          <div className="lg:hidden flex justify-between items-center mb-4 px-4">
            <button
              onClick={handlePrevious}
              className="bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-md hover:bg-blue-600 hover:text-white transition-all duration-300 z-20 hover:scale-105"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {displayReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300'}`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-md hover:bg-blue-600 hover:text-white transition-all duration-300 z-20 hover:scale-105"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {displayReviews.map((review, index) => {
                  const isExpanded = expandedReviews.has(index);
                  const shouldTruncate = review.text.length > 200 && !isExpanded;
                  const displayText = shouldTruncate ? `${review.text.substring(0, 200)}...` : review.text;

                  return (
                    <div key={index} className="w-full flex-shrink-0 px-2 sm:px-4 lg:px-6">
                      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/50 relative hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-300">
                        <Quote className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 text-blue-100 opacity-60" />

                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                          <img
                            src={review.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=random`}
                            alt={review.author_name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-4 ring-blue-50 shadow-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                              <span className="line-clamp-2 sm:line-clamp-1">{review.author_name}</span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 fill-blue-50" />
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">Verified</span>
                              </div>
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              {renderStars(review.rating)}
                              <span className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">{review.relative_time_description}</span>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <p className="text-base sm:text-lg lg:text-2xl text-gray-700 leading-relaxed font-medium italic">
                            "{displayText}"
                          </p>

                          {/* View More/Less Button */}
                          {review.text.length > 200 && (
                            <div className="mt-3 sm:mt-4 flex justify-center">
                              <button
                                onClick={() => toggleReviewExpansion(index)}
                                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200 group"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <span className="font-medium"></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GoogleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm text-gray-500">Google Review</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Navigation - Always visible - positioned relative to card content only */}
            {displayReviews.length > 1 && (
              <div className="hidden lg:block">
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm text-gray-800 p-3 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all duration-300 z-20 hover:scale-110"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm text-gray-800 p-3 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all duration-300 z-20 hover:scale-110"
                  aria-label="Next review"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Desktop Swipe Indicator - outside the card container */}
          <div className="hidden lg:flex justify-center mt-6">
            <div className="flex gap-2">
              {displayReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300'}`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Premium CTA Section */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://g.page/r/CXExFUgTbNenEBE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Share Your Experience
          </a>
          
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${placeDetails?.place_id || 'ChIJARxtruMIrTsRcTEVSBNs16c'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all font-bold shadow-md hover:shadow-lg hover:scale-105"
          >
            <GoogleIcon className="w-5 h-5" />
            Read All Reviews
          </a>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;