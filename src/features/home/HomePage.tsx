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
// import WhyChooseUs from '../../components/home/WhyChooseUs';
// import Testimonials from '../../components/home/Testimonials';

const HomePage: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="FICI Shoes - Premium Leather Footwear | Handcrafted Quality"
        description="Discover premium leather shoes, sandals, and accessories at FICI Shoes. Handcrafted quality with modern style. Free shipping on orders above ₹999."
        keywords="fici shoes, leather footwear, premium shoes, handcrafted shoes, men shoes, women shoes, sandals, boots"
        url="https://ficishoes.com"
      />
      <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section - Premium first impression */}
      <Hero />
      
      {/* Trust Strip - Build credibility */}
      <div className="mt-4">
        <TrustStrip />
      </div>
      
      {/* Top Categories - Easy navigation */}
      <section className="bg-gray-50 dark:bg-gray-900 -mt-6">
        <CategoryGrid />
      </section>
      
      {/* Best Sellers - Social proof */}
      <div className="-mt-24">
        <BestSellers />
      </div>
      
      {/* New Arrivals - Fresh content */}
      <div className="-mt-24">
        <NewArrivals />
      </div>
      
      {/* Why Choose Us - Value proposition */}
      {/* <WhyChooseUs /> */}
      
      {/* Testimonials - Customer validation */}
      {/* <Testimonials /> */}
      
    </main>
    </>
  );
};

export default HomePage;