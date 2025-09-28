import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Heart, ShoppingCart, UserRound, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '@store/cartStore';
import { useWishlistCount } from '@store/wishlistStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
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

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
    ...(isAuthenticated || isGuest ? [{ label: 'Wishlist', path: '/wishlist' }, { label: 'Orders', path: '/orders' }] : []),
    ...(role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : []),
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
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
        <NavLink to="/" className="flex items-center h-12">
          <img 
            src="/src/assets/fici_512x512.webp" 
            alt="FICI Logo" 
            className="h-full w-auto"
          />
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-2 lg:gap-3 xl:gap-6 items-center" ref={desktopDropdownRef}>
          {navItems.map(({ label, path, dropdown }) => (
            <div key={label} className="relative">
              {dropdown ? (
                <>
                  <button
                    onMouseEnter={() => setActiveDropdown(label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg hover:text-blue-600 transition-colors"
                    aria-expanded={activeDropdown === label}
                  >
                    {label} <ChevronDown className="w-4 h-4" />
                  </button>
                  {activeDropdown === label && (
                    <div
                      className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2 z-50"
                      onMouseEnter={() => setActiveDropdown(label)}
                      onMouseLeave={() => setActiveDropdown(null)}

                    >
                      {dropdown.map(d => (
                        <NavLink key={d.path} to={d.path} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => setActiveDropdown(null)}>
                          {d.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink to={path!} className="px-3 py-2 hover:text-blue-600 transition-colors">{label}</NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button onClick={() => setIsSearch(!isSearch)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Open search">
            <Search className="w-5 h-5" />
          </button>

          <NavLink to="/wishlist" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
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
                    <button onClick={() => { navigate('/profile'); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</button>
                    <button onClick={() => { navigate('/orders'); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">My Orders</button>
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <button onClick={() => { signOut(); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">Sign Out</button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => navigate('/auth/signin')} className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
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
                      <NavLink key={d.path} to={d.path} onClick={() => setIsMobileMenu(false)} className="block pl-6 py-2">{d.label}</NavLink>
                    ))}
                  </>
                ) : (
                  <NavLink to={path!} onClick={() => setIsMobileMenu(false)} className="block py-2">{label}</NavLink>
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
    </header>
  );
};

export default Header;