import { create } from "zustand";
import { supabase } from "@lib/supabase";

export interface PincodeDetails {
  pincode: string;
  city: string | null;
  state: string | null;
  districts: string[];              // text[] column with default '{}'::text[]
  active: boolean | null;
  is_serviceable: boolean | null;
  cod_allowed: boolean | null;
  min_order_amount: number | null;
  shipping_fee: number | null;
  cod_fee: number | null;
  free_shipping_threshold: number | null;
  delivery_time: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface PincodeState {
  loaded: boolean;
  validPincodes: Set<string>;
  detailsCache: Record<string, PincodeDetails>;
  loadPincodes: () => Promise<void>;
  isValidPincode: (pin: string) => boolean;
  fetchDetails: (pin: string) => Promise<PincodeDetails | null>;
}

export const usePincodeStore = create<PincodeState>((set, get) => ({
  loaded: false,
  validPincodes: new Set<string>(),
  detailsCache: {},

  loadPincodes: async () => {
    if (get().loaded) return;
    try {
      console.log('📂 Loading pincodes from JSON...');
      const res = await fetch("/pincodes.json");
      if (!res.ok) {
        throw new Error(`Failed to load pincodes.json: ${res.status}`);
      }
      const data = (await res.json()) as string[];
      console.log('📊 Loaded pincodes count:', data?.length ?? 0);
      set({
        validPincodes: new Set(data || []),
        loaded: true,
      });
      console.log('✅ Pincodes loaded successfully');
    } catch (error) {
      console.error("Error loading pincodes:", error);
      // mark loaded to avoid infinite retry loops in UI; you may choose differently
      set({ loaded: true });
    }
  },

  isValidPincode: (pin: string) => {
    return get().validPincodes.has(pin);
  },

  fetchDetails: async (rawPin: string) => {
    const pin = String(rawPin || "").trim();
    if (!pin) return null;

    const { detailsCache } = get();

    console.log('🏪 Store: Fetching details for pincode:', `"${pin}"`);
    if (detailsCache[pin]) {
      console.log('💾 Returning cached details for:', pin);
      return detailsCache[pin];
    }

    // Primary attempt: safe array-based select with limit(1) — avoids maybeSingle() issues
    try {
      console.log('🌐 Querying Supabase (array + limit) for:', pin);
      const { data: rows, error: queryError } = await supabase
        .from("pincodes")
        .select("*")
        .eq("pincode", pin)
        .limit(1);

      if (queryError) {
        // log and continue to fallback
        console.warn('⚠️ Query error (array method):', queryError);
      } else {
        if (Array.isArray(rows) && rows.length > 0) {
          const details = rows[0] as PincodeDetails;
          console.log('✅ Found row (array + limit):', details);
          set({
            detailsCache: {
              ...detailsCache,
              [pin]: details,
            },
          });
          return details;
        }
        // rows array empty -> not found
        console.log('🔍 No rows returned for pincode (array + limit):', pin);
        return null;
      }
    } catch (err) {
      console.error('❌ Unexpected error during array query:', err);
      // do not throw — allow fallback
    }

    // Fallback: fetch all rows for that pincode and pick the first (more expensive, only as fallback)
    try {
      console.log('🔁 Fallback: full select (no limit) for:', pin);
      const { data: allRows, error: allRowsError } = await supabase
        .from("pincodes")
        .select("*")
        .eq("pincode", pin);

      if (allRowsError) {
        console.error('❌ Fallback query error:', allRowsError);
        return null;
      }

      if (Array.isArray(allRows) && allRows.length > 0) {
        const details = allRows[0] as PincodeDetails;
        console.log('✅ Found (fallback) row:', details);
        set({
          detailsCache: {
            ...detailsCache,
            [pin]: details,
          },
        });
        return details;
      }

      console.log('🔍 Fallback found no rows for:', pin);
      return null;
    } catch (err) {
      console.error('❌ Unexpected fallback error:', err);
      return null;
    }
  },
}));