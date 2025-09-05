import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FaFacebook, FaX } from "react-icons/fa6";
import logo from '../assets/fici_128x128.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[color:var(--color-dark1)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Company Info */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="FICI Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              <span className="text-xl sm:text-2xl font-bold">FICI</span>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Premium leather footwear crafted with passion and precision. Discover the perfect blend
              of style, comfort, and quality.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/FICI-Shoes"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-[color:var(--color-dark2)] transition-colors"
              >
                <FaFacebook className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </a>
              <a
                href="https://x.com/ficiShoes"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-[color:var(--color-dark2)] transition-colors"
              >
                <FaX className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </a>
              <a
                href="https://www.instagram.com/FICI_Shoes"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-[color:var(--color-dark2)] transition-colors"
              >
                <FaInstagram className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </a>
              <a
                href="https://wa.me/918122003006"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-[color:var(--color-dark2)] transition-colors"
              >
                <FaWhatsapp className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link to="/" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Products</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold">Categories</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link to="/products?sub_category=Shoes" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Shoes</Link></li>
              <li><Link to="/products?sub_category=Sandals" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Sandals</Link></li>
              <li><Link to="/products?sub_category=Chappals" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Chappals</Link></li>
              <li><Link to="/products?gender=men" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Men's Collection</Link></li>
              <li><Link to="/products?gender=women" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">Women's Collection</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold">Contact Info</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <a
                  href="https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6?g_st=awb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors leading-relaxed"
                >No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane,   Ambur - 635802 Tirupattur District Tamilnadu, India.
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href="tel:+918122003006" className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors">
                  +91 81220 03006
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href="mailto:nmfinternational@gmail.com" className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors">
                  info@fici.com
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm sm:text-base text-center sm:text-left">
            © {currentYear} FICI. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-sm sm:text-base">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;