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
      <div className="w-full space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Popular Categories */}
        <section className="pt-4 sm:pt-6 md:pt-8 pb-2 sm:pb-4">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
            <PopularCategoriesSection />
          </div>
        </section>
        
        {/* Highlight Section with enhanced visual separation */}
        <section className="py-4 sm:py-6 md:py-8 bg-gradient-to-br from-white/50 via-white/30 to-transparent dark:from-black/30 dark:via-black/20 dark:to-transparent backdrop-blur-sm border-y border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
            <HighlightSection />
          </div>
        </section>
        
        {/* Top Deals */}
        <section className="py-4 sm:py-6 md:py-8 pb-6 sm:pb-8 md:pb-10">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
            <TopDealsSection />
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;