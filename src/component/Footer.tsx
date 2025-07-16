import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-light dark:bg-gradient-dark font-primary text-primary dark:text-secondary px-16 py-8">
        <div className="flex items-center justify-between">
          
          <div>
            <p className="text-sm text-primary dark:text-secondary">© 2025 FICI Shoes. All rights reserved.</p>
          </div>

          <div className="flex flex-row lg:flex-col items-center justify-center space-x-4 lg:space-x-0 lg:space-y-2">
            <Link to="/about">
              <span className="text-sm hover:text-accent cursor-pointer text-primary dark:text-secondary">About</span>
            </Link>
            <Link to="/contact">
              <span className="text-sm hover:text-accent cursor-pointer text-primary dark:text-secondary">Contact</span>
            </Link>
            <Link to="/terms">
              <span className="text-sm hover:text-accent cursor-pointer text-primary dark:text-secondary">Terms of Service</span>
            </Link>
          </div>


          <div className="flex justify-center gap-6 sm:justify-end">
            <a
              href="https://www.facebook.com/FICI-Shoes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-primary dark:text-secondary hover:text-accent"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f" />
            </a>
            <a
              href="https://www.instagram.com/FICI_Shoes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-primary dark:text-secondary hover:text-accent"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram" />
            </a>
            <a
              href="https://wa.me/918122003006"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-primary dark:text-secondary hover:text-accent"
              aria-label="WhatsApp"
            >
              <i className="fab fa-whatsapp" />
            </a>
          </div>

        </div>
    </footer>
  );
};

export default Footer;
