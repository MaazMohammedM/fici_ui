import React from 'react';
import HeroSection from './components/HeroSection';
import TopDealsSection from './components/TopDealsSection';
import PopularCategoriesSection from './components/PopularCategoriesSection';
import HighlightSection from './components/HighlightSection';

const HomePage: React.FC = () => {
  return (
    <div className="flex-1 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      {/* Full-bleed hero: break out of any centered container and span the viewport */}
        <HeroSection />
      <PopularCategoriesSection />
      <HighlightSection />
      <TopDealsSection />
    </div>
  );
};

export default HomePage;