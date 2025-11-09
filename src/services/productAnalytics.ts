import { supabase } from '../lib/supabase';

export interface ProductVisitData {
  product_id: string;
  name: string;
  thumbnail_url?: string;
}

export const trackProductVisit = async (data: ProductVisitData) => {
  try {
    // First, try to get the existing record
    const { data: existingRecord } = await supabase
      .from('product_visit_stats')
      .select('visit_count')
      .eq('product_id', data.product_id)
      .maybeSingle();

    let newCount = 1;
    if (existingRecord) {
      newCount = (existingRecord.visit_count || 0) + 1;
    }

    // Upsert with the correct count
    const { data: visitData, error } = await supabase
      .from('product_visit_stats')
      .upsert([{
        product_id: data.product_id,
        name: data.name,
        thumbnail_url: data.thumbnail_url,
        visit_count: newCount,
        last_visited_at: new Date().toISOString()
      }], {
        onConflict: 'product_id'
      })
      .select();

    if (error) throw error;
    return visitData;
  } catch (error) {
    console.error('Error tracking product visit:', error);
    throw error;
  }
};
