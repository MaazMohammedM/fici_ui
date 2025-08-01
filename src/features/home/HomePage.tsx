import React from 'react';
import HeroSection from './components/HeroSection';
import PopularCategories from './components/PopularCategories';
import TopDealsSection from './components/TopDealsSection';

const HomePage: React.FC = () => {
  return (
    <main className=''>
      <HeroSection />
      <PopularCategories />      
     <TopDealsSection/>
    </main>
  );
};

export default HomePage;