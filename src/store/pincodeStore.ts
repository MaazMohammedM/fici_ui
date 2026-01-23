// src/store/pincodeStore.ts
import { create } from 'zustand';
import { supabase } from '@lib/supabase';

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

export type BulkPincodeUpdateRequest = {
  field:
    | 'is_serviceable'
    | 'cod_allowed'
    | 'active'
    | 'delivery_time'
    | 'min_order_amount'
    | 'shipping_fee'
    | 'cod_fee'
    | 'free_shipping_threshold';
  value: boolean | string | number;
  scope: 'all' | 'state' | 'city' | 'single_pincode' | 'multiple_pincodes';
  state?: string;
  city?: string;
  pincode?: string;
  pincodes?: string[];
  isNullCondition?: boolean;
};

interface PincodeState {
  // Basic state
  loaded: boolean;
  validPincodes: Set<string>;
  detailsCache: Record<string, PincodeDetails | null>;

  // List state
  pincodes: PincodeDetails[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  searchQuery: string;
  totalCount: number;
  itemsPerPage: number;

  // Single pincode helpers
  loadPincodes: () => Promise<void>;
  isValidPincode: (pin: string) => boolean;
  fetchDetails: (pin: string) => Promise<PincodeDetails | null>;

  // CRUD
  fetchPincodes: (page?: number, search?: string) => Promise<void>;
  createPincode: (
    data: Omit<PincodeDetails, 'created_at' | 'updated_at'>
  ) => Promise<PincodeDetails>;
  updatePincode: (
    pincode: string,
    data: Partial<PincodeDetails>
  ) => Promise<PincodeDetails>;
  deletePincode: (pincode: string) => Promise<boolean>;

  // Bulk operations
  bulkUpdatePincodes: (
    request: BulkPincodeUpdateRequest
  ) => Promise<{ updatedCount: number; error?: string; message?: string }>;
  getBulkUpdateCount: (request: Omit<BulkPincodeUpdateRequest, 'value'>) => Promise<number>;

  // Serviceability check
  checkServiceabilityAvailable: () => Promise<boolean>;

  // UI helpers
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
}

export const usePincodeStore = create<PincodeState>((set, get) => ({
  // Initial state
  loaded: false,
  validPincodes: new Set<string>(),
  detailsCache: {},
  pincodes: [],
  loading: false,
  error: null,
  currentPage: 1,
  searchQuery: '',
  totalCount: 0,
  itemsPerPage: 10,

  // Load pincodes from JSON for client-side validation
  loadPincodes: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch('/pincodes.json');
      if (!res.ok) {
        throw new Error(`Failed to load pincodes.json: ${res.status}`);
      }
      const data = (await res.json()) as string[];
      set({
        validPincodes: new Set(data.map((p) => String(p).trim())),
        loaded: true,
      });
    } catch (error) {
      // mark as loaded so we don't infinitely retry
      set({ loaded: true });
    }
  },

  isValidPincode: (pin: string) => {
    if (!pin) return false;
    const cleaned = String(pin).trim();
    return get().validPincodes.has(cleaned);
  },

  // Fetch single pincode details from Supabase and cache
  fetchDetails: async (pin: string) => {
    if (!pin) return null;
    const cleaned = String(pin).trim();
    const { detailsCache } = get();

    if (detailsCache[cleaned] !== undefined) {
      return detailsCache[cleaned];
    }

    try {
      const { data, error } = await supabase
        .from('pincodes')
        .select('*')
        .eq('pincode', cleaned)
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
      console.error('Error fetching pincode details:', error);
      set({
        detailsCache: {
          ...detailsCache,
          [cleaned]: null,
        },
      });
      return null;
    }
  },

  // Fetch paginated pincodes (with optional search)
  fetchPincodes: async (page = 1, search = '') => {
    set({ loading: true, error: null });
    try {
      const { itemsPerPage, detailsCache } = get();
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase.from('pincodes').select('*', { count: 'exact' });

      if (search) {
        query = query.or(
          `pincode.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newCache = { ...detailsCache };
      (data || []).forEach((pincode) => {
        newCache[pincode.pincode] = pincode as PincodeDetails;
      });

      set({
        pincodes: (data || []) as PincodeDetails[],
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

      const { pincodes, detailsCache } = get();
      const updatedCache = {
        ...detailsCache,
        [pincode]: updatedPincode as PincodeDetails,
      };

      set({
        pincodes: pincodes.map((p) =>
          p.pincode === pincode ? (updatedPincode as PincodeDetails) : p
        ),
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
      const { error } = await supabase.from('pincodes').delete().eq('pincode', pincode);

      if (error) throw error;

      const { pincodes, detailsCache } = get();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [pincode]: _removed, ...updatedCache } = detailsCache;

      set({
        pincodes: pincodes.filter((p) => p.pincode !== pincode),
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
  bulkUpdatePincodes: async (request: BulkPincodeUpdateRequest) => {
    set({ loading: true, error: null });

    try {
      type UpdatableFields = Pick<
        PincodeDetails,
        | 'is_serviceable'
        | 'cod_allowed'
        | 'active'
        | 'delivery_time'
        | 'min_order_amount'
        | 'shipping_fee'
        | 'cod_fee'
        | 'free_shipping_threshold'
      >;

      type UpdateData = Partial<UpdatableFields> & { updated_at: string };

      const updateData: UpdateData = {
        updated_at: new Date().toISOString(),
      };

      // --- 1) Normalize value to correct JS type ---
      let processedValue: boolean | string | number | null =
        request.value as boolean | string | number;

      if (['is_serviceable', 'cod_allowed', 'active'].includes(request.field)) {
        if (typeof processedValue === 'string') {
          processedValue = processedValue.toLowerCase() === 'true';
        }
      } else if (
        ['min_order_amount', 'shipping_fee', 'cod_fee', 'free_shipping_threshold'].includes(
          request.field
        )
      ) {
        if (typeof processedValue === 'string') {
          const parsed = parseFloat(processedValue);
          processedValue = Number.isNaN(parsed) ? null : parsed;
        }
      }

      (updateData as any)[request.field] = processedValue;

      // --- 2) Helper: add IS NULL / IS NOT NULL filter when requested ---
      const buildWhereClause = (
        baseQuery: any,
        field: string,
        isNullCondition?: boolean
      ) => {
        if (isNullCondition === true) {
          // WHERE field IS NULL
          return baseQuery.is(field, null);
        }
        if (isNullCondition === false) {
          // WHERE field IS NOT NULL
          return baseQuery.not(field, 'is', null);
        }
        // No null-related condition
        return baseQuery;
      };

      // --- 3) Build UPDATE query by scope ---
      let updateQuery: any;

      switch (request.scope) {
        case 'all':
          updateQuery = buildWhereClause(
            supabase.from('pincodes').update(updateData),
            request.field,
            request.isNullCondition
          );
          break;

        case 'state':
          if (!request.state) {
            throw new Error('State is required for state scope');
          }
          updateQuery = buildWhereClause(
            supabase.from('pincodes').update(updateData).eq('state', request.state),
            request.field,
            request.isNullCondition
          );
          break;

        case 'city':
          if (!request.city) {
            throw new Error('City is required for city scope');
          }
          updateQuery = buildWhereClause(
            supabase.from('pincodes').update(updateData).eq('city', request.city),
            request.field,
            request.isNullCondition
          );
          break;

        case 'single_pincode':
          if (!request.pincode) {
            throw new Error('Pincode is required for single_pincode scope');
          }
          updateQuery = buildWhereClause(
            supabase.from('pincodes').update(updateData).eq('pincode', request.pincode),
            request.field,
            request.isNullCondition
          );
          break;

        case 'multiple_pincodes':
          if (!request.pincodes || request.pincodes.length === 0) {
            throw new Error('Pincodes are required for multiple_pincodes scope');
          }
          updateQuery = buildWhereClause(
            supabase.from('pincodes').update(updateData).in('pincode', request.pincodes),
            request.field,
            request.isNullCondition
          );
          break;

        default:
          throw new Error('Invalid scope specified');
      }

      // --- 4) Execute update (one round-trip) ---
      const { data, error } = await updateQuery.select('pincode').throwOnError();

      if (error) throw error;

      const updatedCount = data ? data.length : 0;

      // --- 5) Update local cache for affected pincodes ---
      const { detailsCache } = get();
      const updatedCache = { ...detailsCache };

      if (data) {
        data.forEach((row: { pincode: string }) => {
          const pin = row.pincode;
          if (updatedCache[pin]) {
            updatedCache[pin] = {
              ...updatedCache[pin]!,
              ...(updateData as Partial<PincodeDetails>),
            };
          }
        });
      }

      set({
        detailsCache: updatedCache,
        loading: false,
      });

      return {
        updatedCount,
        message: `Successfully updated ${updatedCount} pincodes`,
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update pincodes',
        loading: false,
      });

      return {
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Failed to update pincodes',
      };
    }
  },

  // Get count for bulk update preview
  getBulkUpdateCount: async (request: Omit<BulkPincodeUpdateRequest, 'value'>) => {
    try {
      const buildWhereClause = (
        baseQuery: any,
        field: string,
        isNullCondition?: boolean
      ) => {
        if (isNullCondition === true) {
          return baseQuery.is(field, null);
        }
        if (isNullCondition === false) {
          return baseQuery.not(field, 'is', null);
        }
        return baseQuery;
      };

      let query: any;

      switch (request.scope) {
        case 'all':
          query = buildWhereClause(
            supabase.from('pincodes').select('*', { count: 'exact', head: true }),
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
            throw new Error('Pincode is required for single_pincode scope');
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
            throw new Error('Pincodes are required for multiple_pincodes scope');
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

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting bulk update count:', error);
      throw error;
    }
  },

  // Serviceability check
  checkServiceabilityAvailable: async () => {
    try {
      // Use limit(1) instead of head:true for better Supabase compatibility
      const { data, error, count } = await supabase
        .from('pincodes')
        .select('pincode', { count: 'exact' })
        .eq('is_serviceable', true)
        .limit(1);

      if (error) throw error;

      // Check if we have any results or count > 0
      return (count !== null && count > 0) || (data && data.length > 0);
    } catch (error) {
      console.error('Error checking serviceability availability:', error);
      // On error, assume serviceability is available to avoid blocking users unnecessarily
      return true;
    }
  },

  // UI helpers
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));