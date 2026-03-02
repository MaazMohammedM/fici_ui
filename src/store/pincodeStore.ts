// src/store/pincodeStore.ts
import { create } from 'zustand';
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from '../lib/firebase';

export interface PincodeDetails {
  pincode: number;
  city: string | null;
  state: string;
  districts: string[];
  active: boolean;
  is_serviceable: boolean;
  cod_allowed: boolean;
  min_order_amount: number;
  shipping_fee: number;
  cod_fee: number;
  free_shipping_threshold: number;
  delivery_time: string;
  exchange_window_days: number;
  is_exchangeable: boolean;
  is_returnable: boolean;
  return_window_days: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export type BulkPincodeUpdateRequest = {
  filters?: {
    is_serviceable?: boolean;
    state?: string;
    active?: boolean;
    pincode?: number;
    pincodes?: number[];
  };
  updateData: {
    is_serviceable?: boolean;
    cod_allowed?: boolean;
    active?: boolean;
    delivery_time?: string;
    min_order_amount?: number;
    shipping_fee?: number;
    cod_fee?: number;
    free_shipping_threshold?: number;
    exchange_window_days?: number;
    is_exchangeable?: boolean;
    is_returnable?: boolean;
    return_window_days?: number;
  };
};

// Legacy type for backward compatibility
export type LegacyBulkPincodeUpdateRequest = {
  field:
    | 'is_serviceable'
    | 'cod_allowed'
    | 'active'
    | 'delivery_time'
    | 'min_order_amount'
    | 'shipping_fee'
    | 'cod_fee'
    | 'free_shipping_threshold'
    | 'exchange_window_days'
    | 'is_exchangeable'
    | 'is_returnable'
    | 'return_window_days';
  value: boolean | string | number;
  scope: 'all' | 'state' | 'city' | 'single_pincode' | 'multiple_pincodes';
  state?: string;
  city?: string;
  pincode?: number;
  pincodes?: number[];
  isNullCondition?: boolean;
};

interface PincodeState {
  // Basic state
  loaded: boolean;
  validPincodes: Set<number>;
  detailsCache: Record<number, PincodeDetails | null>;

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
  isValidPincode: (pin: number | string) => boolean;
  fetchDetails: (pin: number | string) => Promise<PincodeDetails | null>;

  // CRUD
  fetchPincodes: (page?: number, search?: string) => Promise<void>;
  createPincode: (
    data: Omit<PincodeDetails, 'created_at' | 'updated_at'>
  ) => Promise<PincodeDetails>;
  updatePincode: (
    pincode: number | string,
    data: Partial<PincodeDetails>
  ) => Promise<PincodeDetails>;
  deletePincode: (pincode: number | string) => Promise<boolean>;

  // Bulk operations
  bulkUpdatePincodes: (
    request: BulkPincodeUpdateRequest
  ) => Promise<{ success: boolean; totalMatched: number; totalUpdated: number; error?: string; message?: string }>;
  getBulkUpdateCount: (filters: { is_serviceable?: boolean; state?: string; active?: boolean; pincode?: number; pincodes?: number[] }) => Promise<{ success: boolean; totalMatched: number }>;

  // Serviceability check
  checkServiceabilityAvailable: () => Promise<boolean>;

