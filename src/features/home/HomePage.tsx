import React from 'react';
import HeroSection from './components/HeroSection';
import TopDealsSection from './components/TopDealsSection';
import PopularCategoriesSection from './components/PopularCategoriesSection';
import HighlightSection from './components/HighlightSection';

const HomePage: React.FC = () => {
  return (
    <div className="flex-1 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      {/* Full-bleed hero: break out of any centered container and span the viewport */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <HeroSection />
      </div>
      <PopularCategoriesSection />
      <HighlightSection />
      <TopDealsSection />
    </div>
  );
};

export default HomePage;