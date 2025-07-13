import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          {/* Copyright */}
          <div className="text-center sm:text-left">
            <p className="text-sm">© 2025 FICI Shoes. All rights reserved.</p>
          </div>

          {/* Navigation Links */}
          <div className="flex lg:flex-col sm:flex-row sm:space-x-4 sm:justify-center sm:items-center items-center sm:space-y-0 space-y-4 w-full justify-center">
            <Link to="/about">
              <span className="mx-2 text-sm hover:text-purple-500 leading-none cursor-pointer">About</span>
            </Link>
            <Link to="/contact">
              <span className="mx-2 text-sm hover:text-purple-500 leading-none cursor-pointer">Contact</span>
            </Link>
            <Link to="/terms">
              <span className="mx-2 text-sm hover:text-purple-500 leading-none cursor-pointer">Terms of Service</span>
            </Link>
          </div>

          {/* Social Media Icons */}
          <div className="flex sm:space-x-4 space-x-6 justify-center">
            <a
              href="https://www.facebook.com/FICI-Shoes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-white hover:text-blue-500"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f" />
            </a>
            <a
              href="https://www.instagram.com/FICI_Shoes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-white hover:text-purple-500"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram" />
            </a>
            <a
              href="https://wa.me/918122003006"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-white hover:text-green-500"
              aria-label="WhatsApp"
            >
              <i className="fab fa-whatsapp" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;