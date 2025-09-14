import {
  Moon,
  Search,
  ShoppingCart,
  Sun,
  UserRound,
  Menu,
  X,
  ChevronDown,
  Heart,
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '@store/cartStore';
import { useProductStore } from '@store/productStore';
import { useWishlistCount } from '@store/wishlistStore';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import logo from '../assets/fici_128x128.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, signOut, firstName, getAuthenticationType } = useAuthStore();
  const { mode, toggleMode, initializeTheme } = useThemeStore();
  const { getCartCount } = useCartStore();
  const wishlistCount = useWishlistCount();
  const { searchProducts } = useProductStore();
  const { navigateToAuth } = useAuthRedirect();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const authType = getAuthenticationType();
  const isGuest = authType === 'guest';
  const isAuthenticated = authType === 'user';

  const navigationItems = [
    { label: 'Home', path: '/' },
    {
      label: 'Men',
      hasDropdown: true,
      dropdownItems: [
        { label: "All Men's Footwear", path: '/products?gender=men' },
        { label: 'Shoes', path: '/products?gender=men&sub_category=Shoes' },
        { label: 'Sandals', path: '/products?gender=men&sub_category=Sandals' },
        { label: 'Chappals', path: '/products?gender=men&sub_category=Chappals' },
        { label: 'Loafers', path: '/products?gender=men&sub_category=Loafers' },
        { label: 'Sneakers', path: '/products?gender=men&sub_category=Sneakers' },
      ],
    },
    {
      label: 'Women',
      hasDropdown: true,
      dropdownItems: [
        { label: "All Women's Footwear", path: '/products?gender=women' },
        { label: 'Shoes', path: '/products?gender=women&sub_category=Shoes' },
        { label: 'Sandals', path: '/products?gender=women&sub_category=Sandals' },
        { label: 'Chappals', path: '/products?gender=women&sub_category=Chappals' },
        { label: 'Heels', path: '/products?gender=women&sub_category=Heels' },
        { label: 'Flats', path: '/products?gender=women&sub_category=Flats' },
      ],
    },
    { label: 'Shoe Care', path: '/shoe-care' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    ...(isAuthenticated || isGuest ? [
      { label: 'Wishlist', path: '/wishlist' },
      { label: 'Orders', path: '/orders' }
    ] : []),
    ...(role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : []),
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Display name and cart count
  const displayName = firstName || user?.user_metadata?.first_name || user?.first_name;
  const cartCount = getCartCount();

  // Ensure clicking the user icon always takes to sign-in (fallback to navigate)
  const handleProfileClick = () => {
    try {
      if (navigateToAuth && typeof navigateToAuth === 'function') {
        // let your hook try to handle it first (it might set redirect or open modal)
        navigateToAuth('signin');
      }
    } catch (err) {
      // ignore - we'll fallback to navigate below
      // console.error('navigateToAuth error', err);
    }
    // fallback navigation to ensure it ALWAYS navigates
    navigate('/auth/signin');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search helpers
  const searchablePages = [
    { title: 'Products', path: '/products', description: 'Browse our complete product catalog' },
    { title: 'About Us', path: '/about', description: 'Learn more about our company' },
    { title: 'Contact', path: '/contact', description: 'Get in touch with us' },
    { title: 'Shopping Cart', path: '/cart', description: 'View items in your cart' },
    { title: 'Orders', path: '/orders', description: 'Track your order history' },
    { title: 'Home', path: '/', description: 'Return to homepage' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const pageMatch = searchResults.find((r) => r.type === 'page');
    if (pageMatch && searchResults.length === 1) {
      navigate(pageMatch.path);
    } else {
      searchProducts(searchQuery.trim());
      navigate('/products');
    }
    setIsSearchOpen(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const pageResults = searchablePages
        .filter(
          (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        )
        .map((p) => ({ ...p, type: 'page' }));

      const productSuggestion = {
        title: `Search products for "${query}"`,
        path: '/products',
        description: 'Find products matching your search',
        type: 'product-search',
      };

      setSearchResults([...pageResults, productSuggestion]);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (result: any) => {
    if (result.type === 'page') {
      navigate(result.path);
    } else {
      searchProducts(searchQuery.trim());
      navigate('/products');
    }
    setIsSearchOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 w-full sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="py-3 sm:py-4 mx-auto flex items-center justify-between px-4 md:px-8 lg:px-16">
        {/* Mobile Left Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen((s) => !s)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <X className="text-black dark:text-white w-6 h-6" /> : <Menu className="text-black dark:text-white w-6 h-6" />}
          </button>
        </div>

        {/* Logo */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <NavLink to="/" className="flex items-center">
            <img src={logo} alt="FICI Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
          </NavLink>
        </div>

        {/* Mobile Right Icons (Search + Cart + SignIn) */}
        <div className="md:hidden flex items-center gap-3">
          <button onClick={() => setIsSearchOpen((s) => !s)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Search className="text-black dark:text-white w-5 h-5" />
          </button>

          <NavLink to="/wishlist" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Heart className="text-black dark:text-white w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ShoppingCart className="text-black dark:text-white w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>

          <div className="flex items-center gap-2">
            <div className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={handleProfileClick}>
              <UserRound className="text-black dark:text-white w-5 h-5" />
            </div>
          </div>

          <button onClick={toggleMode} className="rounded-full bg-blue-600 dark:bg-yellow-500 p-2 hover:opacity-90 transition-colors" aria-label="Toggle theme">
            {mode === 'light' ? <Sun className="text-white w-4 h-4" /> : <Moon className="text-white w-4 h-4" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 lg:gap-8">
          {navigationItems.map((item) => (
            <div key={item.label} className="relative" ref={item.hasDropdown ? dropdownRef : undefined}>
              {item.hasDropdown ? (
                <button
                  className="flex items-center gap-1 text-black dark:text-white px-3 py-2 rounded-lg hover:text-blue-600"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
              ) : (
                <NavLink
                  to={item.path!}
                  className={({ isActive }) =>
                    `text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-lg ${
                      isActive ? 'text-blue-600' : 'text-black dark:text-white hover:text-blue-600'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )}

              {/* Dropdown menu */}
              {item.hasDropdown && activeDropdown === item.label && (
                <div
                  className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.dropdownItems?.map((dropdownItem) => (
                    <NavLink
                      key={dropdownItem.path}
                      to={dropdownItem.path}
                      className="block px-4 py-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {dropdownItem.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <button onClick={() => setIsSearchOpen((s) => !s)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Search className="text-black dark:text-white w-5 h-5" />
          </button>

          <NavLink to="/wishlist" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Heart className="text-black dark:text-white w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ShoppingCart className="text-black dark:text-white w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 relative" ref={userDropdownRef}>
              {isAuthenticated ? (
                <div>
                  <button
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setUserDropdownOpen((s) => !s)}
                    aria-haspopup="true"
                    aria-expanded={userDropdownOpen}
                  >
                    <UserRound className="text-black dark:text-white w-5 h-5" />
                    <span className="text-sm text-black dark:text-white">{displayName}</span>
                    <ChevronDown className="w-4 h-4 text-black dark:text-white" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50">
                      <button onClick={() => { navigate('/profile'); setUserDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        My Profile
                      </button>
                      <button onClick={() => { navigate('/orders'); setUserDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        My Orders
                      </button>
                      <hr className="my-1 border-gray-100 dark:border-gray-700" />
                      <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={handleProfileClick} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <UserRound className="text-black dark:text-white w-5 h-5" />
                  <span className="text-sm text-black dark:text-white-600">Sign In</span>
                </button>
              )}
            </div>
          </div>

          <button onClick={toggleMode} className="rounded-full bg-blue-600 dark:bg-yellow-500 p-2 hover:opacity-95">
            {mode === 'light' ? <Sun className="text-white w-4 h-4" /> : <Moon className="text-white w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Enhanced Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg z-40">
          <div className="px-4 md:px-8 lg:px-16 py-4">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search products, pages, or navigate..."
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-gray-100 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black dark:text-white placeholder-gray-400"
                  autoFocus
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg">
                Search
              </button>
              <button type="button" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }} className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="text-black dark:text-white w-5 h-5" />
              </button>
            </form>

            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-black dark:text-white">{result.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{result.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 w-80 h-full bg-white dark:bg-gray-900 shadow-xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-black dark:text-white">Menu</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-6 h-6 text-black dark:text-white" />
              </button>
            </div>

            <nav className="flex flex-col gap-2 mb-8">
              {navigationItems.map((item) => (
                <div key={item.label}>
                  {item.hasDropdown ? (
                    <div>
                      <div className="text-lg font-medium text-black dark:text-white px-4 py-3">{item.label}</div>
                      <div className="ml-4 space-y-1">
                        {item.dropdownItems?.map((d) => (
                          <NavLink key={d.path} to={d.path} className="block text-sm font-medium px-4 py-2 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(false)}>
                            {d.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <NavLink to={item.path!} className="text-lg font-medium px-4 py-3 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(false)}>
                      {item.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </nav>

            {isAuthenticated && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <UserRound className="text-black dark:text-white w-6 h-6" />
                  <span className="text-lg font-medium text-black dark:text-white">{displayName}</span>
                </div>
                <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full bg-blue-600 text-white py-3 rounded-lg">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;