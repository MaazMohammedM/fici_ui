import { create } from 'zustand';
import { supabase } from '@lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  cod_fees_applicable: boolean;
  is_returnable: boolean;
  is_exchangeable: boolean;
  return_window_days: number;
  exchange_window_days: number;
  created_at?: string;
  updated_at?: string;
}

/** Shape of a single record in /pincodes.json */
interface PincodeJsonRecord {
  pincode: number | string;
  city: string;
  state: string;
  is_serviceable?: boolean;
  cod_allowed?: boolean;
  delivery_time?: string;
  districts?: string | string[];
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
    | 'free_shipping_threshold'
    | 'cod_fees_applicable'
    | 'is_returnable'
    | 'is_exchangeable'
    | 'return_window_days'
    | 'exchange_window_days';
  value: boolean | string | number;
  scope: 'all' | 'state' | 'city' | 'single_pincode' | 'multiple_pincodes';
  state?: string;
  city?: string;
  pincode?: string;
  pincodes?: string[];
  isNullCondition?: boolean;
};

// ─── Module-level cache for JSON data ────────────────────────────────────────
// Keeps the parsed JSON in memory after the first fetch so every
// getStatesFromJson() / getCitiesFromJson() call is synchronous thereafter.

let _jsonRecords: PincodeJsonRecord[] | null = null;

const ensureJsonLoaded = async (): Promise<PincodeJsonRecord[]> => {
  if (_jsonRecords) return _jsonRecords;
  const res = await fetch('/pincodes_frontend.json');
  if (!res.ok) throw new Error(`Failed to load pincodes_frontend.json: ${res.status}`);
  const data = await res.json();
  _jsonRecords = data as PincodeJsonRecord[];
  return _jsonRecords;
};

// ─── Public helpers (fetch from JSON) ────────────────────────────────────────

/**
 * Returns a sorted, deduplicated list of states from pincodes_frontend.json (uppercase).
 * Also merges the canonical Indian states list so the dropdown is always complete.
 */
export const getStatesFromJson = async (): Promise<string[]> => {
  try {
    const records = await ensureJsonLoaded();
    const fromJson = records.map((r) => String(r.state).trim().toUpperCase()).filter(Boolean);
    const merged = Array.from(new Set([...fromJson, ...ALL_INDIAN_STATES])).sort();
    return merged;
  } catch (error) {
    console.error('Error fetching states from JSON:', error);
    // Fallback to canonical states only
    return [...ALL_INDIAN_STATES].sort();
  }
};

/**
 * Returns all cities from pincodes_frontend.json (original casing, sorted).
 * If `state` is provided, filters to that state only (case-insensitive).
 */
export const getCitiesFromJson = async (state?: string): Promise<string[]> => {
  try {
    const records = await ensureJsonLoaded();
    const filtered = state
      ? records.filter((r) => String(r.state).trim().toUpperCase() === state.trim().toUpperCase())
      : records;
    const cities = filtered.map((r) => String(r.city).trim()).filter(Boolean);
    return Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Error fetching cities from JSON:', error);
    return [];
  }
};

// ─── Canonical state list (fallback/merge) ────────────────────────────────────

export const ALL_INDIAN_STATES: string[] = [
  'ANDAMAN AND NICOBAR ISLANDS', 'ANDHRA PRADESH', 'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR',
  'CHANDIGARH', 'CHHATTISGARH', 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 'DELHI', 'GOA',
  'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JAMMU AND KASHMIR', 'JHARKHAND', 'KARNATAKA',
  'KERALA', 'LADAKH', 'LAKSHADWEEP', 'MADHYA PRADESH', 'MAHARASHTRA', 'MANIPUR', 'MEGHALAYA',
  'MIZORAM', 'NAGALAND', 'ODISHA', 'PUDUCHERRY', 'PUNJAB', 'RAJASTHAN', 'SIKKIM', 'TAMIL NADU',
  'TELANGANA', 'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 'TRIPURA', 'UTTAR PRADESH',
  'UTTARAKHAND', 'WEST BENGAL',
];

// ─── Store interface ──────────────────────────────────────────────────────────

