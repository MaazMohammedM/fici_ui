import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls window to top on every route change
 */
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // If a hash is present, scroll to that element; otherwise scroll to top
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname, location.search, location.hash, location.key]);

  // Handle clicks on links that keep the same pathname (e.g. footer links)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const anchorUrl = new URL(anchor.href, window.location.href);
      if (anchorUrl.pathname === window.location.pathname && anchorUrl.hash === '' && anchorUrl.search === '') {
        // Scroll after navigation tick
        setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 0);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
};

export default ScrollToTop;
