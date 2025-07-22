import React from 'react';
import HeroSection from './components/HeroSection';
import PopularCategories from './components/PopularCategories';
import CartPage from '@features/cart/CartPage';

const HomePage: React.FC = () => {
  return (
    <main className=''>
      <HeroSection />
      <PopularCategories />
      <CartPage/>
      
    </main>
  );
};

export default HomePage;