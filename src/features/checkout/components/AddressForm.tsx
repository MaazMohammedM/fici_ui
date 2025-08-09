import React, { useState, useEffect } from 'react';
import { usePaymentStore } from '@store/paymentStore';
import { useAuthStore } from '@store/authStore';
import type { ShippingAddress } from '../../../types/payment';

interface AddressFormProps {
  onSubmit: (address: ShippingAddress) => void;
  initialData: ShippingAddress;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, initialData }) => {
  const { user } = useAuthStore();
  const { savedAddresses, fetchSavedAddresses, saveAddress, loading } = usePaymentStore();
  
  const [formData, setFormData] = useState<ShippingAddress>(initialData);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  useEffect(() => {
    if (user) {
      fetchSavedAddresses(user.id);
    }
  }, [user, fetchSavedAddresses]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Save address if it's new and user wants to save it
    if (showNewAddressForm && user) {
      await saveAddress(formData);
    }

    onSubmit(formData);
  };

  const handleSelectSavedAddress = (address: ShippingAddress) => {
    setFormData(address);
    setSelectedAddressId(address.name + address.pincode); // Simple ID
    setShowNewAddressForm(false);
  };

  const handleAddNewAddress = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
    });
    setSelectedAddressId('');
    setShowNewAddressForm(true);
  };

  return (
    <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-6">
        Delivery Address
      </h2>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && !showNewAddressForm && (
        <div className="mb-6">
          <h3 className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3">
            Saved Addresses
          </h3>
          <div className="space-y-3">
            {savedAddresses.map((address, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === address.name + address.pincode
                    ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-[color:var(--color-accent)]/50'
                }`}
                onClick={() => handleSelectSavedAddress(address)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                      {address.name}
                    </p>
                    <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70 mt-1">
                      {address.address}, {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                      Phone: {address.phone}
                    </p>
                  </div>
                  <input
                    type="radio"
                    checked={selectedAddressId === address.name + address.pincode}
                    onChange={() => handleSelectSavedAddress(address)}
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleAddNewAddress}
            className="mt-4 text-[color:var(--color-accent)] hover:underline font-medium"
          >
            + Add New Address
          </button>
        </div>
      )}

      {/* New Address Form */}
      {(showNewAddressForm || savedAddresses.length === 0) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] ${
                  errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="+91 9876543210"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
              Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] resize-none ${
                errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="House No, Building, Street, Area"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => handleInputChange('landmark', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]"
              placeholder="Near mall, hospital, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] ${
                  errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="City"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
                State *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] ${
                  errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="State"
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-1">
                Pincode *
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] ${
                  errors.pincode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="400001"
                maxLength={6}
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[color:var(--color-accent)] text-white py-3 rounded-lg font-semibold hover:bg-[color:var(--color-accent)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue to Payment'}
          </button>

          {savedAddresses.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNewAddressForm(false)}
              className="w-full text-[color:var(--color-accent)] py-2 font-medium hover:underline"
            >
              Back to Saved Addresses
            </button>
          )}
        </form>
      )}

      {/* Continue Button for Selected Address */}
      {!showNewAddressForm && selectedAddressId && (
        <button
          onClick={() => onSubmit(formData)}
          className="w-full bg-[color:var(--color-accent)] text-white py-3 rounded-lg font-semibold hover:bg-[color:var(--color-accent)]/80 transition-colors"
        >
          Continue to Payment
        </button>
      )}
    </div>
  );
};

export default AddressForm;
