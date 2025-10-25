import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Heart, ShoppingCart, UserRound, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '@store/cartStore';
import { useWishlistCount } from '@store/wishlistStore';
import ficiLogo from '../assets/fici_transparent.png'

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAuthenticationType, signOut, role, user } = useAuthStore();
  const { mode, toggleMode, initializeTheme } = useThemeStore();
  const { getCartCount } = useCartStore();
  const wishlistCount = useWishlistCount();
  const cartCount = getCartCount();

  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);

  // Navigation warning state
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  // Delay close to avoid flicker when moving cursor from button to panel
  const hoverTimeoutRef = useRef<number | null>(null);

  // Check if user is on checkout page with unsaved changes
  const isOnCheckoutWithChanges = location.pathname === '/checkout' && cartCount > 0;

  // Handle protected navigation
  const handleProtectedNavigation = (path: string, e?: React.MouseEvent) => {
    if (isOnCheckoutWithChanges) {
      e?.preventDefault();
      setPendingNavigation(path);
      setShowNavigationWarning(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    setShowNavigationWarning(false);
  };

  const cancelNavigation = () => {
    setPendingNavigation(null);
    setShowNavigationWarning(false);
  };

  const openDropdown = (label: string) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setActiveDropdown(label);
  };

  const closeDropdownWithDelay = (delay = 200) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, delay);
  };

  useEffect(() => { initializeTheme(); }, [initializeTheme]);

  const isAuthenticated = getAuthenticationType() === 'user';
  const isGuest = getAuthenticationType() === 'guest';

  const navItems = [
    { label: 'Home', path: '/' },
    {
      label: 'Men',
      dropdown: [
        { label: "All Men's Footwear", path: '/products?gender=men' },
        { label: 'Shoes', path: '/products?gender=men&sub_category=Shoes' },
        { label: 'Sandals', path: '/products?gender=men&sub_category=Sandals' },
        { label: 'Bags', path: '/products?gender=men&sub_category=Bags' },
        { label: 'Accessories', path: '/products?gender=men&sub_category=Accessories' },
      ],
    },
    {
      label: 'Women',
      dropdown: [
        { label: "All Women's Footwear", path: '/products?gender=women' },
        { label: 'Shoes', path: '/products?gender=women&sub_category=Shoes' },
        { label: 'Sandals', path: '/products?gender=women&sub_category=Sandals' },
        { label: 'Bags', path: '/products?gender=women&sub_category=Bags' },
        { label: 'Accessories', path: '/products?gender=women&sub_category=Accessories' },
      ],
    },
    { label: 'Shoe Care', path: '/shoe-care' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    ...(isAuthenticated || isGuest ? [ { label: 'Orders', path: '/orders' }] : []),
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleProtectedNavigation(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearch(false);
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) setUserDropdown(false);
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(e.target as Node)) setActiveDropdown(null);
      if (isMobileMenu && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) setIsMobileMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setUserDropdown(false); setActiveDropdown(null); setIsMobileMenu(false); setIsSearch(false); }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [isMobileMenu]);

  const displayName = useAuthStore.getState().firstName || user?.user_metadata?.first_name || 'Account';

  return (
    <header className="bg-white dark:bg-gray-900 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 md:px-8 lg:px-16 py-3 sm:py-4">
        {/* Mobile left */}
        <button onClick={() => setIsMobileMenu(!isMobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={isMobileMenu ? 'Close menu' : 'Open menu'}>
          {isMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <NavLink
          to="/"
          onClick={(e) => handleProtectedNavigation('/', e)}
          className="flex items-center h-12"
        >
          <img
            src={ficiLogo}
            alt="FICI Logo"
            className="h-full w-auto"
          />
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-1 lg:gap-2 xl:gap-4 items-center text-sm md:text-[13px] lg:text-sm" ref={desktopDropdownRef}>
          {navItems.map(({ label, path, dropdown }) => (
            <div
              key={label}
              className="relative"
              onMouseEnter={() => dropdown ? openDropdown(label) : undefined}
              onMouseLeave={() => dropdown ? closeDropdownWithDelay(180) : undefined}
            >
              {dropdown ? (
                <>
                  <button
                    onMouseEnter={() => openDropdown(label)}
                    className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:text-blue-600 transition-colors whitespace-nowrap"
                    aria-expanded={activeDropdown === label}
                  >
                    {label} <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {activeDropdown === label && (
                    <div
                      className="absolute left-0 mt-1 pt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1.5 z-50 text-sm"
                      onMouseEnter={() => openDropdown(label)}
                      onMouseLeave={() => closeDropdownWithDelay(180)}
                    >
                      {dropdown.map(d => (
                        <NavLink 
                          key={d.path} 
                          to={d.path} 
                          onClick={(e) => handleProtectedNavigation(d.path, e)}
                          className="block px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {d.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink 
                  to={path!} 
                  onClick={(e) => handleProtectedNavigation(path!, e)}
                  className="px-2 py-1.5 hover:text-blue-600 transition-colors whitespace-nowrap"
                  onMouseEnter={() => activeDropdown && setActiveDropdown(null)}
                >
                  {label}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
          <button onClick={() => setIsSearch(!isSearch)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Open search">
            <Search className="w-5 h-5" />
          </button>

          <NavLink
            to="/wishlist"
            onClick={(e) => handleProtectedNavigation('/wishlist', e)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/cart"
            onClick={(e) => handleProtectedNavigation('/cart', e)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>

          <div ref={userDropdownRef} className="relative">
            {isAuthenticated ? (
              <>
                <button onClick={() => setUserDropdown(!userDropdown)} className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-haspopup="true" aria-expanded={userDropdown}>
                  <UserRound className="w-5 h-5" /> <span className="hidden sm:inline">{displayName}</span> <ChevronDown className="w-4 h-4" />
                </button>
                {userDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2">
                    <button onClick={() => { handleProtectedNavigation('/profile'); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</button>
                    <button onClick={() => { handleProtectedNavigation('/orders'); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">My Orders</button>
                    {((role?.toLowerCase() === 'admin') || (user?.user_metadata?.role?.toLowerCase() === 'admin')) && (
                      <button
                        onClick={() => {
                          handleProtectedNavigation('/admin');
                          setUserDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <button onClick={() => { signOut(); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">Sign Out</button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => handleProtectedNavigation('/auth/signin')} className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <UserRound className="w-5 h-5" /> <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>

          <button onClick={toggleMode} className="rounded-full bg-blue-600 dark:bg-yellow-500 p-2" aria-label="Toggle theme">
            {mode === 'light' ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {isSearch && (
        <form onSubmit={handleSearch} className="px-4 md:px-8 lg:px-16 py-4 flex items-center gap-3 bg-white dark:bg-gray-900 border-b">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..." className="flex-1 border rounded-lg px-3 py-2" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Search</button>
          <button type="button" onClick={() => setIsSearch(false)}><X className="w-5 h-5" /></button>
        </form>
      )}

      {/* Mobile menu */}
      {isMobileMenu && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenu(false)}>
          <div ref={mobileMenuRef} className="absolute top-0 left-0 w-72 h-full bg-white dark:bg-gray-900 p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            {navItems.map(({ label, path, dropdown }) => (
              <div key={label} className="mb-2">
                {dropdown ? (
                  <>
                    <button onClick={() => setMobileDropdown(mobileDropdown === label ? null : label)} className="flex justify-between w-full">
                      {label}<ChevronDown className={`w-4 h-4 ${mobileDropdown === label ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileDropdown === label && dropdown.map(d => (
                      <NavLink
                        key={d.path}
                        to={d.path}
                        onClick={(e) => {
                          handleProtectedNavigation(d.path, e);
                          setIsMobileMenu(false);
                        }}
                        className="block pl-6 py-2"
                      >
                        {d.label}
                      </NavLink>
                    ))}
                  </>
                ) : (
                  <NavLink
                    to={path!}
                    onClick={(e) => {
                      handleProtectedNavigation(path!, e);
                      setIsMobileMenu(false);
                    }}
                    className="block py-2"
                  >
                    {label}
                  </NavLink>
                )}
              </div>
            ))}
            {isAuthenticated && (
              <div className="mt-6">
                <button onClick={signOut} className="w-full bg-blue-600 text-white py-2 rounded-lg">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-orange-500 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Warning</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                You have items in your cart and haven't completed your order. Are you sure you want to leave? Your progress will be lost.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 dark:bg-gray-700">
              <button
                onClick={cancelNavigation}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
              >
                Stay Here
              </button>
              <button
                onClick={confirmNavigation}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              >
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;