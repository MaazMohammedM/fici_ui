// ==========================================
// HOMEPAGE - Premium Redesign
// ==========================================

import React from 'react';
import Hero from '../../components/home/Hero';
import TrustStrip from '../../components/home/TrustStrip';
import CategoryGrid from '../../components/home/CategoryGrid';
import BestSellers from '../../components/home/BestSellers';
import NewArrivals from '../../components/home/NewArrivals';
// import WhyChooseUs from '../../components/home/WhyChooseUs';
// import Testimonials from '../../components/home/Testimonials';

const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section - Premium first impression */}
      <Hero />
      
      {/* Trust Strip - Build credibility */}
      <TrustStrip />
      
      {/* Top Categories - Easy navigation */}
      <CategoryGrid />
      
      {/* Best Sellers - Social proof */}
      <BestSellers />
      
      {/* New Arrivals - Fresh content */}
      <NewArrivals />
      
      {/* Why Choose Us - Value proposition */}
      {/* <WhyChooseUs /> */}
      
      {/* Testimonials - Customer validation */}
      {/* <Testimonials /> */}
      
    </main>
  );
};

export default HomePage;