interface PincodeState {
  loaded: boolean;
  validPincodes: Set<string>;
  detailsCache: Record<string, PincodeDetails | null>;

  pincodes: PincodeDetails[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  searchQuery: string;
  totalCount: number;
  itemsPerPage: number;

  loadPincodes: () => Promise<void>;
  isValidPincode: (pin: string) => boolean;
  fetchDetails: (pin: string) => Promise<PincodeDetails | null>;

  fetchPincodes: (page?: number, search?: string) => Promise<void>;
  createPincode: (data: Omit<PincodeDetails, 'created_at' | 'updated_at'>) => Promise<PincodeDetails>;
  updatePincode: (pincode: string, data: Partial<PincodeDetails>) => Promise<PincodeDetails>;
  deletePincode: (pincode: string) => Promise<boolean>;

  bulkUpdatePincodes: (request: BulkPincodeUpdateRequest) => Promise<{ updatedCount: number; error?: string; message?: string }>;
  getBulkUpdateCount: (request: Omit<BulkPincodeUpdateRequest, 'value'>) => Promise<number>;

  genericBulkUpdate: (
    filters: Record<string, unknown>,
    updates: Record<string, unknown>,
    dryRun?: boolean
  ) => Promise<{ affectedCount: number; error?: string; samplePincodes?: string[]; dryRun?: boolean }>;

  applyPincodeFilters: <T>(query: T, filters: Record<string, unknown>) => T;
  checkServiceabilityAvailable: () => Promise<boolean>;

  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const usePincodeStore = create<PincodeState>((set, get) => ({
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

  // ── Load pincodes for client-side validation ───────────────────────────────
  loadPincodes: async () => {
    if (get().loaded) return;
    try {
      const records = await ensureJsonLoaded();
      const pins = records.map((r) => String(r.pincode).trim());
      set({ validPincodes: new Set(pins), loaded: true });
    } catch {
      set({ loaded: true }); // mark loaded so we don't retry infinitely
    }
  },

  isValidPincode: (pin: string) => {
    if (!pin) return false;
    return get().validPincodes.has(String(pin).trim());
  },

  // ── Fetch single pincode details from Supabase ────────────────────────────
  fetchDetails: async (pin: string) => {
    if (!pin) return null;
    const cleaned = String(pin).trim();
    const { detailsCache } = get();
    if (detailsCache[cleaned] !== undefined) return detailsCache[cleaned];

    try {
      const { data, error } = await supabase.from('pincodes').select('*').eq('pincode', cleaned).single();
      if (error) throw error;
      const details = data as PincodeDetails;
      set({ detailsCache: { ...detailsCache, [cleaned]: details } });
      return details;
    } catch {
      set({ detailsCache: { ...detailsCache, [cleaned]: null } });
      return null;
    }
  },

  // ── Paginated list ────────────────────────────────────────────────────────
  fetchPincodes: async (page = 1, search = '') => {
    set({ loading: true, error: null });
    try {
      const { itemsPerPage, detailsCache } = get();
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase.from('pincodes').select('*', { count: 'exact' });
      if (search) {
        query = query.or(`pincode.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;

      const newCache = { ...detailsCache };
      (data ?? []).forEach((p) => { newCache[p.pincode] = p as PincodeDetails; });

      set({ pincodes: (data ?? []) as PincodeDetails[], totalCount: count ?? 0, detailsCache: newCache, currentPage: page, searchQuery: search, loading: false });
    } catch {
      set({ error: 'Failed to load pincodes', loading: false });
    }
  },

  // ── CRUD ──────────────────────────────────────────────────────────────────
  createPincode: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: row, error } = await supabase.from('pincodes').insert([{ ...data, updated_at: new Date().toISOString() }]).select().single();
      if (error) throw error;
      const { pincodes, detailsCache } = get();
      set({ pincodes: [row, ...pincodes], detailsCache: { ...detailsCache, [row.pincode]: row as PincodeDetails }, loading: false });
      return row as PincodeDetails;
    } catch (error) {
      set({ error: 'Failed to create pincode', loading: false });
      throw error;
    }
  },

  updatePincode: async (pincode, updates) => {
    set({ loading: true, error: null });
    try {
      const { data: row, error } = await supabase.from('pincodes').update({ ...updates, updated_at: new Date().toISOString() }).eq('pincode', pincode).select().single();
      if (error) throw error;
      const { pincodes, detailsCache } = get();
      set({
        pincodes: pincodes.map((p) => (p.pincode === pincode ? (row as PincodeDetails) : p)),
        detailsCache: { ...detailsCache, [pincode]: row as PincodeDetails },
        loading: false,
      });
      return row as PincodeDetails;
    } catch (error) {
      set({ error: 'Failed to update pincode', loading: false });
      throw error;
    }
  },

  deletePincode: async (pincode) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('pincodes').delete().eq('pincode', pincode);
      if (error) throw error;
      const { pincodes, detailsCache } = get();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [pincode]: _removed, ...updatedCache } = detailsCache;
      set({ pincodes: pincodes.filter((p) => p.pincode !== pincode), detailsCache: updatedCache, loading: false });
      return true;
    } catch {
      set({ error: 'Failed to delete pincode', loading: false });
      return false;
    }
  },

  // ── bulkUpdatePincodes (simple scope-based) ───────────────────────────────
  bulkUpdatePincodes: async (request) => {
    set({ loading: true, error: null });
    try {
      type UpdateData = Partial<PincodeDetails> & { updated_at: string };
      const updateData: UpdateData = { updated_at: new Date().toISOString() };

      let processedValue: boolean | string | number | null = request.value as boolean | string | number;

      if (['is_serviceable', 'cod_allowed', 'active', 'cod_fees_applicable'].includes(request.field)) {
        if (typeof processedValue === 'string') processedValue = processedValue.toLowerCase() === 'true';
      } else if (['min_order_amount', 'shipping_fee', 'cod_fee', 'free_shipping_threshold'].includes(request.field)) {
        if (typeof processedValue === 'string') {
          const parsed = parseFloat(processedValue);
          processedValue = Number.isNaN(parsed) ? null : parsed;
        }
      }

      (updateData as Record<string, unknown>)[request.field] = processedValue;

      let query = supabase.from('pincodes').update(updateData);

      switch (request.scope) {
        case 'all':
          // No filter - update all
          break;
        case 'state':
          if (!request.state) throw new Error('State is required for state scope');
          query = query.eq('state', request.state);
          break;
        case 'city':
          if (!request.city) throw new Error('City is required for city scope');
          query = query.eq('city', request.city);
          break;
        case 'single_pincode':
          if (!request.pincode) throw new Error('Pincode is required for single_pincode scope');
          query = query.eq('pincode', request.pincode);
          break;
        case 'multiple_pincodes':
          if (!request.pincodes?.length) throw new Error('Pincodes are required for multiple_pincodes scope');
          query = query.in('pincode', request.pincodes);
          break;
        default:
          throw new Error('Invalid scope specified');
      }

      const { data, error } = await query.select('pincode');
      if (error) throw error;

      const updatedCount = (data as { pincode: string }[])?.length ?? 0;
      const { detailsCache } = get();
      const updatedCache = { ...detailsCache };
      (data as { pincode: string }[] ?? []).forEach((row) => {
        if (updatedCache[row.pincode]) {
          updatedCache[row.pincode] = { ...updatedCache[row.pincode]!, ...(updateData as Partial<PincodeDetails>) };
        }
      });

      set({ detailsCache: updatedCache, loading: false });
      return { updatedCount, message: `Successfully updated ${updatedCount} pincodes` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update pincodes';
      set({ error: msg, loading: false });
      return { updatedCount: 0, error: msg };
    }
  },

  // ── getBulkUpdateCount ────────────────────────────────────────────────────
  getBulkUpdateCount: async (request) => {
    try {
      let query = supabase.from('pincodes').select('*', { count: 'exact', head: true });

      switch (request.scope) {
        case 'all':
          // No filter - count all
          break;
        case 'state':
          if (!request.state) throw new Error('State required');
          query = query.eq('state', request.state);
          break;
        case 'city':
          if (!request.city) throw new Error('City required');
          query = query.eq('city', request.city);
          break;
        case 'single_pincode':
          if (!request.pincode) throw new Error('Pincode required');
          query = query.eq('pincode', request.pincode);
          break;
        case 'multiple_pincodes':
          if (!request.pincodes?.length) throw new Error('Pincodes required');
          query = query.in('pincode', request.pincodes);
          break;
        default:
          throw new Error('Invalid scope');
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      console.error('Error getting bulk update count:', error);
      throw error;
    }
  },

  // ── genericBulkUpdate ─────────────────────────────────────────────────────
  genericBulkUpdate: async (filters, updates, dryRun = false) => {
    set({ loading: !dryRun, error: null });

    try {
      const f = filters as Record<string, unknown>;
      
      console.log('=== BULK UPDATE DEBUG ===');
      console.log('Filters received:', JSON.stringify(filters, null, 2));
      console.log('Updates received:', JSON.stringify(updates, null, 2));
      console.log('Dry run:', dryRun);

      // ── 1. Build query with filters ──────────────────────────────────────
      // Don't use head: true initially to see if data is returned
      let query = supabase.from('pincodes').select('pincode', { count: 'exact' });

      // Geographic filters
      if (Array.isArray(f.states) && f.states.length > 0) {
        console.log('Applying states filter:', f.states);
        query = query.in('state', f.states as string[]);
      }
      if (Array.isArray(f.cities) && f.cities.length > 0) {
        console.log('Applying cities filter:', f.cities);
        query = query.in('city', f.cities as string[]);
      }
      if (Array.isArray(f.pincodes) && f.pincodes.length > 0) {
        console.log('Applying pincodes filter:', f.pincodes);
        query = query.in('pincode', f.pincodes as string[]);
      }
      if (Array.isArray(f.districts) && f.districts.length > 0) {
        console.log('Applying districts filter:', f.districts);
        query = query.contains('districts', f.districts as string[]);
      }

      // Boolean filters
      console.log('Boolean filter values:');
      console.log('  active:', f.active, 'type:', typeof f.active);
      console.log('  is_serviceable:', f.is_serviceable, 'type:', typeof f.is_serviceable);
      console.log('  cod_allowed:', f.cod_allowed, 'type:', typeof f.cod_allowed);
      console.log('  cod_fees_applicable:', f.cod_fees_applicable, 'type:', typeof f.cod_fees_applicable);
      console.log('  is_returnable:', f.is_returnable, 'type:', typeof f.is_returnable);
      console.log('  is_exchangeable:', f.is_exchangeable, 'type:', typeof f.is_exchangeable);
      
      if (typeof f.active === 'boolean') {
        console.log('Applying active filter:', f.active);
        query = query.eq('active', f.active);
      }
      if (typeof f.is_serviceable === 'boolean') {
        console.log('Applying is_serviceable filter:', f.is_serviceable);
        query = query.eq('is_serviceable', f.is_serviceable);
      }
      if (typeof f.cod_allowed === 'boolean') {
        console.log('Applying cod_allowed filter:', f.cod_allowed);
        query = query.eq('cod_allowed', f.cod_allowed);
      }
      if (typeof f.cod_fees_applicable === 'boolean') {
        console.log('Applying cod_fees_applicable filter:', f.cod_fees_applicable);
        query = query.eq('cod_fees_applicable', f.cod_fees_applicable);
      }
      if (typeof f.is_returnable === 'boolean') {
        console.log('Applying is_returnable filter:', f.is_returnable);
        query = query.eq('is_returnable', f.is_returnable);
      }
      if (typeof f.is_exchangeable === 'boolean') {
        console.log('Applying is_exchangeable filter:', f.is_exchangeable);
        query = query.eq('is_exchangeable', f.is_exchangeable);
      }

      // Numeric comparison filters
      if (f.shipping_fee_gt !== undefined) query = query.gt('shipping_fee', f.shipping_fee_gt);
      if (f.shipping_fee_lt !== undefined) query = query.lt('shipping_fee', f.shipping_fee_lt);
      if (f.shipping_fee_eq !== undefined) query = query.eq('shipping_fee', f.shipping_fee_eq);
      if (f.cod_fee_gt !== undefined) query = query.gt('cod_fee', f.cod_fee_gt);
      if (f.cod_fee_lt !== undefined) query = query.lt('cod_fee', f.cod_fee_lt);
      if (f.cod_fee_eq !== undefined) query = query.eq('cod_fee', f.cod_fee_eq);
      if (f.free_shipping_threshold_gt !== undefined) query = query.gt('free_shipping_threshold', f.free_shipping_threshold_gt);
      if (f.free_shipping_threshold_lt !== undefined) query = query.lt('free_shipping_threshold', f.free_shipping_threshold_lt);
      if (f.free_shipping_threshold_eq !== undefined) query = query.eq('free_shipping_threshold', f.free_shipping_threshold_eq);
      if (f.min_order_amount_gt !== undefined) query = query.gt('min_order_amount', f.min_order_amount_gt);
      if (f.min_order_amount_lt !== undefined) query = query.lt('min_order_amount', f.min_order_amount_lt);
      if (f.min_order_amount_eq !== undefined) query = query.eq('min_order_amount', f.min_order_amount_eq);
      if (f.return_window_days_gt !== undefined) query = query.gt('return_window_days', f.return_window_days_gt);
      if (f.return_window_days_lt !== undefined) query = query.lt('return_window_days', f.return_window_days_lt);
      if (f.return_window_days_eq !== undefined) query = query.eq('return_window_days', f.return_window_days_eq);
      if (f.exchange_window_days_gt !== undefined) query = query.gt('exchange_window_days', f.exchange_window_days_gt);
      if (f.exchange_window_days_lt !== undefined) query = query.lt('exchange_window_days', f.exchange_window_days_lt);
      if (f.exchange_window_days_eq !== undefined) query = query.eq('exchange_window_days', f.exchange_window_days_eq);

      // ── 2. Count matching rows ──────────────────────────────────────────
      console.log('Executing count query...');
      const { count: rawCount, data: countData, error: countError } = await query;
      console.log('Count result:', rawCount);
      console.log('Count data length:', countData?.length);
      console.log('Count error:', countError);
      console.log('Count data sample:', countData?.slice(0, 3));
      
      if (countError) throw countError;

      // Supabase sometimes returns null for count even when data is present
      // Use data length as fallback when count is null
      const totalCount = rawCount ?? (countData?.length ?? 0);
      console.log('Total count:', totalCount);

      // DEBUG: Check if there are any rows with cod_fees_applicable = true in the database
      if (totalCount === 0 && typeof f.cod_fees_applicable === 'boolean') {
        console.log('DEBUG: Checking database for rows with cod_fees_applicable =', f.cod_fees_applicable);
        const { count: debugCount, data: debugData, error: debugError } = await supabase
          .from('pincodes')
          .select('*', { count: 'exact' })
          .eq('cod_fees_applicable', f.cod_fees_applicable);
        console.log('DEBUG count for cod_fees_applicable =', f.cod_fees_applicable, ':', debugCount);
        console.log('DEBUG data length:', debugData?.length);
        console.log('DEBUG error:', debugError);
        
        // Also check total rows in database
        const { count: totalRows, data: totalData, error: totalError } = await supabase
          .from('pincodes')
          .select('*', { count: 'exact' });
        console.log('DEBUG total rows in database:', totalRows);
        console.log('DEBUG total data length:', totalData?.length);
        console.log('DEBUG total error:', totalError);
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        console.log('DEBUG session:', session ? 'authenticated' : 'not authenticated');
      }

      if (totalCount === 0) {
        console.log('ERROR: No pincodes match the specified filters');
        set({ loading: false });
        return { affectedCount: 0, error: 'No pincodes match the specified filters', dryRun };
      }

      // ── 3. Fetch sample pincodes (up to 50) for preview ────────────────
      let sampleQuery = supabase.from('pincodes').select('pincode');
      if (Array.isArray(f.states) && f.states.length > 0) sampleQuery = sampleQuery.in('state', f.states as string[]);
      if (Array.isArray(f.cities) && f.cities.length > 0) sampleQuery = sampleQuery.in('city', f.cities as string[]);
      if (Array.isArray(f.pincodes) && f.pincodes.length > 0) sampleQuery = sampleQuery.in('pincode', f.pincodes as string[]);
      if (Array.isArray(f.districts) && f.districts.length > 0) sampleQuery = sampleQuery.contains('districts', f.districts as string[]);
      if (typeof f.active === 'boolean') sampleQuery = sampleQuery.eq('active', f.active);
      if (typeof f.is_serviceable === 'boolean') sampleQuery = sampleQuery.eq('is_serviceable', f.is_serviceable);
      if (typeof f.cod_allowed === 'boolean') sampleQuery = sampleQuery.eq('cod_allowed', f.cod_allowed);
      if (typeof f.cod_fees_applicable === 'boolean') sampleQuery = sampleQuery.eq('cod_fees_applicable', f.cod_fees_applicable);
      if (typeof f.is_returnable === 'boolean') sampleQuery = sampleQuery.eq('is_returnable', f.is_returnable);
      if (typeof f.is_exchangeable === 'boolean') sampleQuery = sampleQuery.eq('is_exchangeable', f.is_exchangeable);
      if (f.shipping_fee_gt !== undefined) sampleQuery = sampleQuery.gt('shipping_fee', f.shipping_fee_gt);
      if (f.shipping_fee_lt !== undefined) sampleQuery = sampleQuery.lt('shipping_fee', f.shipping_fee_lt);
      if (f.shipping_fee_eq !== undefined) sampleQuery = sampleQuery.eq('shipping_fee', f.shipping_fee_eq);
      if (f.cod_fee_gt !== undefined) sampleQuery = sampleQuery.gt('cod_fee', f.cod_fee_gt);
      if (f.cod_fee_lt !== undefined) sampleQuery = sampleQuery.lt('cod_fee', f.cod_fee_lt);
      if (f.cod_fee_eq !== undefined) sampleQuery = sampleQuery.eq('cod_fee', f.cod_fee_eq);
      if (f.free_shipping_threshold_gt !== undefined) sampleQuery = sampleQuery.gt('free_shipping_threshold', f.free_shipping_threshold_gt);
      if (f.free_shipping_threshold_lt !== undefined) sampleQuery = sampleQuery.lt('free_shipping_threshold', f.free_shipping_threshold_lt);
      if (f.free_shipping_threshold_eq !== undefined) sampleQuery = sampleQuery.eq('free_shipping_threshold', f.free_shipping_threshold_eq);
      if (f.min_order_amount_gt !== undefined) sampleQuery = sampleQuery.gt('min_order_amount', f.min_order_amount_gt);
      if (f.min_order_amount_lt !== undefined) sampleQuery = sampleQuery.lt('min_order_amount', f.min_order_amount_lt);
      if (f.min_order_amount_eq !== undefined) sampleQuery = sampleQuery.eq('min_order_amount', f.min_order_amount_eq);
      if (f.return_window_days_gt !== undefined) sampleQuery = sampleQuery.gt('return_window_days', f.return_window_days_gt);
      if (f.return_window_days_lt !== undefined) sampleQuery = sampleQuery.lt('return_window_days', f.return_window_days_lt);
      if (f.return_window_days_eq !== undefined) sampleQuery = sampleQuery.eq('return_window_days', f.return_window_days_eq);
      if (f.exchange_window_days_gt !== undefined) sampleQuery = sampleQuery.gt('exchange_window_days', f.exchange_window_days_gt);
      if (f.exchange_window_days_lt !== undefined) sampleQuery = sampleQuery.lt('exchange_window_days', f.exchange_window_days_lt);
      if (f.exchange_window_days_eq !== undefined) sampleQuery = sampleQuery.eq('exchange_window_days', f.exchange_window_days_eq);

      const { data: sampleData } = await sampleQuery.limit(50);
      const samplePincodes = (sampleData ?? []).map((p: { pincode: string }) => p.pincode);

      if (dryRun) {
        set({ loading: false });
        return { affectedCount: totalCount, samplePincodes, dryRun: true };
      }

      // ── 4. Safety confirmation for large batches ────────────────────────
      if (totalCount > 1000) {
        const ok = window.confirm(`You are about to update ${totalCount} pincodes. This is a large operation. Continue?`);
        if (!ok) {
          set({ loading: false });
          return { affectedCount: 0, error: 'Operation cancelled by user', dryRun };
        }
      }

      // ── 5. Execute update ───────────────────────────────────────────────
      const updatePayload = { ...updates, updated_at: new Date().toISOString() };
      let updateQuery = supabase.from('pincodes').update(updatePayload);
      if (Array.isArray(f.states) && f.states.length > 0) updateQuery = updateQuery.in('state', f.states as string[]);
      if (Array.isArray(f.cities) && f.cities.length > 0) updateQuery = updateQuery.in('city', f.cities as string[]);
      if (Array.isArray(f.pincodes) && f.pincodes.length > 0) updateQuery = updateQuery.in('pincode', f.pincodes as string[]);
      if (Array.isArray(f.districts) && f.districts.length > 0) updateQuery = updateQuery.contains('districts', f.districts as string[]);
      if (typeof f.active === 'boolean') updateQuery = updateQuery.eq('active', f.active);
      if (typeof f.is_serviceable === 'boolean') updateQuery = updateQuery.eq('is_serviceable', f.is_serviceable);
      if (typeof f.cod_allowed === 'boolean') updateQuery = updateQuery.eq('cod_allowed', f.cod_allowed);
      if (typeof f.cod_fees_applicable === 'boolean') updateQuery = updateQuery.eq('cod_fees_applicable', f.cod_fees_applicable);
      if (typeof f.is_returnable === 'boolean') updateQuery = updateQuery.eq('is_returnable', f.is_returnable);
      if (typeof f.is_exchangeable === 'boolean') updateQuery = updateQuery.eq('is_exchangeable', f.is_exchangeable);
      if (f.shipping_fee_gt !== undefined) updateQuery = updateQuery.gt('shipping_fee', f.shipping_fee_gt);
      if (f.shipping_fee_lt !== undefined) updateQuery = updateQuery.lt('shipping_fee', f.shipping_fee_lt);
      if (f.shipping_fee_eq !== undefined) updateQuery = updateQuery.eq('shipping_fee', f.shipping_fee_eq);
      if (f.cod_fee_gt !== undefined) updateQuery = updateQuery.gt('cod_fee', f.cod_fee_gt);
      if (f.cod_fee_lt !== undefined) updateQuery = updateQuery.lt('cod_fee', f.cod_fee_lt);
      if (f.cod_fee_eq !== undefined) updateQuery = updateQuery.eq('cod_fee', f.cod_fee_eq);
      if (f.free_shipping_threshold_gt !== undefined) updateQuery = updateQuery.gt('free_shipping_threshold', f.free_shipping_threshold_gt);
      if (f.free_shipping_threshold_lt !== undefined) updateQuery = updateQuery.lt('free_shipping_threshold', f.free_shipping_threshold_lt);
      if (f.free_shipping_threshold_eq !== undefined) updateQuery = updateQuery.eq('free_shipping_threshold', f.free_shipping_threshold_eq);
      if (f.min_order_amount_gt !== undefined) updateQuery = updateQuery.gt('min_order_amount', f.min_order_amount_gt);
      if (f.min_order_amount_lt !== undefined) updateQuery = updateQuery.lt('min_order_amount', f.min_order_amount_lt);
      if (f.min_order_amount_eq !== undefined) updateQuery = updateQuery.eq('min_order_amount', f.min_order_amount_eq);
      if (f.return_window_days_gt !== undefined) updateQuery = updateQuery.gt('return_window_days', f.return_window_days_gt);
      if (f.return_window_days_lt !== undefined) updateQuery = updateQuery.lt('return_window_days', f.return_window_days_lt);
      if (f.return_window_days_eq !== undefined) updateQuery = updateQuery.eq('return_window_days', f.return_window_days_eq);
      if (f.exchange_window_days_gt !== undefined) updateQuery = updateQuery.gt('exchange_window_days', f.exchange_window_days_gt);
      if (f.exchange_window_days_lt !== undefined) updateQuery = updateQuery.lt('exchange_window_days', f.exchange_window_days_lt);
      if (f.exchange_window_days_eq !== undefined) updateQuery = updateQuery.eq('exchange_window_days', f.exchange_window_days_eq);

      const { data: updatedData, error: updateError } = await updateQuery.select('pincode');
      if (updateError) throw updateError;

      const affectedCount = (updatedData as { pincode: string }[])?.length ?? 0;

      // ── 6. Update local cache ───────────────────────────────────────────
      const { detailsCache } = get();
      const updatedCache = { ...detailsCache };
      (updatedData as { pincode: string }[] ?? []).forEach((row) => {
        if (updatedCache[row.pincode]) {
          updatedCache[row.pincode] = { ...updatedCache[row.pincode]!, ...(updates as Partial<PincodeDetails>), updated_at: new Date().toISOString() };
        }
      });

      set({ detailsCache: updatedCache, loading: false });
      return { affectedCount, samplePincodes, dryRun: false };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update pincodes';
      set({ error: msg, loading: false });
      return { affectedCount: 0, error: msg, dryRun };
    }
  },

  // ── applyPincodeFilters ───────────────────────────────────────────────────
  applyPincodeFilters: <T>(query: T, filters: Record<string, unknown>): T => {
    let q: any = query as unknown as any;

    if (Array.isArray(filters.states)    && filters.states.length    > 0) q = q.in('state',     filters.states as string[]);
    if (Array.isArray(filters.cities)    && filters.cities.length    > 0) q = q.in('city',      filters.cities as string[]);
    if (Array.isArray(filters.pincodes)  && filters.pincodes.length  > 0) q = q.in('pincode',   filters.pincodes as string[]);
    if (Array.isArray(filters.districts) && filters.districts.length > 0) q = q.contains('districts', filters.districts as string[]);

    const bools: [string, unknown][] = [
      ['active', filters.active], ['is_serviceable', filters.is_serviceable],
      ['cod_allowed', filters.cod_allowed], ['cod_fees_applicable', filters.cod_fees_applicable],
      ['is_returnable', filters.is_returnable], ['is_exchangeable', filters.is_exchangeable],
    ];
    for (const [col, val] of bools) {
      if (typeof val === 'boolean') q = q.eq(col, val);
    }

    const numFields: [string, string, string][] = [
      ['shipping_fee_gt', 'gt', 'shipping_fee'], ['shipping_fee_lt', 'lt', 'shipping_fee'], ['shipping_fee_eq', 'eq', 'shipping_fee'],
      ['cod_fee_gt', 'gt', 'cod_fee'], ['cod_fee_lt', 'lt', 'cod_fee'], ['cod_fee_eq', 'eq', 'cod_fee'],
      ['free_shipping_threshold_gt', 'gt', 'free_shipping_threshold'], ['free_shipping_threshold_lt', 'lt', 'free_shipping_threshold'], ['free_shipping_threshold_eq', 'eq', 'free_shipping_threshold'],
      ['min_order_amount_gt', 'gt', 'min_order_amount'], ['min_order_amount_lt', 'lt', 'min_order_amount'], ['min_order_amount_eq', 'eq', 'min_order_amount'],
      ['return_window_days_gt', 'gt', 'return_window_days'], ['return_window_days_lt', 'lt', 'return_window_days'], ['return_window_days_eq', 'eq', 'return_window_days'],
      ['exchange_window_days_gt', 'gt', 'exchange_window_days'], ['exchange_window_days_lt', 'lt', 'exchange_window_days'], ['exchange_window_days_eq', 'eq', 'exchange_window_days'],
    ];
    for (const [key, op, col] of numFields) {
      if (filters[key] !== undefined) {
        if (op === 'gt') q = q.gt(col, filters[key]);
        else if (op === 'lt') q = q.lt(col, filters[key]);
        else q = q.eq(col, filters[key]);
      }
    }

    return q as unknown as T;
  },

  // ── checkServiceabilityAvailable ─────────────────────────────────────────
  checkServiceabilityAvailable: async () => {
    try {
      const { count, error } = await supabase.from('pincodes').select('pincode', { count: 'exact' }).eq('is_serviceable', true).limit(1);
      if (error) throw error;
      return count !== null ? count > 0 : true;
    } catch {
      return true; 
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));