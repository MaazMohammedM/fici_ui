import { useState, useCallback, useEffect } from 'react';
import type { PincodeDetails, LocalPincode } from '../lib/utils/pincodeUtils';
import { 
  fetchPincodeDetails, 
  searchPincodes, 
  isPincodeServiceable,
  getDeliveryTime,
  isCODAvailable,
  getShippingFee
} from '../lib/utils/pincodeUtils';

export interface UsePincodeReturn {
  pincodeDetails: PincodeDetails | null;
  suggestions: LocalPincode[];
  isLoading: boolean;
  error: string | null;
  isServiceable: boolean;
  deliveryTime: string | null;
  codAvailable: boolean;
  shippingFee: number;
  searchPincodes: (query: string) => Promise<void>;
  fetchPincode: (pincode: string) => Promise<void>;
  clearPincodeDetails: () => void;
  clearSuggestions: () => void;
}

export const usePincode = (): UsePincodeReturn => {
  const [pincodeDetails, setPincodeDetails] = useState<PincodeDetails | null>(null);
  const [suggestions, setSuggestions] = useState<LocalPincode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServiceable, setIsServiceable] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [codAvailable, setCodAvailable] = useState(true);
  const [shippingFee, setShippingFee] = useState(0);

  const fetchPincode = useCallback(async (pincode: string) => {
    if (!pincode || pincode.length < 6) {
      setPincodeDetails(null);
      setIsServiceable(true);
      setDeliveryTime(null);
      setCodAvailable(true);
      setShippingFee(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const details = await fetchPincodeDetails(pincode);
      setPincodeDetails(details);

      if (details) {
        setIsServiceable(details.is_serviceable !== false && details.active !== false);
        setDeliveryTime(details.delivery_time || null);
        setCodAvailable(details.cod_allowed !== false);
        setShippingFee(details.shipping_fee || 0);
      } else {
        // No data found, allow manual entry
        setIsServiceable(true);
        setDeliveryTime(null);
        setCodAvailable(true);
        setShippingFee(0);
      }
    } catch (err) {
      setError('Failed to fetch pincode details');
      setIsServiceable(true);
      setDeliveryTime(null);
      setCodAvailable(true);
      setShippingFee(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchPincodesCallback = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchPincodes(query);
      setSuggestions(results);
    } catch (err) {
      setError('Failed to search pincodes');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPincodeDetails = useCallback(() => {
    setPincodeDetails(null);
    setIsServiceable(true);
    setDeliveryTime(null);
    setCodAvailable(true);
    setShippingFee(0);
    setError(null);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    pincodeDetails,
    suggestions,
    isLoading,
    error,
    isServiceable,
    deliveryTime,
    codAvailable,
    shippingFee,
    searchPincodes: searchPincodesCallback,
    fetchPincode,
    clearPincodeDetails,
    clearSuggestions,
  };
};
