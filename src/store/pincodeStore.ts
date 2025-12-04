// src/store/pincodeStore.ts
import { create } from "zustand";
import { supabase } from "@lib/supabase";

export interface PincodeDetails {
  pincode: string;
  city: string;
  state: string;
  districts: string[];
  active: boolean;
  is_serviceable: boolean;
  cod_allowed: boolean;
  min_order_amount: number;
  shipping_fee: number;
  cod_fee: number;
  free_shipping_threshold: number | null;
  delivery_time: string;
  created_at?: string;
  updated_at?: string;
}

interface PincodeState {
  // Existing state
  loaded: boolean;
  validPincodes: Set<string>;
  detailsCache: Record<string, PincodeDetails | null>;
  
  // New state for pincode management
  pincodes: PincodeDetails[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  searchQuery: string;
  totalCount: number;
  itemsPerPage: number;
  
  // Existing methods
  loadPincodes: () => Promise<void>;
  isValidPincode: (pin: string) => boolean;
  fetchDetails: (pin: string) => Promise<PincodeDetails | null>;
  
  // New methods for CRUD operations
  fetchPincodes: (page?: number, search?: string) => Promise<void>;
  createPincode: (data: Omit<PincodeDetails, 'created_at' | 'updated_at'>) => Promise<PincodeDetails>;
  updatePincode: (pincode: string, data: Partial<PincodeDetails>) => Promise<PincodeDetails>;
  deletePincode: (pincode: string) => Promise<boolean>;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
}

export const usePincodeStore = create<PincodeState>((set, get) => ({
  // Existing state
  loaded: false,
  validPincodes: new Set<string>(),
  detailsCache: {},
  
  // New state
  pincodes: [],
  loading: false,
  error: null,
  currentPage: 1,
  searchQuery: '',
  totalCount: 0,
  itemsPerPage: 10,

  loadPincodes: async () => {
    if (get().loaded) return;
    try {
      console.log("📂 Loading pincodes from JSON...");
      const res = await fetch("/pincodes.json");
      if (!res.ok) {
        throw new Error(`Failed to load pincodes.json: ${res.status}`);
      }
      const data = (await res.json()) as string[];
      console.log("📊 Loaded pincodes count:", data.length);
      set({
        validPincodes: new Set(data.map((p) => String(p).trim())),
        loaded: true,
      });
      console.log("✅ Pincodes loaded successfully");
    } catch (error) {
      console.error("Error loading pincodes:", error);
      // mark as loaded so we don't infinitely retry; the app can still fetch details on demand
      set({ loaded: true });
    }
  },

  isValidPincode: (pin: string) => {
    if (!pin) return false;
    const cleaned = String(pin).trim();
    return get().validPincodes.has(cleaned);
  },

  fetchDetails: async (pin: string) => {
    if (!pin) return null;
    const cleaned = String(pin).trim();
    const { detailsCache } = get();

    if (detailsCache[cleaned] !== undefined) {
      return detailsCache[cleaned];
    }

    try {
      const { data, error } = await supabase
        .from("pincodes")
        .select("*")
        .eq("pincode", cleaned)
        .single();

      if (error) throw error;

      const details = data as PincodeDetails;
      set({
        detailsCache: {
          ...detailsCache,
          [cleaned]: details,
        },
      });
      return details;
    } catch (error) {
      console.error("Error fetching pincode details:", error);
      set({
        detailsCache: {
          ...detailsCache,
          [cleaned]: null,
        },
      });
      return null;
    }
  },

  // Fetch paginated pincodes with search
  fetchPincodes: async (page = 1, search = '') => {
    set({ loading: true, error: null });
    try {
      const from = (page - 1) * get().itemsPerPage;
      const to = from + get().itemsPerPage - 1;
      
      let query = supabase
        .from('pincodes')
        .select('*', { count: 'exact' });
      
      if (search) {
        query = query.or(`pincode.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      // Update cache with fetched pincodes
      const newCache = { ...get().detailsCache };
      data.forEach(pincode => {
        newCache[pincode.pincode] = pincode as PincodeDetails;
      });
      
      set({
        pincodes: data as PincodeDetails[],
        totalCount: count || 0,
        detailsCache: newCache,
        currentPage: page,
        searchQuery: search,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching pincodes:', error);
      set({
        error: 'Failed to load pincodes',
        loading: false,
      });
    }
  },
  
  // Create a new pincode
  createPincode: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: newPincode, error } = await supabase
        .from('pincodes')
        .insert([{ ...data, updated_at: new Date().toISOString() }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update cache and pincodes list
      const { pincodes, detailsCache } = get();
      const updatedCache = {
        ...detailsCache,
        [newPincode.pincode]: newPincode as PincodeDetails,
      };
      
      set({
        pincodes: [newPincode, ...pincodes],
        detailsCache: updatedCache,
        loading: false,
      });
      
      return newPincode as PincodeDetails;
    } catch (error) {
      console.error('Error creating pincode:', error);
      set({
        error: 'Failed to create pincode',
        loading: false,
      });
      throw error;
    }
  },
  
  // Update an existing pincode
  updatePincode: async (pincode, updates) => {
    set({ loading: true, error: null });
    try {
      const { data: updatedPincode, error } = await supabase
        .from('pincodes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('pincode', pincode)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update cache and pincodes list
      const { pincodes, detailsCache } = get();
      const updatedCache = {
        ...detailsCache,
        [pincode]: updatedPincode as PincodeDetails,
      };
      
      set({
        pincodes: pincodes.map(p => 
          p.pincode === pincode ? updatedPincode : p
        ) as PincodeDetails[],
        detailsCache: updatedCache,
        loading: false,
      });
      
      return updatedPincode as PincodeDetails;
    } catch (error) {
      console.error('Error updating pincode:', error);
      set({
        error: 'Failed to update pincode',
        loading: false,
      });
      throw error;
    }
  },
  
  // Delete a pincode
  deletePincode: async (pincode) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('pincodes')
        .delete()
        .eq('pincode', pincode);
      
      if (error) throw error;
      
      // Update cache and pincodes list
      const { pincodes, detailsCache } = get();
      const { [pincode]: _, ...updatedCache } = detailsCache;
      
      set({
        pincodes: pincodes.filter(p => p.pincode !== pincode),
        detailsCache: updatedCache,
        loading: false,
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting pincode:', error);
      set({
        error: 'Failed to delete pincode',
        loading: false,
      });
      return false;
    }
  },
  
  // Utility methods
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
