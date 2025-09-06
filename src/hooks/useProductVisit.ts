import { useCallback } from 'react';
import { supabase } from '@lib/supabase';

export const useProductVisit = () => {
  const trackVisit = useCallback(async (productId: string) => {
    try {
      await supabase.functions.invoke('track-product-visit', {
        body: { product_id: productId }
      });
    } catch (error) {
      console.error('Failed to track product visit:', error);
    }
  }, []);

  return { trackVisit };
};
