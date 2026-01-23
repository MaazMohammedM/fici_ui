import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistCount } from '../store/wishlistStore';
import {
  Search,
  Heart,
  ShoppingCart,
  UserRound,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import ficiLight from '../assets/fici_logo_light.png';
import ficiDark from '../assets/fici_logo_dark.png';

// Media query hook for responsive behavior
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches]);

  return matches;
};

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
  const hoverTimeoutRef = useRef<number | null>(null);

  const isOnCheckoutWithChanges = location.pathname === '/checkout' && cartCount > 0;

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

  useEffect(() => { 
    initializeTheme(); 
  }, [initializeTheme]);

  const isAuthenticated = getAuthenticationType() === 'user';
  const isGuest = getAuthenticationType() === 'guest';

  const navItems = [
    { label: 'Home', path: '/' },
    {
      label: 'Men',
      dropdown: [
        { label: "All Men's Footwear", path: '/products?gender=men&category=Footwear' },
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
    { label: 'Orders', path: '/orders' },
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
  const isMobile = useMediaQuery('(max-width: 1024px)');

  // Dedupe menu data
  const uniqueNavItems = useMemo(() => {
    const map = new Map();
    navItems.forEach(item => map.set(item.label, item));
    return Array.from(map.values());
  }, []);

  // Desktop Menu Component
  const DesktopMenu = () => (
    <nav className="flex items-center flex-1 justify-between px-1" ref={desktopDropdownRef}>
      {uniqueNavItems.map(({ label, path, dropdown }) => (
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
                className={`flex items-center justify-center gap-1 px-1 md:px-2 py-2 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:scale-105 whitespace-nowrap flex-1 ${
                  label === 'MEN' ? 'bg-blue-800 text-white border-b-2 border-blue-900 shadow-sm' : 
                  label === 'SALE' ? 'bg-red-600 text-white shadow-sm' : 
                  'bg-blue-900 text-white hover:bg-blue-800 shadow-sm'
                } font-JosefinSansBold`}
                aria-expanded={activeDropdown === label}
              >
                {label} <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              </button>
              {activeDropdown === label && (
                <div
                  className="absolute left-0 mt-2 pt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border dark:border-gray-700 py-4 z-50 animate-fade-in"
                  onMouseEnter={() => openDropdown(label)}
                  onMouseLeave={() => closeDropdownWithDelay(180)}
                >
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      {dropdown.map(d => (
                        <NavLink 
                          key={d.path}
                          to={d.path} 
                          onClick={(e) => handleProtectedNavigation(d.path, e)}
                          className="block px-4 py-2 text-sm font-dropdown text-blue-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
                        >
                          {d.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <NavLink 
              to={path!} 
              onClick={(e) => handleProtectedNavigation(path!, e)}
              className={`px-1 md:px-2 py-2 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:scale-105 whitespace-nowrap flex-1 ${
                label === 'MEN' ? 'bg-blue-800 text-white border-b-2 border-blue-900 shadow-sm' : 
                label === 'SALE' ? 'bg-red-600 text-white shadow-sm' : 
                'bg-blue-900 text-white hover:bg-blue-800 shadow-sm'
              } font-JosefinSansBold`}
              onMouseEnter={() => activeDropdown && setActiveDropdown(null)}
            >
              {label}
            </NavLink>
          )}
        </div>
      ))}
    </nav>
  );

  // Mobile Menu Component
  const MobileMenu = () => (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsMobileMenu(false)}>
      <div ref={mobileMenuRef} className="absolute top-0 left-0 w-80 h-full bg-white dark:bg-gray-900 p-6 overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {uniqueNavItems.map(({ label, path, dropdown }) => (
          <div key={label} className="mb-2">
            {dropdown ? (
              <>
                <button onClick={() => setMobileDropdown(mobileDropdown === label ? null : label)} className="flex justify-between w-full text-blue-900 dark:text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap font-JosefinSlabSemiBold">
                  {label}<ChevronDown className={`w-4 h-4 text-blue-900 dark:text-gray-400 ${mobileDropdown === label ? 'rotate-180' : ''} transition-transform duration-200`} />
                </button>
                {mobileDropdown === label && (
                  <div className="mt-2 ml-4 space-y-2">
                    {dropdown.map(d => (
                      <NavLink
                        key={d.path}
                        to={d.path}
                        onClick={(e) => {
                          handleProtectedNavigation(d.path, e);
                          setIsMobileMenu(false);
                        }}
                        className="block py-2 px-4 text-sm font-dropdown text-blue-900 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
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
                onClick={(e) => {
                  handleProtectedNavigation(path!, e);
                  setIsMobileMenu(false);
                }}
                className="block py-3 px-4 text-sm font-bold text-blue-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap font-JosefinSlabSemiBold"
              >
                {label}
              </NavLink>
            )}
          </div>
        ))}
        {isAuthenticated && (
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={signOut} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">Sign Out</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Single Fixed Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 text-blue-900 dark:text-blue-100 shadow-sm" style={{ fontFamily: 'var(--font-brand)' }}>
        {/* Top Bar - Logo and Icons */}
        <div className="flex items-center justify-between px-4 md:px-8 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              onClick={(e) => handleProtectedNavigation('/', e)}
              className="flex items-center"
            >
              <img
                src={mode === 'dark' ? ficiDark : ficiLight}
                alt="FICI Logo"
                className="h-16 md:h-20 w-auto object-contain filter drop-shadow-lg transition-transform duration-300 hover:scale-105 leading-none"
              />
            </NavLink>
          </div>
          {/* Icons Section */}
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setIsSearch(!isSearch)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 shadow-sm" aria-label="Open search">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-blue-900 dark:text-blue-100" />
            </button>

            <NavLink
              to="/wishlist"
              onClick={(e) => handleProtectedNavigation('/wishlist', e)}
              className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 shadow-sm"
            >
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-blue-900 dark:text-blue-100" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/cart"
              onClick={(e) => handleProtectedNavigation('/cart', e)}
              className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 shadow-sm"
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-blue-900 dark:text-blue-100" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </NavLink>

            {/* User Dropdown */}
            <div ref={userDropdownRef} className="relative">
              {isAuthenticated ? (
                <>
                  <button onClick={() => setUserDropdown(!userDropdown)} className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 shadow-sm" aria-haspopup="true" aria-expanded={userDropdown}>
                    <UserRound className="w-5 h-5 text-blue-900 dark:text-blue-100" /> <span className="hidden sm:inline text-sm font-medium text-blue-900 dark:text-blue-100">{displayName}</span> <ChevronDown className="w-4 h-4 text-blue-900 dark:text-blue-100 transition-transform duration-200" />
                  </button>
                  {userDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border dark:border-gray-700 py-2 z-50 animate-fade-in">
                      <button onClick={() => { handleProtectedNavigation('/profile'); setUserDropdown(false); }} className="block w-full text-left px-4 py-1 text-sm font-dropdown text-blue-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg">My Profile</button>
                      <button onClick={() => { handleProtectedNavigation('/orders'); setUserDropdown(false); }} className="block w-full text-left px-4 py-1 text-sm font-dropdown text-blue-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg">My Orders</button>
                      {((role?.toLowerCase() === 'admin') || (user?.user_metadata?.role?.toLowerCase() === 'admin')) && (
                        <button
                          onClick={() => {
                            handleProtectedNavigation('/admin');
                            setUserDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-1 text-sm font-dropdown text-blue-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
                        >
                          Admin Dashboard
                        </button>
                      )}
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <button onClick={() => { signOut(); setUserDropdown(false); }} className="block w-full text-left px-4 py-1 text-sm font-dropdown text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg">Sign Out</button>
                    </div>
                  )}
                </>
              ) : (
                <button onClick={() => handleProtectedNavigation('/auth/signin')} className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 shadow-sm">
                  <UserRound className="w-5 h-5 text-blue-900 dark:text-blue-100" /> <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Sign In</span>
                </button>
              )}
            </div>

            <button onClick={toggleMode} className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-2 shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg" aria-label="Toggle theme">
              {mode === 'light' ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-blue-900 border-b border-blue-800">
          <div className="flex items-center justify-between px-4 md:px-8 py-2">
            {/* Mobile Menu Button */}
            {isMobile && (
              <div className="flex items-center gap-4 md:gap-6">
                <button onClick={() => setIsMobileMenu(!isMobileMenu)} className="p-2 rounded-lg hover:bg-blue-800 transition-colors" aria-label={isMobileMenu ? 'Close menu' : 'Open menu'}>
                  {isMobileMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                </button>
              </div>
            )}

            {/* Conditional Menu Rendering */}
            {isMobile ? null : <DesktopMenu />}
          </div>
        </div>
      </header>

      {/* Conditional Mobile Menu */}
      {isMobile && isMobileMenu && <MobileMenu />}

      {isSearch && (
        <form onSubmit={handleSearch} className="px-4 md:px-8 lg:px-16 py-4 flex items-center gap-3 bg-white dark:bg-gray-900 border-b">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..." className="flex-1 border rounded-lg px-3 py-2" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Search</button>
          <button type="button" onClick={() => setIsSearch(false)}><X className="w-5 h-5 text-blue-900 dark:text-gray-400" /></button>
        </form>
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
    </>
  );
};

export default Header;
