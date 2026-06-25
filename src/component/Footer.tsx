import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '../assets/fici_transparent.webp';
import razorpayPayments from '../assets/razorpay-with-all-cards-upi-seeklogo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#11224C] text-white">
      {/* Full-bleed white logo strip (all breakpoints) */}
      <div className="w-full bg-white py-3 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <img src={logo} alt="FICI Logo - Premium leather shoe manufacturer in Ambur" className="h-14 sm:h-20 w-auto object-contain" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Brand + Tagline */}
        <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2 mb-3 sm:mb-5">
          <p className="text-gray-300 text-sm sm:text-[15px] leading-snug max-w-lg">
            Premium leather footwear crafted with passion and precision.<br/> Discover the perfect blend
            of style, comfort and quality.
          </p>

          {/* Social */}
          <div className="flex items-center gap-2.5 sm:gap-3 mt-1">
            <a
              href="https://www.facebook.com/FICI-Shoes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon
                icon={["fab", "facebook"]}
                className="w-4 h-4"
                style={{ color: "#1877F2" }}
              />
            </a>
            <a
              href="https://x.com/ficiShoes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon
                icon={["fab", "x-twitter"]}
                className="w-4 h-4"
                style={{ color: "#000000" }}
              />
            </a>
            <a
              href="https://www.instagram.com/FICI_Shoes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon
                icon={["fab", "instagram"]}
                className="w-4 h-4"
                style={{ color: "#E1306C" }}
              />
            </a>
            <a
              href="https://wa.me/918122003006"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon
                icon={["fab", "whatsapp"]}
                className="w-4 h-4"
                style={{ color: "#25D366" }}
              />
            </a>
            <a
              href="https://www.linkedin.com/company/fici-shoes/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <div className="w-5 h-5 flex items-center justify-center bg-blue-600 rounded-full">
                <span className="text-white font-bold text-xs">in</span>
              </div>
            </a>
          </div>
        </div>

        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 lg:gap-8">
          {/* Quick Links */}
          <div className="order-1">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Our Ambur Heritage
                </Link>
              </li>
              <li>
                <Link to="/ambur-leather-excellence" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Ambur Leather Excellence
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  Contact Leather Manufacturers
                </Link>
              </li>
              <li>
                {/* <Link to="/faq" className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors">
                  FAQ
                </Link> */}
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="order-2">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">Leather Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products?sub_category=Shoes"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Premium Leather Shoes
                </Link>
              </li>
              <li>
                <Link
                  to="/products?sub_category=Sandals"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Handcrafted Leather Sandals
                </Link>
              </li>
              <li>
                <Link
                  to="/products?sub_category=Bags&sub_category=Accessories"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Leather Bags & Accessories
                </Link>
              </li>
              <li>
                <Link
                  to="/products?gender=men"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Men's Leather Collection
                </Link>
              </li>
              <li>
                <Link
                  to="/products?gender=women"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Women's Leather Collection
                </Link>
              </li>
              <li>
                <Link
                  to="/ambur-leather-excellence"
                  className="text-gray-300 hover:text-white text-sm sm:text-base transition-colors"
                >
                  Manufacturing Process
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info - Moved to 3rd column on desktop */}
          <div className="order-4 md:order-2 col-span-2 md:col-span-1">
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
                  No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802 Tirupattur District, Tamilnadu, India.
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
                  href="mailto:support@ficishoes.com"
                  className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors"
                >
                  support@ficishoes.com
                </a>
              </div>
            </div>
          </div>

          {/* Mobile-only: Razorpay payments strip above Contact Info */}
          <div className="order-3 col-span-2 md:hidden mt-2 mb-2">
            <div className="-mx-4 w-[calc(100%+2rem)] bg-white py-4 px-3 shadow-sm flex items-center justify-center">
              <img
                src={razorpayPayments}
                alt="Payment processing partner Razorpay – Cards, Wallets, UPI & Netbanking"
                className="h-14 w-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>

        </div>

        {/* Payments Row (desktop/tablet only) */}
        <div className="mt-3 sm:mt-5 hidden md:block">
          <hr className="border-white/10 mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <h4 className="text-base sm:text-lg text-gray-200 font-medium whitespace-nowrap">We accept the following payment methods</h4>
            <div className="flex items-center">
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-white/20 shadow-lg">
                <img
                  src={razorpayPayments}
                  alt="Payment methods: Cards, UPI and Razorpay"
                  className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-6 sm:mt-8 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <p className="text-gray-400 text-xs sm:text-sm"> {currentYear} FICI. All rights reserved.</p>
            <span className="text-gray-400 text-xs sm:text-sm hidden sm:inline">|</span>
            <p className="text-gray-400 text-xs sm:text-sm">FiCi Shoes is a brand of NMF International, Ambur.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;