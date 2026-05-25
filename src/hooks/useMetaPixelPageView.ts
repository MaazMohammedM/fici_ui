import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import metaPixelEvents from '@/lib/utils/metaPixel';

/**
 * Hook to track page views with Meta Pixel
 * Automatically tracks page views when the route changes
 */
export const useMetaPixelPageView = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    metaPixelEvents.pageView();
  }, [location.pathname, location.search]);
};

export default useMetaPixelPageView;
