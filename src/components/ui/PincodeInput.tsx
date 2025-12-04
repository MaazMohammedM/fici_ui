import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Truck, X } from 'lucide-react';
import { usePincodeStore } from '../../store/pincodeStore';
import type { PincodeDetails } from '../../store/pincodeStore';

interface PincodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onPincodeSelect?: (details: PincodeDetails) => void;
  onDetailsFetched?: (details: PincodeDetails) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDeliveryInfo?: boolean;
}

const PincodeInput: React.FC<PincodeInputProps> = ({
  value,
  onChange,
  onPincodeSelect,
  onDetailsFetched,
  placeholder = "Enter 6-digit pincode",
  disabled = false,
  className = "",
  showDeliveryInfo = true,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<PincodeDetails | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { loadPincodes, isValidPincode, fetchDetails, loaded } = usePincodeStore();

  useEffect(() => {
    loadPincodes(); // Load the pincode list once when component mounts
  }, [loadPincodes]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, ''); // Only allow digits
    onChange(newValue);
    setError(null);
    setDetails(null);

    if (newValue.length >= 3 && newValue.length <= 5 && loaded) {
      // Show suggestions from local list (first 10 matches)
      const matches = Array.from(usePincodeStore.getState().validPincodes)
        .filter(pin => pin.startsWith(newValue))
        .slice(0, 10);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle pincode validation when 6 digits are entered
  useEffect(() => {
    if (value.length === 6 && loaded) {
      validatePincode();
    } else {
      setDetails(null);
      setError(null);
    }
  }, [value, loaded]);

  const validatePincode = async () => {
    if (!loaded) return;
    
    setIsValidating(true);
    setError(null);
    
    console.log('🔍 Validating pincode:', value);
    console.log('📦 Loaded:', loaded);
    console.log('✅ Valid pincode check:', isValidPincode(value));

    try {
      // Step 1: Validate locally from the pincode set
      if (!isValidPincode(value)) {
        console.log('❌ Pincode not found in local list');
        setError("We could not find this pincode in our service list.");
        setDetails(null);
        return;
      }

      console.log('✅ Pincode found in local list, fetching details...');
      
      // Step 2: Fetch full details from Supabase (with caching)
      const info = await fetchDetails(value);
      console.log('📊 Fetched details:', info);
      
      if (!info) {
        console.log('❌ No details found in database');
        setError("Pincode details not found. You can enter city, state, and district manually.");
        setDetails(null);
        return;
      }

      console.log('✅ Details found, setting state');
      console.log('📋 Pincode info:', info);
      setDetails(info);
      onDetailsFetched?.(info);
      onPincodeSelect?.(info);

    } catch (err) {
      console.error('💥 Error during validation:', err);
      setError("Failed to validate pincode. Please try again.");
      setDetails(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    onChange("");
    setError(null);
    setDetails(null);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Extract delivery info from details
  const deliveryTime = details?.delivery_time;
  const shippingFee = details?.shipping_fee || 0;
  const codAvailable = details?.cod_allowed !== false;
  const isServiceable = details?.is_serviceable !== false;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={6}
          className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:border-gray-600 dark:text-gray-100 ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        
        {value && (
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

      {/* Pincode Details */}
      {details && showDeliveryInfo && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="space-y-2">
            {details.districts && details.districts.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                District: {details.districts.join(', ')}
              </div>
            )}
            
            {deliveryTime && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4 mr-2" />
                <span>Delivery: {deliveryTime}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Truck className="h-4 w-4 mr-2" />
              <span>
                Shipping: {shippingFee === 0 ? 'Free' : `₹${shippingFee}`}
                {codAvailable ? ' • COD Available' : ' • COD Not Available'}
              </span>
            </div>

            {!isServiceable && (
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                This pincode is not serviceable
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Data Found - Allow Manual Entry */}
      {value && value.length === 6 && !details && !isValidating && !error && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <MapPin className="h-4 w-4 inline mr-2" />
            Pincode details not found. You can enter city, state, and district manually.
          </div>
        </div>
      )}
    </div>
  );
};

export default PincodeInput;
