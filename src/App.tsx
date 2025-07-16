import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@features/home/HomePage';
import ContactPage from '@features/contact/ContactPage';
import Header from 'component/Header';
import Footer from 'component/Footer';

const App: React.FC = () => {
  return (
    <>
    <Header/>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
    <Footer/>
    </>
  );
};

export default App;