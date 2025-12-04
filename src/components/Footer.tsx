import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">FICI</h3>
            <p className="text-gray-600 text-sm">
              Your trusted partner for quality products and services.
            </p>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/" className="hover:text-gray-900">Home</a></li>
              <li><a href="/products" className="hover:text-gray-900">Products</a></li>
              <li><a href="/contact" className="hover:text-gray-900">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Contact Info</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Email: info@fici.com</li>
              <li>Phone: +1 234 567 890</li>
              <li>Address: 123 Street, City, Country</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © 2024 FICI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
