// ==========================================
// HOMEPAGE - Premium Redesign
// ==========================================

import React from 'react';
import SEOHead from '@lib/components/SEOHead';
import Hero from '../../components/home/Hero';
import TrustStrip from '../../components/home/TrustStrip';
import CategoryGrid from '../../components/home/CategoryGrid';
import BestSellers from '../../components/home/BestSellers';
import NewArrivals from '../../components/home/NewArrivals';
import GoogleReviews from '../../components/GoogleReviews';
// import WhyChooseUs from '../../components/home/WhyChooseUs';
// import Testimonials from '../../components/home/Testimonials';

const HomePage: React.FC = () => {

  return (
    <>
      <SEOHead 
        title="Home - FICI Shoes | Premium Leather Footwear | Handcrafted Quality"
        description="Discover premium leather shoes, sandals, and accessories at FICI Shoes. Handcrafted quality with modern style. Free shipping on orders above ₹999."
        keywords="fici shoes, leather footwear, premium shoes, handcrafted shoes, men shoes, women shoes, sandals, boots"
        url="https://ficishoes.com"
      />
      
      <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section - Premium first impression */}
      <Hero />
            <h1 className="text-2xl md:text-2xl font-bold text-center text-gray-900 dark:text-white py-8 px-4">
        Handcrafted Leather Formal Shoes – FiCi Shoes by NMF International
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 px-4 max-w-3xl mx-auto mb-8">
        Discover premium handcrafted leather footwear from Ambur, India. Our collection features formal shoes, casual sneakers, sandals, and accessories made with genuine leather and expert craftsmanship. Perfect for office wear, special occasions, and everyday style.
      </p>
      <div className="text-center mb-8">
        <a href="/products" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 mr-4">
          Shop All Products
        </a>
        <a href="/about" className="inline-block border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3 px-8 rounded-lg transition duration-300">
          Learn More About Us
        </a>
      </div>
      {/* Trust Strip - Build credibility */}
      <div className="mt-4">
        <TrustStrip />
      </div>
      
      {/* Top Categories - Easy navigation */}
      <section className="bg-gray-50 dark:bg-gray-900 -mt-6">
        <CategoryGrid />
      </section>

         {/* New Arrivals - Fresh content */}
      <div className="-mt-24">
        <NewArrivals />
      </div>
      
      {/* Best Sellers - Social proof */}
      <div className="-mt-24">
        <BestSellers />
      </div>
      
      {/* Why Choose Us - Value proposition */}
      {/* <WhyChooseUs /> */}
      
      {/* Testimonials - Customer validation */}
      {/* <Testimonials /> */}
      
      {/* Google Reviews - Social proof */}
      <GoogleReviews />
      
    </main>
    </>
  );
};

export default HomePage;