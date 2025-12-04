// ==========================================
// HOMEPAGE - Optimized & Improved Version
// ==========================================

import React from 'react';
import HeroSection from './components/HeroSection';
import TopDealsSection from './components/TopDealsSection';
import PopularCategoriesSection from './components/PopularCategoriesSection';
import HighlightSection from './components/HighlightSection';
import InstructionSection from './components/InstructionSection';

const HomePage: React.FC = () => {
  return (
    //<main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-black dark:to-slate-900 transition-colors duration-300">
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-black dark:to-slate-900 transition-colors duration-300">
      <InstructionSection/>
      {/* Hero Section - Full bleed, no padding */}
      <HeroSection />
      
      {/* Content Sections Container */}
      <div className="w-full space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
        
        {/* Popular Categories */}
        <section className="pt-8 sm:pt-10 md:pt-12 lg:pt-16 pb-4 sm:pb-6 md:pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PopularCategoriesSection />
          </div>
        </section>
        
        {/* Highlight Section with enhanced visual separation */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-gradient-to-br from-white/50 via-white/30 to-transparent dark:from-black/30 dark:via-black/20 dark:to-transparent backdrop-blur-sm border-y border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HighlightSection />
          </div>
        </section>
        
        {/* Top Deals */}
        <section className="py-6 sm:py-8 md:py-10 lg:py-12 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <TopDealsSection />
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;