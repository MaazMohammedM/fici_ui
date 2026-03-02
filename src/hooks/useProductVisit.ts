import { useCallback } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';

export const useProductVisit = () => {
  const trackVisit = useCallback(async (productId: string) => {
    try {
      const trackProductVisitFunction = httpsCallable(getFunctions(), 'trackProductVisit');
      await trackProductVisitFunction({ product_id: productId });
    } catch (error) {
      console.error('Failed to track product visit:', error);
    }
  }, []);

  return { trackVisit };
};