  // UI helpers
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
}

export const usePincodeStore = create<PincodeState>((set, get) => ({
  // Initial state
  loaded: false,
  validPincodes: new Set<number>(),
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
      const data = (await res.json()) as number[];
      set({
        validPincodes: new Set(data.map((p) => Number(p))),
        loaded: true,
      });
    } catch (error) {
      // mark as loaded so we don't infinitely retry
      set({ loaded: true });
    }
  },

  // Fetch single pincode details from Firebase and cache
  isValidPincode: (pin: number | string) => {
    if (!pin) return false;
    const cleaned = Number(String(pin).trim());
    return get().validPincodes.has(cleaned);
  },

  fetchDetails: async (pin: number | string) => {
    if (!pin) return null;
    const cleaned = Number(String(pin).trim());
    const { detailsCache } = get();

    if (detailsCache[cleaned] !== undefined) {
      return detailsCache[cleaned];
    }

    try {
      const docRef = doc(db, 'pincodes', String(cleaned));
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Pincode not found');
      }

      const details = docSnap.data() as PincodeDetails;
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

      let pincodesQuery: any = collection(db, 'pincodes');

      // Add search filters if provided
      if (search) {
        // Note: Firebase doesn't support multiple 'OR' conditions like Supabase
        // We'll need to fetch all and filter client-side for search,
        // or implement a more complex search solution
        console.log('Search functionality limited in Firebase - fetching all pincodes');
      }

      // Build base query
      pincodesQuery = query(pincodesQuery, orderBy('created_at', 'desc'));

      // Add pagination
      if (page > 1) {
        // For pagination, we need to track last document from previous page
        // This is a simplified approach - in production, you'd want to store last document
        const offset = (page - 1) * itemsPerPage;
        // Firebase doesn't have native offset, so we'll fetch more and skip
        const allQuery = query(collection(db, 'pincodes'), orderBy('created_at', 'desc'));
        const allSnapshot = await getDocs(allQuery);
        const startIndex = offset;
        const endIndex = Math.min(startIndex + itemsPerPage, allSnapshot.size);

        const pincodes: PincodeDetails[] = [];
        const newCache = { ...detailsCache };

        for (let i = startIndex; i < endIndex; i++) {
          const doc = allSnapshot.docs[i];
          const pincodeData = { ...(doc.data() as Record<string, unknown>), pincode: Number(doc.id) } as PincodeDetails;
          pincodes.push(pincodeData);
          newCache[Number(doc.id)] = pincodeData;
        }

        // Get total count
        const totalCount = allSnapshot.size;

        set({
          pincodes,
          totalCount,
          detailsCache: newCache,
          currentPage: page,
          searchQuery: search,
          loading: false,
        });
        return;
      }

      // For page 1, just limit results
      pincodesQuery = query(pincodesQuery, limit(itemsPerPage));

      const querySnapshot = await getDocs(pincodesQuery);

      const pincodes: PincodeDetails[] = [];
      const newCache = { ...detailsCache };

      querySnapshot.forEach((doc) => {
        const pincodeData = { ...(doc.data() as Record<string, unknown>), pincode: Number(doc.id) } as PincodeDetails;

        // Apply search filter client-side if needed
        if (search) {
          const searchLower = search.toLowerCase();
          const pincodeStr = String(pincodeData.pincode);
          if (
            pincodeStr.includes(searchLower) ||
            pincodeData.city.toLowerCase().includes(searchLower) ||
            pincodeData.state.toLowerCase().includes(searchLower)
          ) {
            pincodes.push(pincodeData);
          }
        } else {
          pincodes.push(pincodeData);
        }

        newCache[Number(doc.id)] = pincodeData;
      });

      // Get total count (simplified - in production you'd want a separate count collection)
      const countSnapshot = await getDocs(collection(db, 'pincodes'));
      const totalCount = countSnapshot.size;

      set({
        pincodes,
        totalCount,
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
      const pincodeData = {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'pincodes'), pincodeData);

      const newPincode = { 
        ...pincodeData, 
        pincode: Number(docRef.id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as PincodeDetails;

      const { pincodes, detailsCache } = get();
      const updatedCache = {
        ...detailsCache,
        [Number(docRef.id)]: newPincode,
      };

      set({
        pincodes: [newPincode, ...pincodes],
        detailsCache: updatedCache,
        loading: false,
      });

      return newPincode;
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
      const docRef = doc(db, 'pincodes', String(pincode));
      const updateData = {
        ...updates,
        updated_at: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      // Get updated document
      const updatedDoc = await getDoc(docRef);
      const updatedPincode = { ...updatedDoc.data(), pincode: Number(updatedDoc.id) } as PincodeDetails;

      const { pincodes, detailsCache } = get();
      const updatedCache = {
        ...detailsCache,
        [Number(pincode)]: updatedPincode,
      };

      set({
        pincodes: pincodes.map((p) =>
          p.pincode === Number(pincode) ? updatedPincode : p
        ),
        detailsCache: updatedCache,
        loading: false,
      });

      return updatedPincode;
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
      await deleteDoc(doc(db, 'pincodes', String(pincode)));

      const { pincodes, detailsCache } = get();
      const { [Number(pincode)]: _removed, ...updatedCache } = detailsCache;

      set({
        pincodes: pincodes.filter((p) => p.pincode !== Number(pincode)),
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

  // Bulk update pincodes using Cloud Function for optimal performance
  bulkUpdatePincodes: async (request: BulkPincodeUpdateRequest) => {
    set({ loading: true, error: null });

    try {
      // Try new format first
      try {
        const response = await fetch('https://asia-south1-fici-shoes.cloudfunctions.net/bulkUpdatePincodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Update local cache for affected pincodes if we know which ones were updated
          if (!request.filters || Object.keys(request.filters || {}).length === 0) {
            set({ detailsCache: {} });
          } else {
            const { detailsCache } = get();
            set({
              detailsCache: { ...detailsCache }, // Trigger reactivity
            });
          }

          set({ loading: false });

          return {
            success: result.success || false,
            totalMatched: result.totalMatched || 0,
            totalUpdated: result.totalUpdated || 0,
            message: result.message || `Updated ${result.totalUpdated || 0} pincodes`,
            error: result.error,
          };
        }
      } catch (newFormatError) {
        console.log('New format failed, trying legacy format:', newFormatError.message);
      }

      // Fallback to legacy format for backward compatibility
      const legacyRequest = {
        field: 'is_serviceable',
        value: true,
        scope: 'all',
        ...request.filters,
        ...Object.keys(request.updateData || {}).reduce((acc, key) => {
          if (key === 'is_serviceable') {
            acc.field = key;
            acc.value = request.updateData[key];
          }
          return acc;
        }, {} as any)
      };
      
      const response = await fetch('https://asia-south1-fici-shoes.cloudfunctions.net/bulkUpdatePincodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(legacyRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update local cache
      const { detailsCache } = get();
      set({
        detailsCache: { ...detailsCache }, // Trigger reactivity
      });

      set({ loading: false });

      return {
        success: true,
        totalMatched: result.updatedCount || 0,
        totalUpdated: result.updatedCount || 0,
        message: result.message || `Updated ${result.updatedCount || 0} pincodes`,
        error: result.error,
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update pincodes',
        loading: false,
      });

      return {
        success: false,
        totalMatched: 0,
        totalUpdated: 0,
        error: error instanceof Error ? error.message : 'Failed to update pincodes',
      };
    }
  },

  // Get count for bulk update preview using Cloud Function for optimal performance
  getBulkUpdateCount: async (filters) => {
    try {
      console.log('Calling getBulkUpdateCount with filters:', filters);
      
      // Try new format first
      try {
        const response = await fetch('https://asia-south1-fici-shoes.cloudfunctions.net/getBulkUpdateCount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters }),
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Raw response from Cloud Function:', result);

        if (response.ok) {
          // Handle different response formats
          const totalMatched = result.totalMatched || result.count || result.total || 0;
          console.log('Extracted totalMatched:', totalMatched);
          
          return {
            success: result.success !== false,
            totalMatched: Number(totalMatched),
          };
        } else {
          console.error('Cloud Function returned error:', result);
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (newFormatError) {
        console.log('New format failed, trying legacy format:', newFormatError.message);
      }

      // Fallback to legacy format for backward compatibility
      const legacyRequest = {
        field: 'is_serviceable',
        scope: 'all',
        ...filters
      };
      
      console.log('Trying legacy format with request:', legacyRequest);
      const response = await fetch('https://asia-south1-fici-shoes.cloudfunctions.net/getBulkUpdateCount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(legacyRequest),
      });

      const result = await response.json();
      console.log('Legacy format response:', result);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const totalMatched = result.totalMatched || result.count || result.total || 0;
      return {
        success: true,
        totalMatched: Number(totalMatched),
      };
    } catch (error) {
      console.error('Error getting bulk update count:', error);
      throw error;
    }
  },

  // Serviceability check
  checkServiceabilityAvailable: async () => {
    try {
      const serviceableQuery = query(
        collection(db, 'pincodes'),
        where('is_serviceable', '==', true),
        limit(1)
      );

      const querySnapshot = await getDocs(serviceableQuery);

      // Check if we have any results
      return !querySnapshot.empty;
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
