import { supabase } from '../lib/supabase';

export interface ProductVisitData {
  product_id: string;
  name: string;
  thumbnail_url?: string;
}

export const trackProductVisit = async (data: ProductVisitData) => {
  try {
    const { data: visitData, error } = await supabase
      .from('product_visits')
      .insert([data])
      .select();
    
    if (error) throw error;
    return visitData;
  } catch (error) {
    console.error('Error tracking product visit:', error);
    throw error;
  }
};
