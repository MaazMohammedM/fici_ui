import { Moon, Search, ShoppingCart, Sun, UserRound, Menu, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../assets/Fici Logo.png'
import logoLight from '../assets/Fici Logo Light.png'

const Header: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', newMode === 'dark');
      localStorage.setItem('mode', newMode);
      return newMode;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'dark' || storedMode === 'light') {
      setMode(storedMode);
      document.documentElement.classList.toggle('dark', storedMode === 'dark');
    }
  }, []);

  return (
    <header className='bg-gradient-light dark:bg-gradient-dark w-full sticky top-0 left-0 right-0 z-50'>
      <div className='py-4 mx-auto flex items-center justify-between px-4 md:px-16'>
        {/* Mobile Menu Button - Left side */}
        <div className='md:hidden flex items-center gap-2'>
          <button onClick={toggleMobileMenu} className='cursor-pointer'>
            {isMobileMenuOpen ? (
              <X className='text-primary dark:text-secondary w-6 h-6 hover:text-accent' />
            ) : (
              <Menu className='text-primary dark:text-secondary w-6 h-6 hover:text-accent' />
            )}
          </button>
        </div>

        {/* Logo - Centered on mobile, left on desktop */}
        <div className='flex-1 md:flex-none flex justify-center md:justify-start'>
          <NavLink to='/' className='cursor-pointer hover:opacity-80 transition-opacity'>
            <img src={mode === 'light' ? logo : logoLight} alt="logo" className='w-16 h-16' />
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center gap-4 font-primary'>
          <NavLink className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'} to='/'>Home</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'} to='/products'>Products</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'} to='/about'>About</NavLink>
          <NavLink to='/contact' className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'}>Contact</NavLink>
        </nav>

        {/* Desktop Actions */}
        <div className='hidden md:flex items-center gap-4'>
          <button className='cursor-pointer'><Search className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <button className='cursor-pointer'>
            <NavLink to='/cartpage' className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'}>
              <ShoppingCart className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' />
            </NavLink>
          </button>
          <button className='cursor-pointer'><UserRound className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <div className='rounded-full bg-primary dark:bg-secondary p-2 flex items-center gap-2'>
            {mode === 'light' ? (
              <button onClick={toggleMode} className='cursor-pointer'><Sun className='text-white dark:text-primary w-5 h-5' /></button>
            ) : (
              <button onClick={toggleMode} className='cursor-pointer'><Moon className='text-white dark:text-primary w-5 h-5' /></button>
            )}
          </div>
        </div>

        {/* Mobile Actions - Right side */}
        <div className='md:hidden flex items-center gap-2'>
          <button className='cursor-pointer'><Search className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <button className='cursor-pointer'>
            <NavLink to='/cartpage' className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'}>
              <ShoppingCart className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' />
            </NavLink>
          </button>
          <button className='cursor-pointer'><UserRound className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <div className='rounded-full bg-primary dark:bg-secondary p-2'>
            {mode === 'light' ? (
              <button onClick={toggleMode} className='cursor-pointer'><Sun className='text-white dark:text-primary w-5 h-5' /></button>
            ) : (
              <button onClick={toggleMode} className='cursor-pointer'><Moon className='text-white dark:text-primary w-5 h-5' /></button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className='md:hidden fixed inset-0 bg-black bg-opacity-50 z-40' onClick={closeMobileMenu}>
          <div className='absolute top-0 left-0 w-64 h-full bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] shadow-xl p-6' onClick={(e) => e.stopPropagation()}>
            <div className='flex justify-between items-center mb-8'>
              <h3 className='text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]'>Menu</h3>
              <button onClick={closeMobileMenu} className='cursor-pointer'>
                <X className='text-primary dark:text-secondary w-6 h-6 hover:text-accent' />
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <nav className='flex flex-col gap-4'>
              <NavLink 
                to='/' 
                className={({ isActive }) => 
                  `text-lg font-medium transition-colors ${
                    isActive 
                      ? 'text-primary-active dark:text-secondary-active' 
                      : 'text-primary dark:text-secondary hover:text-accent'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Home
              </NavLink>
              <NavLink 
                to='/products' 
                className={({ isActive }) => 
                  `text-lg font-medium transition-colors ${
                    isActive 
                      ? 'text-primary-active dark:text-secondary-active' 
                      : 'text-primary dark:text-secondary hover:text-accent'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Products
              </NavLink>
              <NavLink 
                to='/about' 
                className={({ isActive }) => 
                  `text-lg font-medium transition-colors ${
                    isActive 
                      ? 'text-primary-active dark:text-secondary-active' 
                      : 'text-primary dark:text-secondary hover:text-accent'
                  }`
                }
                onClick={closeMobileMenu}
              >
                About
              </NavLink>
              <NavLink 
                to='/contact' 
                className={({ isActive }) => 
                  `text-lg font-medium transition-colors ${
                    isActive 
                      ? 'text-primary-active dark:text-secondary-active' 
                      : 'text-primary dark:text-secondary hover:text-accent'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Contact
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header