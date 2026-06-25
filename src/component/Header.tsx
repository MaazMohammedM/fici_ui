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
import ficiLight from '../assets/fici_transparent.webp';
import ficiDark from '../assets/fici_logo_dark.webp';
import NetworkIssueBanner from '../components/NetworkIssueBanner';

// Media query hook for responsive behavior
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add event listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }
    
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [query]);

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
  const [isDesktopSearchActive, setIsDesktopSearchActive] = useState(false);
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
    // Close mobile menu if open
    if (isMobileMenu) {
      setIsMobileMenu(false);
    }
    
    if (isOnCheckoutWithChanges) {
      e?.preventDefault();
      setPendingNavigation(path);
      setShowNavigationWarning(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    // Close mobile menu if open
    if (isMobileMenu) {
      setIsMobileMenu(false);
    }
    
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleProtectedNavigation(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearch(false);
    setSearchQuery(''); // Clear search query after submission
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
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Dedupe menu data
  const uniqueNavItems = useMemo(() => {
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
    
    const map = new Map();
    navItems.forEach(item => map.set(item.label, item));
    return Array.from(map.values());
  }, []);

  // Desktop Menu Component
  const DesktopMenu = () => (
    <nav className="flex items-center justify-between flex-1 px-2 sm:px-4 md:px-6 lg:px-8" ref={desktopDropdownRef}>
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
                className="flex items-center justify-center gap-1 px-2 sm:px-3 py-2 text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] xl:text-[16px] font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:scale-105 whitespace-nowrap flex-1 bg-[#11224C] text-white hover:bg-[#0D1A3A] shadow-sm font-JosefinSansBold border-b border-[#0D1A3A]"
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
                          onClick={(e) => {
                            handleProtectedNavigation(d.path, e);
                            setActiveDropdown(null);
                          }}
                          className="block px-4 py-2 text-sm font-dropdown text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
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
              className="px-2 sm:px-3 py-2 text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] xl:text-[16px] font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:scale-105 whitespace-nowrap flex-1 bg-[#11224C] text-white hover:bg-[#0D1A3A] shadow-sm font-JosefinSansBold border-b border-[#0D1A3A]"
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
      <div ref={mobileMenuRef} className="absolute top-0 left-0 w-[75vw] max-w-xs sm:w-72 md:w-80 h-full bg-white dark:bg-gray-900 p-4 sm:p-6 overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {uniqueNavItems.map(({ label, path, dropdown }) => (
          <div key={label} className="mb-2">
            {dropdown ? (
              <>
                <button onClick={() => setMobileDropdown(mobileDropdown === label ? null : label)} className="flex justify-between w-full text-gray-700 dark:text-gray-300 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap font-JosefinSlabSemiBold">
                  {label}<ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${mobileDropdown === label ? 'rotate-180' : ''} transition-transform duration-200`} />
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
                        className="block py-2 px-4 text-sm font-dropdown text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
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
                className="block py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap font-JosefinSlabSemiBold"
              >
                {label}
              </NavLink>
            )}
          </div>
        ))}
        
        {/* Theme Toggle in Mobile Menu */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => {
              toggleMode();
            }} 
            className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {mode === 'light' ? <Sun className="w-5 h-5 text-blue-900" /> : <Moon className="w-5 h-5 text-blue-900" />}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>
            <div className="w-12 h-6 bg-gray-300 dark:bg-[#1A2C49] rounded-full relative transition-colors">
              <div className={`absolute top-1 ${mode === 'light' ? 'left-1' : 'left-7'} w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm`}></div>
            </div>
          </button>
        </div>
        
        {isAuthenticated && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={signOut} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">Sign Out</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <NetworkIssueBanner />
      {/* Single Fixed Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 shadow-sm" style={{ fontFamily: 'var(--font-brand)' }}>
        {/* Top Bar - Logo and Icons */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-8 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <NavLink
              to="/"
              onClick={(e) => handleProtectedNavigation('/', e)}
              className="flex items-center"
            >
              <img
                src={mode === 'dark' ? ficiDark : ficiLight}
                alt="FICI Logo - Premium leather shoe manufacturer Ambur India"
                className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain filter drop-shadow-lg transition-transform duration-300 hover:scale-105 leading-none"
              />
            </NavLink>
          </div>
          {/* Icons Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Desktop Search Input - Full input on large screens only */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search products..." 
                className="flex-1 border rounded-lg px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                onFocus={() => setIsDesktopSearchActive(true)}
                onBlur={() => {
                  // Only hide if search query is empty
                  if (!searchQuery) {
                    setIsDesktopSearchActive(false);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!searchQuery.trim()) return;
                    handleProtectedNavigation(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                    setIsDesktopSearchActive(false);
                    setSearchQuery(''); // Clear search query after submission
                  }
                }}
              />
              {isDesktopSearchActive && (
                <>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (!searchQuery.trim()) return;
                      handleProtectedNavigation(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                      setIsDesktopSearchActive(false);
                      setSearchQuery(''); // Clear search query after submission
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Search
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsDesktopSearchActive(false);
                      setSearchQuery('');
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </>
              )}
            </div>

            {/* Tablet & Mobile Search Icon - Only icon on medium and small screens */}
            <button 
              onClick={() => setIsSearch(!isSearch)} 
              className="lg:hidden p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 shadow-sm" 
              aria-label="Open search"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <NavLink
              to="/wishlist"
              onClick={(e) => handleProtectedNavigation('/wishlist', e)}
              className="relative p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 shadow-sm"
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] sm:text-[10px] rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/cart"
              onClick={(e) => handleProtectedNavigation('/cart', e)}
              className="relative p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1A2C49] text-white text-[9px] sm:text-[10px] rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </NavLink>

            {/* User Dropdown */}
            <div ref={userDropdownRef} className="relative">
              {isAuthenticated ? (
                <>
                  <button onClick={() => setUserDropdown(!userDropdown)} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 shadow-sm" aria-haspopup="true" aria-expanded={userDropdown}>
                    <UserRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" /> <span className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{displayName}</span> <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300 transition-transform duration-200" />
                  </button>
                  {userDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border dark:border-gray-700 py-2 z-50 animate-fade-in">
                      <button onClick={() => { handleProtectedNavigation('/profile'); setUserDropdown(false); }} className="block w-full text-left px-4 py-1 text-sm font-dropdown text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg">My Profile</button>
                      <button onClick={() => { handleProtectedNavigation('/orders'); setUserDropdown(false); }} className="block w-full text-left px-4 py-1 text-sm font-dropdown text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg">My Orders</button>
                      {((role?.toLowerCase() === 'admin') || (user?.user_metadata?.role?.toLowerCase() === 'admin')) && (
                        <button
                          onClick={() => {
                            handleProtectedNavigation('/admin');
                            setUserDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-1 text-sm font-dropdown text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
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
                <button onClick={() => handleProtectedNavigation('/auth/signin')} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 shadow-sm">
                  <UserRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" /> <span className="hidden xs:inline text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Sign In</span>
                </button>
              )}
            </div>

            <button onClick={toggleMode} className="hidden md:block rounded-full bg-[#0D1A3A] hover:bg-[#0A1528] p-1.5 sm:p-2 shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg" aria-label="Toggle theme">
              {mode === 'light' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-[#11224C] border-b border-[#0D1A3A]">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-8 lg:px-12 py-2">
            {/* Mobile Menu Button */}
            {isMobile && (
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <button onClick={() => setIsMobileMenu(!isMobileMenu)} className="p-1.5 sm:p-2 rounded-lg hover:bg-[#0D1A3A] transition-colors" aria-label={isMobileMenu ? 'Close menu' : 'Open menu'}>
                  {isMobileMenu ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
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
        <form onSubmit={handleSearch} className="px-3 sm:px-4 md:px-8 lg:px-16 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-900 border-b">
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search products..." 
            className="flex-1 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base min-w-0" 
          />
          <button 
            type="submit" 
            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-[#11224C] text-white rounded-lg text-xs sm:text-sm md:text-base font-medium whitespace-nowrap"
          >
            Search
          </button>
          <button 
            type="button" 
            onClick={() => setIsSearch(false)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close search"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </button>
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
