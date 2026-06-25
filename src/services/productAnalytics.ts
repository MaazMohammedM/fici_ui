import { supabase } from '../lib/supabase';

// Reusable environment check function
const isTestEnvironment = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isNetlifyPreview = window.location.hostname.includes('netlify.app');
  
  // Check admin role from auth store
  let isAdmin = false;
  try {
    // Import auth store dynamically to avoid circular dependencies
    const { useAuthStore } = require('@store/authStore');
    const authState = useAuthStore.getState();
    const storeRole = authState?.role;
    const storeUser = authState?.user;
    
    isAdmin = storeRole?.toLowerCase() === 'admin' || 
              storeUser?.user_metadata?.role?.toLowerCase() === 'admin';
    
    // Fallback to localStorage check
    if (!isAdmin) {
      isAdmin = localStorage.getItem('userRole') === 'admin';
    }
  } catch (error) {
    // Fallback to localStorage if store access fails
    isAdmin = localStorage.getItem('userRole') === 'admin';
  }
  
  return isAdmin || isLocalhost || isNetlifyPreview;
};

export interface ProductVisitData {
  product_id: string;
  name: string;
  thumbnail_url?: string;
}

export const trackProductVisit = async (data: ProductVisitData) => {
  try {
    // Don't track for admin users or development/preview environments
    if (isTestEnvironment()) {
      return null;
    }
    
    // First, try to get the existing record
    const { data: existingRecord, error: fetchError } = await supabase
      .from('product_visit_stats')
      .select('visit_count')
      .eq('product_id', data.product_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing product visit record:', fetchError);
      console.error('Product visit fetch failed for:', { product_id: data.product_id, name: data.name });
      throw fetchError;
    }

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

    if (error) {
      console.error('Error tracking product visit:', error);
      console.error('Product visit upsert failed for:', { product_id: data.product_id, name: data.name, thumbnail_url: data.thumbnail_url });
      throw error;
    }
    

  } catch (error) {
    console.error('Error in trackProductVisit:', error);
    console.error('Product visit outer error for:', { product_id: data.product_id, name: data.name });
    throw error;
  }
};
