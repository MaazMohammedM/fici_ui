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
  const didSkipInitialRenderRef = useRef(false);

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // The base pixel in index.html already sends the initial PageView.
    // Skip the first React render, then keep tracking SPA route changes.
    if (!didSkipInitialRenderRef.current) {
      didSkipInitialRenderRef.current = true;
      lastTrackedPathRef.current = currentPath;
      return;
    }

    if (currentPath !== lastTrackedPathRef.current) {
      metaPixelEvents.pageView();
      lastTrackedPathRef.current = currentPath;
    }
  }, [location.pathname, location.search]);
};

export default useMetaPixelPageView;
