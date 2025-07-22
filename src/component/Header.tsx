import { Moon, Search, ShoppingCart, Sun, UserRound } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../assets/Fici Logo.png'
import logoLight from '../assets/Fici Logo Light.png'





const Header: React.FC = () => {

  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', newMode === 'dark');
      localStorage.setItem('mode', newMode);
      return newMode;
    });
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
      <div className='py-4 mx-auto flex items-center justify-between px-16'>
      <div className='py-4 mx-auto flex items-center justify-between px-16'>
        <img src={mode === 'light' ? logo : logoLight} alt="logo" className='w-16 h-16' />
        <nav className='flex items-center gap-4 font-primary'>
          <NavLink className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'} to='/'>Home</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'} to='/products'>Products</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'} to='/about'>About</NavLink>
          <NavLink to='/contact' className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'}>Contact</NavLink>


        </nav>
        <div className='flex items-center gap-4'>
          <button className='cursor-pointer'><Search className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <button className='cursor-pointer'>            <NavLink to='/cartpage' className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'}><ShoppingCart className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></NavLink>
          </button>
          <button className='cursor-pointer'><UserRound className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <div className='rounded-full bg-primary dark:bg-secondary p-2 flex items-center gap-2'>
            {
              mode === 'light' ? (
                <button onClick={toggleMode} className='cursor-pointer'><Sun className='text-white dark:text-primary w-5 h-5' /></button>
              ) : (
                <button onClick={toggleMode} className='cursor-pointer'><Moon className='text-white dark:text-primary w-5 h-5' /></button>
              )
            }
          </div>
          <button className='cursor-pointer'><Search className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <button className='cursor-pointer'>            <NavLink to='/cartpage' className={({ isActive }) => isActive ? 'text-primary-active dark:text-secondary-active hover:text-accent' : 'text-primary dark:text-secondary hover:text-accent'}><ShoppingCart className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></NavLink>
          </button>
          <button className='cursor-pointer'><UserRound className='text-primary dark:text-secondary w-5 h-5 hover:text-accent' /></button>
          <div className='rounded-full bg-primary dark:bg-secondary p-2 flex items-center gap-2'>
            {
              mode === 'light' ? (
                <button onClick={toggleMode} className='cursor-pointer'><Sun className='text-white dark:text-primary w-5 h-5' /></button>
              ) : (
                <button onClick={toggleMode} className='cursor-pointer'><Moon className='text-white dark:text-primary w-5 h-5' /></button>
              )
            }
          </div>
        </div>
      </div>
      </div>
    </header>
  )
}

export default Header