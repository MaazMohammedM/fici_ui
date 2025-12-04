import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">FICI</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-500 hover:text-gray-900">Home</a>
            <a href="/products" className="text-gray-500 hover:text-gray-900">Products</a>
            <a href="/contact" className="text-gray-500 hover:text-gray-900">Contact</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
