import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, X, Check } from 'lucide-react';
import { usePincodeStore } from '../../../store/pincodeStore';
import type { PincodeDetails } from '../../../store/pincodeStore';

const PincodeSearch: React.FC = () => {
  const [pincode, setPincode] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [details, setDetails] = useState<PincodeDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { isValidPincode, fetchDetails, loaded } = usePincodeStore();

  useEffect(() => {
    // Load the pincode list once when component mounts
    const { loadPincodes } = usePincodeStore.getState();
    loadPincodes?.();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPincode(value);
    setError(null);
    setDetails(null);

    if (value.length >= 3 && value.length <= 5 && loaded) {
      // Show suggestions from local list (first 10 matches)
      const matches = Array.from(usePincodeStore.getState().validPincodes)
        .filter(pin => pin.startsWith(value))
        .slice(0, 10);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }

    if (value.length === 6) {
      validatePincode(value);
    }
  };

  const validatePincode = async (pin: string) => {
    if (!loaded) return;
    
    setIsValidating(true);
    setError(null);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      // Step 1: Validate locally from the pincode set
      if (!isValidPincode(pin)) {
        setError("This pincode is not serviceable");
        setDetails(null);
        return;
      }

      // Step 2: Fetch full details from Supabase (with caching)
      const info = await fetchDetails(pin);
      
      if (!info) {
        setError("Delivery not available in this area");
        setDetails(null);
        return;
      }

      setDetails(info);
    } catch (err) {
      setError("Failed to check delivery. Please try again.");
      setDetails(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPincode(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    validatePincode(suggestion);
  };

  const handleClear = () => {
    setPincode('');
    setError(null);
    setDetails(null);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const deliveryTime = details?.delivery_time;
  const shippingFee = details?.shipping_fee || 0;
  const codAvailable = details?.cod_allowed !== false;
  const isServiceable = details?.is_serviceable !== false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-3">
        <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Check Delivery
        </h3>
      </div>

      <div className="relative">
        <input
          type="text"
          value={pincode}
          onChange={handleInputChange}
          placeholder="Enter 6-digit pincode"
          maxLength={6}
          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        
        {pincode && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
        
        {isValidating && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {suggestion}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Delivery Information */}
      {details && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4 mr-2" />
            <span className="font-medium">Delivery Available</span>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-2 text-gray-400" />
              {details.city && details.state ? `${details.city}, ${details.state}` : details.city || details.state}
            </div>
          </div>
          
          {deliveryTime && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-3 w-3 mr-2 text-gray-400" />
              <span>Delivery by: {deliveryTime} from the date of dispatch</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Truck className="h-3 w-3 mr-2 text-gray-400" />
            <span>
              {shippingFee === 0 ? 'Free Shipping' : `Shipping: ₹${shippingFee}`}
              {codAvailable && ' • COD Available'}
            </span>
          </div>
        </div>
      )}

      {!isServiceable && details && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          This pincode is currently not serviceable
        </div>
      )}
    </div>
  );
};

export default PincodeSearch;
