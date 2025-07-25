import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@features/home/HomePage';
import ContactPage from '@features/contact/ContactPage';
import Header from 'component/Header';
import Footer from 'component/Footer';
import CartPage from '@features/cart/CartPage';

const App: React.FC = () => {
  return (
    <>
    <Header/>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/cartpage" element={<CartPage />} />
      <Route path="*" element={<div className='text-primary dark:text-secondary text-center text-2xl font-bold w-full h-[calc(100svh-8rem)] flex items-center justify-center bg-gradient-light dark:bg-gradient-dark'>404 Not Found</div>} />
    </Routes>
    <Footer/>
    </>
  );
};

export default App;