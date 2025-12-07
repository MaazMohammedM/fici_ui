import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { Edit, Trash2, Check, Plus } from 'lucide-react';
import PincodeInput from '@components/ui/PincodeInput';
import AlertModal from '@components/ui/AlertModal';
import type { PincodeDetails } from '@store/pincodeStore';

export type Address = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  district?: string;
  is_default?: boolean;
};

interface Props {
  onSelect: (addr: Address) => void;
  selectedId?: string;
}

const AddressForm: React.FC<Props> = ({ onSelect, selectedId }) => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Address>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    district: '',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{
    phone?: string;
    email?: string;
    pincode?: string;
  }>({});

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: "info" | "warning" | "error" | "success";
  }>({
    isOpen: false,
    message: "",
    type: "info",
  });

  // Generic alert function
  const showAlert = (
    message: string,
    type: "info" | "warning" | "error" | "success" = "info"
  ) => {
    setAlertModal({
      isOpen: true,
      message,
      type,
    });
  };

  // Validation functions
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number: starts with 6-9, total 10 digits
    if (!phone) {
      return 'Phone number is required';
    }
    if (!phoneRegex.test(phone)) {
      return 'Please enter a valid 10-digit mobile number';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return ''; // Email is optional
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePincode = (pincode: string) => {
    const pincodeRegex = /^\d{6}$/; // Exactly 6 digits
    if (!pincode) {
      return 'Pincode is required';
    }
    if (!pincodeRegex.test(pincode)) {
      return 'Pincode must be exactly 6 digits';
    }
    return '';
  };

  // Real-time validation handlers
  const handlePhoneChange = (value: string) => {
    setForm(prev => ({ ...prev, phone: value }));
    const error = validatePhone(value);
    setErrors(prev => ({ ...prev, phone: error }));
  };

  const handleEmailChange = (value: string) => {
    setForm(prev => ({ ...prev, email: value }));
    const error = validateEmail(value);
    setErrors(prev => ({ ...prev, email: error }));
  };

  const handlePincodeChange = (value: string) => {
    setForm(prev => ({ ...prev, pincode: value }));
    const error = validatePincode(value);
    setErrors(prev => ({ ...prev, pincode: error }));
  };

  // Handle pincode selection from suggestions
  const handlePincodeSelect = (pincodeData: PincodeDetails) => {
    setForm(prev => ({
      ...prev,
      pincode: pincodeData.pincode,
      city: pincodeData.city ? pincodeData.city : prev.city,
      state: pincodeData.state || prev.state,
      district: (pincodeData.districts?.[0] as string) || prev.district
    }));
  };

  // Handle pincode details fetched from database
  const handlePincodeDetails = (details: PincodeDetails) => {
    if (details) {
      setForm(prev => ({
        ...prev,
        city: details.city ? details.city : prev.city,
        state: details.state || prev.state,
        district: (details.districts?.[0] as string) || prev.district
      }));
    }
  };

  useEffect(() => {
    if (user?.id) loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadAddresses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('addresses')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      const arr = Array.isArray(data?.addresses) ? data.addresses : [];
      setAddresses(arr);
      
      // Auto-select default address if exists and no address is currently selected
      if (arr.length > 0 && !selectedId) {
        const defaultAddress = arr.find(addr => addr.is_default);
        if (defaultAddress) {
          onSelect(defaultAddress);
        } else if (arr.length === 1) {
          // If only one address and no default, select it
          onSelect(arr[0]);
        }
      }
    } catch (err) {
      showAlert("Failed to load addresses. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const upsertAddresses = async (next: Address[]) => {
    if (!user?.id) return { error: 'no-user' };
    const { error } = await supabase
      .from('user_profiles')
      .update({ addresses: next })
      .eq('user_id', user.id);
    return { error };
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const next = [...addresses];
    if (editing?.id) {
      const idx = next.findIndex(a => a.id === editing.id);
      if (idx >= 0) next[idx] = { ...form, id: editing.id };
    } else {
      next.push({ ...form, id: `addr_${Date.now()}` });
    }

    setLoading(true);
    try {
      const { error } = await upsertAddresses(next);
      if (error) throw error;
      setAddresses(next);
      setEditing(null);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        district: '',
        is_default: false
      });
    } catch (err) {
      showAlert("Failed to save address. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const next = addresses.filter(a => a.id !== id);
    setLoading(true);
    try {
      const { error } = await upsertAddresses(next);
      if (error) throw error;
      setAddresses(next);
    } catch (err) {
      showAlert("Failed to delete address. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (addr: Address) => {
    setEditing(addr);
    setForm(addr);
  };

  const setAsDefault = async (id?: string) => {
    if (!id) return;
    const next = addresses.map(a => ({ ...a, is_default: a.id === id }));
    setLoading(true);
    try {
      const { error } = await upsertAddresses(next);
      if (error) throw error;
      setAddresses(next);
    } catch (err) {
      showAlert("Failed to set default address. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Always show default address first, then sort by ID
  const sortedAddresses = [...addresses].sort((a, b) => {
    // First, sort by is_default (true first)
    const defaultOrder = (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0);
    if (defaultOrder !== 0) return defaultOrder;
    
    // If both have same is_default status, sort by ID
    const aId = a.id || '';
    const bId = b.id || '';
    return aId.localeCompare(bId);
  });

  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Shipping Address</h2>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditing(null);
              setForm({
                name: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                landmark: '',
                district: '',
                is_default: false
              });
            }
          }}
          className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          {showForm ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {/* Address list */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {addresses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Saved Addresses</h3>
              <div className="space-y-3">
                {sortedAddresses.slice(0, showAllAddresses ? undefined : 2).map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => onSelect(addr)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 relative ${
                      selectedId === addr.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-dark2'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{addr.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{addr.phone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{addr.email}</p>
                        <p className="mt-2 text-gray-700 dark:text-gray-200">{addr.address}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                        </p>
                        {addr.landmark && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="text-gray-500 dark:text-gray-500">Landmark:</span> {addr.landmark}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(addr);
                            setForm(addr);
                            setShowForm(true);
                          }}
                          className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300 transition-colors"
                          title="Edit address"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(addr.id!);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsDefault(addr.id);
                        }}
                        className="text-xs text-[color:var(--color-accent)] hover:underline"
                      >
                        Set as default
                      </button>
                      {selectedId === addr.id && (
                        <span className="ml-auto text-accent flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View more button */}
          {!showAllAddresses && sortedAddresses.length > 2 && (
            <button
              onClick={() => setShowAllAddresses(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors"
            >
              View {sortedAddresses.length - 2} more addresses
            </button>
          )}

          {/* View less button */}
          {showAllAddresses && sortedAddresses.length > 2 && (
            <button
              onClick={() => setShowAllAddresses(false)}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors"
            >
              View less
            </button>
          )}
        </div>
      )}

      {/* Add/Edit form - Only show when explicitly requested */}
      {showForm && (
        <div className="mt-4 p-4 border rounded-lg bg-white dark:bg-dark2 border-gray-200 dark:border-gray-700">
          <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">
            {editing ? 'Edit Address' : 'Add New Address'}
          </h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.phone 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pincode *
                </label>
                <PincodeInput
                  value={form.pincode || ''}
                  onChange={(value) => handlePincodeChange(value)}
                  onPincodeSelect={handlePincodeSelect}
                  onDetailsFetched={handlePincodeDetails}
                  placeholder="Enter 6-digit pincode"
                  showDeliveryInfo={true}
                  className={errors.pincode ? 'border-red-500' : ''}
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.pincode}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Complete Address *
              </label>
              <textarea
                value={form.address || ''}
                onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="House/Flat no., Building, Area, Street"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={form.city || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  District *
                </label>
                <input
                  type="text"
                  value={form.district || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={form.state || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={form.landmark || ''}
                onChange={(e) => setForm(prev => ({ ...prev, landmark: e.target.value }))}
                placeholder="E.g. Near Central Mall, Opposite Bank"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="setAsDefault"
                  checked={form.is_default || false}
                  onChange={(e) => setForm(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-dark3 dark:border-gray-600"
                />
                <label htmlFor="setAsDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Set as default address
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setForm({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      city: '',
                      state: '',
                      pincode: '',
                      landmark: '',
                      district: '',
                      is_default: false,
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-dark3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() =>
          setAlertModal({
            isOpen: false,
            message: "",
            type: "info",
          })
        }
      />
    </div>
  );
};

export default AddressForm;