import { Moon, Search, ShoppingCart, Sun, UserRound, Menu, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import logo from '../assets/fici_128x128.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, signOut, firstName } = useAuthStore();
  const { mode, toggleMode, initializeTheme } = useThemeStore();
  const { getCartCount } = useCartStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Orders', path: '/orders' },
    ...(role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : [])
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleProfileClick = () => {
    if (!user) navigate('/auth/signin');
  };

  const displayName = firstName || user?.user_metadata?.first_name || user?.email;
  const cartCount = getCartCount();

  return (
    <header className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] w-full sticky top-0 z-50 border-b border-[color:var(--color-light2)] dark:border-[color:var(--color-dark2)]">
      <div className="py-3 sm:py-4 mx-auto flex items-center justify-between px-4 md:px-8 lg:px-16">
        {/* Mobile Left Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-6 h-6" />
            ) : (
              <Menu className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-6 h-6" />
            )}
          </button>
        </div>

        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <NavLink to="/" className="flex items-center">
            <img
              src={logo}
              alt="FICI Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
          </NavLink>
        </div>

        {/* Mobile Right Icons (Cart + SignIn) */}
        <div className="md:hidden flex items-center gap-3">
          <NavLink to="/cartpage" className="relative p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors">
            <ShoppingCart className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[color:var(--color-accent)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>
          <div 
            className="cursor-pointer p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors" 
            onClick={handleProfileClick}
          >
            <UserRound className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
          </div>
          <button
            onClick={toggleMode}
            className="rounded-full bg-[color:var(--color-primary)] dark:bg-[color:var(--color-secondary)] p-2 hover:bg-[color:var(--color-primary-active)] dark:hover:bg-[color:var(--color-secondary-active)] transition-colors"
          >
            {mode === 'light' ? (
              <Sun className="text-white w-4 h-4" />
            ) : (
              <Moon className="text-white w-4 h-4" />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 lg:gap-8">
          {navLinks.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-lg ${
                  isActive
                    ? 'text-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10'
                    : 'text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <button className="p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors">
            <Search className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5 hover:text-[color:var(--color-accent)]" />
          </button>
          
          <NavLink to="/cartpage" className="relative p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors">
            <ShoppingCart className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5 hover:text-[color:var(--color-accent)]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[color:var(--color-accent)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>
          
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors" 
              onClick={handleProfileClick}
            >
              <UserRound className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
              {user ? (
                <>
                  <span className="text-sm text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] font-medium">
                    {displayName}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      signOut();
                    }} 
                    className="text-[color:var(--color-accent)] text-sm ml-2 hover:text-[color:var(--color-accent)]/80 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <span className="text-sm text-[color:var(--color-accent)] font-medium">Sign In</span>
              )}
            </div>
          </div>
          
          <button
            onClick={toggleMode}
            className="rounded-full bg-[color:var(--color-primary)] dark:bg-[color:var(--color-secondary)] p-2 hover:bg-[color:var(--color-primary-active)] dark:hover:bg-[color:var(--color-secondary-active)] transition-colors"
          >
            {mode === 'light' ? (
              <Sun className="text-white w-5 h-5" />
            ) : (
              <Moon className="text-white w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        >
          <div
            className="absolute top-0 left-0 w-80 h-full bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] shadow-xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)]">
                Menu
              </h3>
              <button 
                onClick={closeMobileMenu}
                className="p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors"
              >
                <X className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-6 h-6" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-2 mb-8">
              {navLinks.map(({ label, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `text-lg font-medium transition-colors px-4 py-3 rounded-lg ${
                      isActive
                        ? 'text-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10'
                        : 'text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/5'
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile User Info */}
            {user && (
              <div className="border-t border-[color:var(--color-light2)] dark:border-[color:var(--color-dark2)] pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <UserRound className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-6 h-6" />
                  <span className="text-lg font-medium text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)]">
                    {displayName}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="w-full bg-[color:var(--color-accent)] text-white py-3 rounded-lg font-medium hover:bg-[color:var(--color-accent)]/80 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;