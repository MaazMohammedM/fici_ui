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
  
  // New bulk update method
  bulkUpdatePincodes: (request: BulkPincodeUpdateRequest) => Promise<{ updatedCount: number; error?: string }>;
  
  // New method to get count for preview
  getBulkUpdateCount: (request: Omit<BulkPincodeUpdateRequest, 'value'>) => Promise<number>;
}

export type BulkPincodeUpdateRequest = {
  field: 'is_serviceable' | 'cod_allowed' | 'active' | 'delivery_time' | 'min_order_amount' | 'shipping_fee' | 'cod_fee' | 'free_shipping_threshold';
  value: boolean | string | number;
  scope: 'all' | 'state' | 'city' | 'single_pincode' | 'multiple_pincodes';
  state?: string;
  city?: string;
  pincode?: string;
  pincodes?: string[];
  isNullCondition?: boolean; // true for updating null fields, false for updating non-null fields
};

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
  
  // Bulk update pincodes
  bulkUpdatePincodes: async (request) => {
    set({ loading: true, error: null });
    
    try {
      // Build the update data first
      const updateData: any = {};
      
      // Convert field values to proper types
      let processedValue = request.value;
      
      // Handle boolean fields
      if (['is_serviceable', 'cod_allowed', 'active'].includes(request.field)) {
        if (typeof request.value === 'string') {
          processedValue = request.value.toLowerCase() === 'true';
        }
      }
      // Handle numeric fields
      else if (['min_order_amount', 'shipping_fee', 'cod_fee', 'free_shipping_threshold'].includes(request.field)) {
        if (typeof request.value === 'string') {
          processedValue = parseFloat(request.value);
          if (isNaN(processedValue)) {
            processedValue = null;
          }
        }
      }
      
      updateData[request.field] = processedValue;
      updateData.updated_at = new Date().toISOString();
      
      // Debug logging
      console.log('Bulk Update Debug:', {
        field: request.field,
        originalValue: request.value,
        processedValue: processedValue,
        updateData: updateData,
        isNullCondition: request.isNullCondition
      });
      
      // Build the update query based on scope
      let query: any;
      
      // Build where clause based on field null/not null condition
      const buildWhereClause = (baseQuery: any, field: string, isNullCondition: boolean) => {
        if (isNullCondition) {
          return baseQuery.is(field, null);
        } else {
          return baseQuery.not(field, 'is', null);
        }
      };

      switch (request.scope) {
        case 'all':
          // Update all pincodes with field null/not null condition
          query = buildWhereClause(
            supabase.from('pincodes').update(updateData),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'state':
          if (!request.state) {
            throw new Error('State is required for state scope');
          }
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .update(updateData)
              .eq('state', request.state),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'city':
          if (!request.city) {
            throw new Error('City is required for city scope');
          }
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .update(updateData)
              .eq('city', request.city),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'single_pincode':
          if (!request.pincode) {
            throw new Error('Pincode is required for single pincode scope');
          }
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .update(updateData)
              .eq('pincode', request.pincode),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'multiple_pincodes':
          if (!request.pincodes || request.pincodes.length === 0) {
            throw new Error('Pincodes are required for multiple pincodes scope');
          }
          // Use single query with .in() for multiple pincodes
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .update(updateData)
              .in('pincode', request.pincodes),
            request.field,
            request.isNullCondition
          );
          break;
          
        default:
          throw new Error('Invalid scope specified');
      }
      
      // Execute the update and get count
      console.log('Executing query with scope:', request.scope);
      const { data, error, count } = await (query as any)
        .select('pincode')
        .throwOnError();
      
      console.log('Query Results:', { data, error, count });
      
      if (error) throw error;
      
      // For update operations, count might not be returned, so use data length
      const updatedCount = count || (data ? data.length : 0);
      
      // Update cache for affected pincodes
      const { detailsCache } = get();
      const updatedCache = { ...detailsCache };
      
      if (data) {
        data.forEach((pincode: any) => {
          if (updatedCache[pincode.pincode]) {
            updatedCache[pincode.pincode] = {
              ...updatedCache[pincode.pincode],
              ...updateData
            };
          }
        });
      }
      
      set({
        detailsCache: updatedCache,
        loading: false,
      });
      
      return {
        updatedCount: updatedCount
      };
      
    } catch (error) {
      console.error('Error in bulk update:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update pincodes',
        loading: false,
      });
      
      return {
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Failed to update pincodes'
      };
    }
  },
  
  // Get count for bulk update preview (efficient count-only query)
  getBulkUpdateCount: async (request) => {
    try {
      let query: any;
      
      // Build where clause based on field null/not null condition
      const buildWhereClause = (baseQuery: any, field: string, isNullCondition: boolean) => {
        if (isNullCondition) {
          return baseQuery.is(field, null);
        } else {
          return baseQuery.not(field, 'is', null);
        }
      };
      
      switch (request.scope) {
        case 'all':
          // Count all pincodes with field null/not null condition
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .select('*', { count: 'exact', head: true }),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'state':
          if (!request.state) {
            throw new Error('State is required for state scope');
          }
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .select('*', { count: 'exact', head: true })
              .eq('state', request.state),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'city':
          if (!request.city) {
            throw new Error('City is required for city scope');
          }
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .select('*', { count: 'exact', head: true })
              .eq('city', request.city),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'single_pincode':
          if (!request.pincode) {
            throw new Error('Pincode is required for single pincode scope');
          }
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .select('*', { count: 'exact', head: true })
              .eq('pincode', request.pincode),
            request.field,
            request.isNullCondition
          );
          break;
          
        case 'multiple_pincodes':
          if (!request.pincodes || request.pincodes.length === 0) {
            throw new Error('Pincodes are required for multiple pincodes scope');
          }
          query = buildWhereClause(
            supabase
              .from('pincodes')
              .select('*', { count: 'exact', head: true })
              .in('pincode', request.pincodes),
            request.field,
            request.isNullCondition
          );
          break;
          
        default:
          throw new Error('Invalid scope specified');
      }
      
      // Execute the count query
      const { count, error } = await query;
      
      if (error) throw error;
      
      return count || 0;
      
    } catch (error) {
      console.error('Error getting bulk update count:', error);
      throw error;
    }
  },
  
  // Utility methods
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
