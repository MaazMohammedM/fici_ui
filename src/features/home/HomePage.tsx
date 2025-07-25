import React from 'react';
import HeroSection from './components/HeroSection';
import PopularCategories from './components/PopularCategories';

const HomePage: React.FC = () => {
  return (
    <main className=''>
      <HeroSection />
      <PopularCategories />      
    </main>
  );
};

export default HomePage;