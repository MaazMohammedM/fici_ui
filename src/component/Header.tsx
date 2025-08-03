import { Moon, Search, ShoppingCart, Sun, UserRound, Menu, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import logo from '../assets/Fici Logo.png';
import logoLight from '../assets/Fici Logo Light.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, signOut, firstName } = useAuthStore();
  const { mode, toggleMode, initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    ...(role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : [])
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleProfileClick = () => {
    if (!user) navigate('/auth/signin');
  };

  const displayName = firstName || user?.user_metadata?.first_name || user?.email;

  return (
    <header className='bg-gradient-light dark:bg-gradient-dark w-full sticky top-0 left-0 right-0 z-50'>
      <div className='py-4 mx-auto flex items-center justify-between px-4 md:px-16'>
        {/* Mobile Menu */}
        <div className='md:hidden'>
          <button onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X className='text-primary dark:text-secondary w-6 h-6' /> : <Menu className='text-primary dark:text-secondary w-6 h-6' />}
          </button>
        </div>

        {/* Logo */}
        <div className='flex-1 md:flex-none flex justify-center md:justify-start'>
          <NavLink to='/'><img src={mode === 'light' ? logo : logoLight} alt='logo' className='w-16 h-16' /></NavLink>
        </div>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex gap-4'>
          {navLinks.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                isActive
                  ? 'text-primary-active dark:text-secondary-active hover:text-accent'
                  : 'text-primary dark:text-secondary hover:text-accent'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right Side */}
        <div className='hidden md:flex items-center gap-4'>
          <Search className='text-primary dark:text-secondary w-5 h-5 hover:text-accent cursor-pointer' />
          <NavLink to='/cartpage'><ShoppingCart className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></NavLink>
          <div className='flex items-center gap-2 cursor-pointer' onClick={handleProfileClick}>
            <UserRound className='text-primary dark:text-secondary w-5 h-5' />
            {user ? (
              <>
                <span className='text-sm text-primary dark:text-secondary'>{displayName}</span>
                <button onClick={signOut} className='text-accent text-sm ml-2'>Logout</button>
              </>
            ) : (
              <span className='text-sm text-accent'>Sign In</span>
            )}
          </div>
          <div className='rounded-full bg-primary dark:bg-secondary p-2'>
            <button onClick={toggleMode}>
              {mode === 'light' ? (
                <Sun className='text-white dark:text-primary w-5 h-5' />
              ) : (
                <Moon className='text-white dark:text-primary w-5 h-5' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className='md:hidden fixed inset-0 bg-black bg-opacity-50 z-40' onClick={closeMobileMenu}>
          <div className='absolute top-0 left-0 w-64 h-full bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] shadow-xl p-6' onClick={(e) => e.stopPropagation()}>
            <div className='flex justify-between items-center mb-8'>
              <h3 className='text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]'>Menu</h3>
              <button onClick={closeMobileMenu}><X className='text-primary dark:text-secondary w-6 h-6 hover:text-accent' /></button>
            </div>

            <nav className='flex flex-col gap-4'>
              {navLinks.map(({ label, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `text-lg font-medium transition-colors ${
                      isActive ? 'text-primary-active dark:text-secondary-active' : 'text-primary dark:text-secondary hover:text-accent'
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  {label}
                </NavLink>
              ))}
              <div className='mt-4'>
                <div className='flex items-center gap-2' onClick={handleProfileClick}>
                  <UserRound className='text-primary dark:text-secondary w-5 h-5' />
                  {user ? (
                    <>
                      <div className='text-sm text-primary dark:text-secondary'>{displayName}</div>
                      <button onClick={signOut} className='text-accent text-sm'>Logout</button>
                    </>
                  ) : (
                    <span className='text-sm text-accent'>Sign In</span>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
