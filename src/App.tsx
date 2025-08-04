import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@features/home/HomePage';
import ContactPage from '@features/contact/ContactPage';
import Header from 'component/Header';
import Footer from 'component/Footer';
import CartPage from '@features/cart/CartPage';
import AboutPage from '@features/about/AboutPage';
import SignIn from 'auth/SignIn'; 
import Register from 'auth/Register';
import AdminPage from '@features/admin/AdminPanel';
import AuthCallback from '@auth/AuthCallback';
import ProductPage from '@features/product/ProductPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-light dark:bg-gradient-dark">
      <Header />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cartpage" element={<CartPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback /> }/>
          <Route path="/admin" element={<AdminPage/>} />
          <Route path="/products" element={<ProductPage/>} />
          <Route path="*" element={<div className='text-primary dark:text-secondary text-center text-2xl font-bold w-full h-[calc(100svh-8rem)] flex items-center justify-center bg-gradient-light dark:bg-gradient-dark'>404 Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;