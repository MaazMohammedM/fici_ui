import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowRight, Home, ShoppingBag } from 'lucide-react';
import SEOHead from '@lib/components/SEOHead';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics tracking for 404 page views
  useEffect(() => {
    const track404PageView = () => {
      try {
        // Track 404 page view event
        const eventProperties = {
          path: location.pathname,
          full_url: window.location.href,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        };

        // Use existing analytics if available
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', '404_page_view', eventProperties);
        }

        // Log to console for debugging (can be removed in production)
        console.log('404 Page View Tracked:', eventProperties);
      } catch (error) {
        console.error('Error tracking 404 page view:', error);
      }
    };

    track404PageView();
  }, [location.pathname, location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const featuredLinks = [
    { label: "Men's Collection", path: '/products?gender=men' },
    { label: "Women's Collection", path: '/products?gender=women' },
    { label: 'Shoe Care', path: '/shoe-care' },
    { label: 'Contact Us', path: '/contact' }
  ];

  const quickShopLinks = [
    { label: "Shop Men's Footwear", path: '/products?gender=men&category=Footwear' },
    { label: "Shop Women's Footwear", path: '/products?gender=women&category=Footwear' },
    { label: 'Shop Sandals', path: '/products?sub_category=Sandals' },
    { label: 'Shop Bags & Accessories', path: '/products?sub_category=Bags' }
  ];

  return (
    <>
      <SEOHead
        title="404 - Page Not Found | FiCi Shoes"
        description="The page you are looking for could not be found. Explore premium footwear and accessories from FiCi Shoes."
        noIndex={true}
      />
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-light dark:bg-gradient-dark px-4 py-12 sm:py-16 md:py-20">
        <div className="w-full max-w-4xl mx-auto">
          {/* 404 Number */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-8xl sm:text-9xl md:text-[12rem] font-bold text-gray-200 dark:text-gray-800 leading-none">
              404
            </h1>
          </div>

          {/* Main Content */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Page Not Found
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed px-4">
              The page you're looking for may have been moved, renamed, or no longer exists.
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-xl mx-auto mb-12 sm:mb-16 px-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for shoes, sandals, bags..."
                className="w-full px-5 py-4 pr-12 text-base sm:text-lg rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                aria-label="Search for products"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Submit search"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16 px-4">
            <button
              onClick={() => navigate('/products')}
              className="w-full sm:w-auto px-8 py-4 bg-[#11224C] hover:bg-[#0D1A3A] text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-base sm:text-lg"
              aria-label="Continue shopping"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-base sm:text-lg"
              aria-label="Go to home page"
            >
              <Home className="w-5 h-5" />
              Go Home
            </button>
          </div>

          {/* Featured Links */}
          <div className="max-w-3xl mx-auto mb-12 sm:mb-16 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {featuredLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
                  aria-label={`Navigate to ${link.label}`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Shop Links */}
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="text-center text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Quick Shop
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickShopLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
                  aria-label={`Navigate to ${link.label}`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
