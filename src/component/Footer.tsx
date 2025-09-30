import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FaFacebook, FaX } from 'react-icons/fa6';
import logo from '../assets/fici_transparent.png';
import razorpayPayments from '../assets/razorpay-with-all-cards-upi-seeklogo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[color:var(--color-dark1)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Brand + Tagline */}
        <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2 mb-3 sm:mb-5">
          <div className="bg-white rounded-full p-2 shadow-sm">
            <img src={logo} alt="FICI Logo" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
          </div>
          <p className="text-gray-300 text-sm sm:text-[15px] leading-snug max-w-lg">
            Premium leather footwear crafted with passion and precision. Discover the perfect blend
            of style, comfort, and quality.
          </p>

          {/* Social */}
          <div className="flex items-center gap-2.5 sm:gap-3 mt-1">
            <a
              href="https://www.facebook.com/FICI-Shoes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <FaFacebook className="w-5 h-5 text-gray-300" />
            </a>
            <a
              href="https://x.com/ficiShoes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <FaX className="w-5 h-5 text-gray-300" />
            </a>
            <a
              href="https://www.instagram.com/FICI_Shoes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <FaInstagram className="w-5 h-5 text-gray-300" />
            </a>
            <a
              href="https://wa.me/918122003006"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <FaWhatsapp className="w-5 h-5 text-gray-300" />
            </a>
          </div>
        </div>

        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 lg:gap-8">
          {/* Quick Links */}
          <div className="order-1">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="order-2">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products?sub_category=Shoes"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Shoes
                </Link>
              </li>
              <li>
                <Link
                  to="/products?sub_category=Sandals"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Sandals
                </Link>
              </li>
              <li>
                <Link
                  to="/products?sub_category=Chappals"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Chappals
                </Link>
              </li>
              <li>
                <Link
                  to="/products?gender=men"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Men's Collection
                </Link>
              </li>
              <li>
                <Link
                  to="/products?gender=women"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Women's Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="order-3 col-span-2 md:col-span-1">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">Contact Info</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <a
                  href="https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6?g_st=awb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors leading-relaxed"
                >
                  No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802 Tirupattur District Tamilnadu, India.
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href="tel:+918122003006" className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors">
                  +91 81220 03006
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a
                  href="mailto:nmfinternational@gmail.com"
                  className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors"
                >
                  info@fici.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Row */}
        <div className="mt-3 sm:mt-5">
          <hr className="border-white/10 mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <h4 className="text-sm sm:text-base text-gray-300">We accept the following payment methods</h4>
            <div className="flex items-center justify-start sm:justify-end">
              <div className="bg-white rounded-md p-2 border border-white/20 shadow-sm">
                <img
                  src={razorpayPayments}
                  alt="Payment methods: Cards, UPI and Razorpay"
                  className="h-8 sm:h-10 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-6 sm:mt-8 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">© {currentYear} FICI. All rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/shipping" className="text-gray-400 hover:text-white transition-colors">
              Shipping Info
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;