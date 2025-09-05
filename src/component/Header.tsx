import { Moon, Search, ShoppingCart, Sun, UserRound, Menu, X, ChevronDown } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '@store/cartStore';
import { useProductStore } from '../store/productStore';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import logo from '../assets/fici_128x128.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, signOut, firstName, guestSession, getAuthenticationType } = useAuthStore();
  const { mode, toggleMode, initializeTheme } = useThemeStore();
  const { getCartCount } = useCartStore();
  const { searchProducts } = useProductStore();
  const { navigateToAuth } = useAuthRedirect();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Handle click outside to close dropdowns
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

  const authType = getAuthenticationType();
  const isGuest = authType === 'guest';
  const isAuthenticated = authType === 'user';

  // Navigation structure with dropdowns
  const navigationItems = [
    { label: 'Home', path: '/' },
    {
      label: 'Men',
      hasDropdown: true,
      dropdownItems: [
        { label: 'All Men\'s Footwear', path: '/products?gender=men' },
        { label: 'Shoes', path: '/products?gender=men&sub_category=Shoes' },
        { label: 'Sandals', path: '/products?gender=men&sub_category=Sandals' },
        { label: 'Chappals', path: '/products?gender=men&sub_category=Chappals' },
        { label: 'Loafers', path: '/products?gender=men&sub_category=Loafers' },
        { label: 'Sneakers', path: '/products?gender=men&sub_category=Sneakers' },
      ]
    },
    {
      label: 'Women',
      hasDropdown: true,
      dropdownItems: [
        { label: 'All Women\'s Footwear', path: '/products?gender=women' },
        { label: 'Shoes', path: '/products?gender=women&sub_category=Shoes' },
        { label: 'Sandals', path: '/products?gender=women&sub_category=Sandals' },
        { label: 'Chappals', path: '/products?gender=women&sub_category=Chappals' },
        { label: 'Heels', path: '/products?gender=women&sub_category=Heels' },
        { label: 'Flats', path: '/products?gender=women&sub_category=Flats' },
      ]
    },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    // Only show Orders for authenticated users or guests with orders
    ...(isAuthenticated || isGuest ? [{ label: 'Orders', path: '/orders' }] : []),
    ...(role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : [])
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
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleProfileClick = () => {
    if (!user && !guestSession) {
      navigateToAuth('signin');
    } else if (isGuest) {
      // For guest users, show a dropdown or navigate to account creation
      navigate('/auth/signin');
    }
  };


  // Enhanced search with navigation pages and products
  const searchablePages = [
    { title: 'Products', path: '/products', description: 'Browse our complete product catalog' },
    { title: 'About Us', path: '/about', description: 'Learn more about our company' },
    { title: 'Contact', path: '/contact', description: 'Get in touch with us' },
    { title: 'Shopping Cart', path: '/cart', description: 'View items in your cart' },
    { title: 'Orders', path: '/orders', description: 'Track your order history' },
    { title: 'Home', path: '/', description: 'Return to homepage' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // If it's a page search result, navigate directly
      const pageMatch = searchResults.find(result => result.type === 'page');
      if (pageMatch && searchResults.length === 1) {
        navigate(pageMatch.path);
      } else {
        // Otherwise, search products
        searchProducts(searchQuery.trim());
        navigate('/products');
      }
      closeSearch();
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      // Search pages
      const pageResults = searchablePages
        .filter(page => 
          page.title.toLowerCase().includes(query.toLowerCase()) ||
          page.description.toLowerCase().includes(query.toLowerCase())
        )
        .map(page => ({ ...page, type: 'page' }));
      
      // Add product search suggestion
      const productSuggestion = {
        title: `Search products for "${query}"`,
        path: '/products',
        description: 'Find products matching your search',
        type: 'product-search'
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
    } else if (result.type === 'product-search') {
      searchProducts(searchQuery.trim());
      navigate('/products');
    }
    closeSearch();
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

        {/* Mobile Right Icons (Search + Cart + SignIn) */}
        <div className="md:hidden flex items-center gap-3">
          <button 
            onClick={toggleSearch}
            className="p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors"
          >
            <Search className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
          </button>
          <NavLink to="/cart" className="relative p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors">
            <ShoppingCart className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[color:var(--color-accent)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>
          <div className="flex items-center gap-2">
            <div 
              className="cursor-pointer p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors" 
              onClick={handleProfileClick}
            >
              <UserRound className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
            </div>
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
          {navigationItems.map((item) => (
            <div key={item.label} className="relative" ref={item.hasDropdown ? dropdownRef : undefined}>
              {item.hasDropdown ? (
                <button
                  className="flex items-center gap-1 text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-lg text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/5"
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
                      isActive
                        ? 'text-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10'
                        : 'text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )}
              
              {/* Dropdown Menu */}
              {item.hasDropdown && activeDropdown === item.label && (
                <div 
                  className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[color:var(--color-dark2)] rounded-lg shadow-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] py-2 z-50"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.dropdownItems?.map((dropdownItem) => (
                    <NavLink
                      key={dropdownItem.path}
                      to={dropdownItem.path}
                      className="block px-4 py-2 text-sm text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark3)] hover:text-[color:var(--color-accent)] transition-colors"
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
          <button 
            onClick={toggleSearch}
            className="p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors"
          >
            <Search className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5 hover:text-[color:var(--color-accent)]" />
          </button>
          
          <NavLink to="/cart" className="relative p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors">
            <ShoppingCart className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5 hover:text-[color:var(--color-accent)]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[color:var(--color-accent)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </NavLink>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 relative" ref={userDropdownRef}>
              {isAuthenticated ? (
                <div>
                  <button 
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors" 
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <UserRound className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
                    <span className="text-sm text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] font-medium">
                      {displayName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)]" />
                  </button>
                  
                  {userDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[color:var(--color-dark2)] rounded-lg shadow-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] py-2 z-50">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark3)] transition-colors"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/orders');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark3)] transition-colors"
                      >
                        My Orders
                      </button>
                      <hr className="my-1 border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)]" />
                      <button
                        onClick={() => {
                          signOut();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[color:var(--color-accent)] hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark3)] transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors" 
                  onClick={handleProfileClick}
                >
                  <UserRound className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
                  <span className="text-sm text-[color:var(--color-accent)] font-medium">Sign In</span>
                </div>
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

      {/* Enhanced Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] border-b border-[color:var(--color-light2)] dark:border-[color:var(--color-dark2)] shadow-lg z-40">
          <div className="px-4 md:px-8 lg:px-16 py-4">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search products, pages, or navigate..."
                  className="w-full pl-10 pr-4 py-3 bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark2)] border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] placeholder-[color:var(--color-primary)]/60 dark:placeholder-[color:var(--color-secondary)]/60"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[color:var(--color-accent)] text-white rounded-lg hover:bg-[color:var(--color-accent)]/80 transition-colors font-medium"
              >
                Search
              </button>
              <button
                type="button"
                onClick={closeSearch}
                className="p-3 rounded-lg hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark2)] transition-colors"
              >
                <X className="text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] w-5 h-5" />
              </button>
            </form>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-3 bg-white dark:bg-[color:var(--color-dark2)] rounded-lg shadow-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left px-4 py-3 hover:bg-[color:var(--color-light2)] dark:hover:bg-[color:var(--color-dark3)] transition-colors border-b border-[color:var(--color-light2)] dark:border-[color:var(--color-dark3)] last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {result.type === 'page' ? (
                        <div className="w-8 h-8 bg-[color:var(--color-accent)]/10 rounded-lg flex items-center justify-center">
                          <Search className="w-4 h-4 text-[color:var(--color-accent)]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <Search className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)]">
                          {result.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {result.description}
                        </p>
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
              {navigationItems.map((item) => (
                <div key={item.label}>
                  {item.hasDropdown ? (
                    <div>
                      <div className="text-lg font-medium text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] px-4 py-3">
                        {item.label}
                      </div>
                      <div className="ml-4 space-y-1">
                        {item.dropdownItems?.map((dropdownItem) => (
                          <NavLink
                            key={dropdownItem.path}
                            to={dropdownItem.path}
                            className="block text-sm font-medium transition-colors px-4 py-2 rounded-lg text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/5"
                            onClick={closeMobileMenu}
                          >
                            {dropdownItem.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path!}
                      className={({ isActive }) =>
                        `text-lg font-medium transition-colors px-4 py-3 rounded-lg ${
                          isActive
                            ? 'text-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10'
                            : 'text-[color:var(--color-primary)] dark:text-[color:var(--color-secondary)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/5'
                        }`
                      }
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile User Info */}
            {isAuthenticated && (
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