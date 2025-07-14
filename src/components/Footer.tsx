import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 mt-8">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 sm:flex sm:justify-between sm:items-center text-center sm:text-left">
          
          <div>
            <p className="text-sm">© 2025 FICI Shoes. All rights reserved.</p>
          </div>

          <div className="flex flex-row lg:flex-col items-center justify-center space-x-4 lg:space-x-0 lg:space-y-2">
            <Link to="/about">
              <span className="text-sm hover:text-purple-500 cursor-pointer">About</span>
            </Link>
            <Link to="/contact">
              <span className="text-sm hover:text-purple-500 cursor-pointer">Contact</span>
            </Link>
            <Link to="/terms">
              <span className="text-sm hover:text-purple-500 cursor-pointer">Terms of Service</span>
            </Link>
          </div>


          <div className="flex justify-center gap-6 sm:justify-end">
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
