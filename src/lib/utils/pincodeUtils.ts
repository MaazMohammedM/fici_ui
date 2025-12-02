import { supabase } from '../supabase';

export interface PincodeDetails {
  pincode: string;
  city: string;
  state: string;
  active?: boolean;
  is_serviceable?: boolean;
  cod_allowed?: boolean;
  min_order_amount?: number;
  shipping_fee?: number;
  cod_fee?: number;
  free_shipping_threshold?: number;
  created_at?: string;
  updated_at?: string;
  delivery_time?: string;
  districts?: string[];
}

export interface LocalPincode {
  pincode: string;
  city: string;
  state: string;
  districts?: string[];
}

/**
 * Fetch pincode details from Supabase database
 */
export const fetchPincodeDetails = async (pincode: string): Promise<PincodeDetails | null> => {
  try {
    console.log('Fetching pincode details for:', pincode);
    
    // Try to get exact match first
    const { data, error } = await supabase
      .from('pincodes')
      .select('pincode, city, state, active, is_serviceable, cod_allowed, min_order_amount, shipping_fee, cod_fee, free_shipping_threshold, created_at, updated_at, delivery_time, districts')
      .eq('pincode', pincode)
      .limit(1); // Use limit(1) instead of maybeSingle to handle multiple rows

    console.log('Supabase query result:', { data, error });

    if (error) {
      console.error('Error fetching pincode details:', error);
      // Try with ilike for case-insensitive match
      const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
        .from('pincodes')
        .select('pincode, city, state, active, is_serviceable, cod_allowed, min_order_amount, shipping_fee, cod_fee, free_shipping_threshold, created_at, updated_at, delivery_time, districts')
        .ilike('pincode', pincode)
        .limit(1);

      console.log('Case-insensitive query result:', { caseInsensitiveData, caseInsensitiveError });

      if (caseInsensitiveError) {
        console.error('Error with case-insensitive search:', caseInsensitiveError);
        return null;
      }

      return caseInsensitiveData && caseInsensitiveData.length > 0 ? caseInsensitiveData[0] : null;
    }

    // Return the first result if found
    const result = data && data.length > 0 ? data[0] : null;
    console.log('Final result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching pincode details:', error);
    return null;
  }
};

/**
 * Get local pincodes from JSON file (for quick search suggestions)
 */
export const getLocalPincodes = async (): Promise<string[] | LocalPincode[]> => {
  try {
    const response = await fetch('/pincodes.json');
    const pincodes = await response.json();
    return pincodes;
  } catch (error) {
    console.error('Error loading local pincodes:', error);
    return [];
  }
};

/**
 * Search pincodes from local JSON by partial match
 */
export const searchPincodes = async (query: string): Promise<LocalPincode[]> => {
  try {
    const pincodes = await getLocalPincodes();
    
    if (!query || query.length < 3) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    
    // Check if pincodes array is empty
    if (!pincodes || pincodes.length === 0) {
      return [];
    }
    
    // Handle both string array and object array formats
    if (typeof pincodes[0] === 'string') {
      // If pincodes is an array of strings, convert to LocalPincode format
      return (pincodes as string[])
        .filter(pincodeStr => pincodeStr && pincodeStr.toLowerCase().includes(lowerQuery))
        .slice(0, 10)
        .map(pincodeStr => ({
          pincode: pincodeStr,
          city: '',
          state: ''
        }));
    } else {
      // If pincodes is an array of objects, filter safely
      return (pincodes as LocalPincode[])
        .filter(pincode => {
          if (!pincode) return false;
          const pincodeMatch = pincode.pincode && pincode.pincode.toLowerCase().includes(lowerQuery);
          const cityMatch = pincode.city && pincode.city.toLowerCase().includes(lowerQuery);
          const stateMatch = pincode.state && pincode.state.toLowerCase().includes(lowerQuery);
          return pincodeMatch || cityMatch || stateMatch;
        })
        .slice(0, 10);
    }
  } catch (error) {
    console.error('Error searching pincodes:', error);
    return [];
  }
};

/**
 * Check if a pincode is serviceable
 */
export const isPincodeServiceable = async (pincode: string): Promise<boolean> => {
  try {
    const details = await fetchPincodeDetails(pincode);
    if (!details) return true; // Default to serviceable if no data found
    return details.is_serviceable !== false && details.active !== false;
  } catch (error) {
    return true; // Default to serviceable on error
  }
};

/**
 * Get shipping fee for a pincode
 */
export const getShippingFee = async (pincode: string): Promise<number> => {
  try {
    const details = await fetchPincodeDetails(pincode);
    if (!details) return 0; // Default to free shipping if no data found
    return details.shipping_fee || 0;
  } catch (error) {
    return 0; // Default to free shipping on error
  }
};

/**
 * Get COD availability for a pincode
 */
export const isCODAvailable = async (pincode: string): Promise<boolean> => {
  try {
    const details = await fetchPincodeDetails(pincode);
    if (!details) return true; // Default to COD available if no data found
    return details.cod_allowed !== false;
  } catch (error) {
    return true; // Default to COD available on error
  }
};

/**
 * Get delivery time for a pincode
 */
export const getDeliveryTime = async (pincode: string): Promise<string | null> => {
  try {
    const details = await fetchPincodeDetails(pincode);
    if (!details) return null; // No delivery time if no data found
    return details.delivery_time || null;
  } catch (error) {
    return null; // No delivery time on error
  }
};

/**
 * Get minimum order amount for a pincode
 */
export const getMinOrderAmount = async (pincode: string): Promise<number> => {
  try {
    const details = await fetchPincodeDetails(pincode);
    if (!details) return 0; // Default to no minimum if no data found
    return details.min_order_amount || 0;
  } catch (error) {
    return 0; // Default to no minimum on error
  }
};

/**
 * Get free shipping threshold for a pincode
 */
export const getFreeShippingThreshold = async (pincode: string): Promise<number> => {
  try {
    const details = await fetchPincodeDetails(pincode);
    if (!details) return 999; // Default to 999 if no data found
    return details.free_shipping_threshold || 999;
  } catch (error) {
    return 999; // Default to 999 on error
  }
};
