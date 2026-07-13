import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import metaPixelEvents from '@/lib/utils/metaPixel';

/**
 * Hook to track page views with Meta Pixel
 * Automatically tracks page views when the route changes
 * Prevents duplicate tracking on the same route revisit
 */
export const useMetaPixelPageView = () => {
  const location = useLocation();
  const lastTrackedPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Only track if this is a different path than the last tracked one
    if (currentPath !== lastTrackedPathRef.current) {
      metaPixelEvents.pageView();
      lastTrackedPathRef.current = currentPath;
    }
  }, [location.pathname, location.search]);
};

export default useMetaPixelPageView;
