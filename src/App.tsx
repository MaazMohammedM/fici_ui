import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@features/home/HomePage';
import ContactPage from '@features/contact/ContactPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/contact" element={<ContactPage />} />
      {/* Add a catch-all route to handle unmatched URLs (optional) */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default App;