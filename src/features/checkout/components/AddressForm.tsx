import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { Edit, Trash2, Check, Plus, MapPin } from 'lucide-react';
import PincodeInput from '@components/ui/PincodeInput';
import AlertModal from '@components/ui/AlertModal';
import PhoneUpdateWithOtp from '@/components/PhoneUpdateWithOtp';
import type { PincodeDetails } from '@store/pincodeStore';
import { getDeliveryPhoneHelperText } from '@utils/identitySource';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@components/ui/Dialog';

// Schema for form validation
const AddressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address').optional(),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits'),
  landmark: z.string().optional()
});

type AddressFormData = z.infer<typeof AddressSchema>;

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
  userProfile?: any;
  onPhoneUpdateSuccess?: (newPhone: string) => void;
}

const AddressForm: React.FC<Props> = ({ onSelect, selectedId, userProfile, onPhoneUpdateSuccess }) => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPhoneUpdate, setShowPhoneUpdate] = useState(false);
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  // React Hook Form for better form management
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    reset,
    formState: { errors },
    clearErrors
  } = useForm<AddressFormData>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      district: '',
      landmark: ''
    }
  });

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

  // Handle pincode change with form integration
  const handlePincodeChange = useCallback((value: string) => {
    setValue('pincode', value);
    clearErrors('pincode');
  }, [setValue, clearErrors]);

  // Handle pincode selection with form integration
  const handlePincodeSelect = useCallback((pincodeData: PincodeDetails) => {
    setValue('pincode', pincodeData.pincode);
    setValue('city', pincodeData.city || '');
    setValue('state', pincodeData.state || '');
    setValue('district', pincodeData.districts?.[0] || '');
    clearErrors('pincode');
  }, [setValue, clearErrors]);

  useEffect(() => {
    if (user?.id) loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);


  const handlePhoneUpdateUpdateSuccess = (newPhone: string) => {
    // Update local userProfile state
    if (onPhoneUpdateSuccess) {
      onPhoneUpdateSuccess(newPhone);
    }
    setShowPhoneUpdate(false);
    showAlert('Phone number updated successfully!', 'success');
  };

  // Reset user selection flag drilled when selectedId becomes undefined (indicating parent cleared selection)
  useEffect(() => {
    if (!selectedId && hasUserSelected) {
      setHasUserSelected(false);
    }
  }, [selectedId, hasUserSelected]);

  const handleOpenModal = () => {
    setEditing(null);
    reset();
    setShowForm(true);
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setEditing(null);
    reset();
  };

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
      if (arr.length > 0 && !hasUserSelected) {
        if (!selectedId) {
          // First try to find default address with valid pincode
          const defaultAddress = arr.find(addr => addr.is_default && addr.pincode && addr.pincode.trim() !== "");
          if (defaultAddress) {
            onSelect(defaultAddress);
          } else {
            // If no default with valid pincode, try any default address
            const anyDefaultAddress = arr.find(addr => addr.is_default);
            if (anyDefaultAddress) {
              onSelect(anyDefaultAddress);
            } else if (arr.length === 1) {
              // If only one address and no default, select it only if it has a valid pincode
              const singleAddress = arr[0];
              if (singleAddress.pincode && singleAddress.pincode.trim() !== "") {
                onSelect(singleAddress);
              }
            } else {
              // If multiple addresses and no default, select the first one with valid pincode
              const firstValidAddress = arr.find(addr => addr.pincode && addr.pincode.trim() !== "");
              if (firstValidAddress) {
                onSelect(firstValidAddress);
              }
            }
          }
        } else {
          // If there's a selectedId, verify it exists in the addresses
          const selectedExists = arr.some(addr => addr.id === selectedId);
          if (!selectedExists) {
            // Selected address doesn't exist, try to select default with valid pincode
            const defaultAddress = arr.find(addr => addr.is_default && addr.pincode && addr.pincode.trim() !== "");
            if (defaultAddress) {
              onSelect(defaultAddress);
            } else {
              // Try any default address
              const anyDefaultAddress = arr.find(addr => addr.is_default);
              if (anyDefaultAddress) {
                onSelect(anyDefaultAddress);
              } else if (arr.length > 0) {
                // Select the first available address with valid pincode
                const firstValidAddress = arr.find(addr => addr.pincode && addr.pincode.trim() !== "");
                if (firstValidAddress) {
                  onSelect(firstValidAddress);
                } else {
                  onSelect(arr[0]);
                }
              }
            }
          }
        }
      } else if (hasUserSelected) {
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

  const handleSave = async (data: AddressFormData) => {
    setLoading(true);
    
    try {
      const next = [...addresses];
      const newAddress: Address = {
        ...data,
        id: editing?.id || `addr_${Date.now()}`,
        is_default: false
      };
      
      if (editing?.id) {
        const idx = next.findIndex(a => a.id === editing.id);
        if (idx >= 0) next[idx] = newAddress;
      } else {
        next.push(newAddress);
      }

      const { error } = await upsertAddresses(next);
      if (error) throw error;
      
      setAddresses(next);
      setEditing(null);
      reset();
      setShowForm(false);
      showAlert("Address saved successfully!", "success");
      
      // Auto-select the new address if it's the first one
      if (!editing && next.length === 1) {
        onSelect(newAddress);
      }
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
      
      // If this was the last address, show the form automatically
      if (next.length === 0) {
        setShowForm(true);
      }
    } catch (err) {
      showAlert("Failed to delete address. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (addr: Address) => {
    setEditing(addr);
    // Reset form with address data
    reset({
      name: addr.name || '',
      phone: addr.phone || '',
      email: addr.email || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      district: addr.district || '',
      landmark: addr.landmark || ''
    });
    setShowForm(true);
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
          onClick={handleOpenModal}
          className="flex items-center text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add New Address
        </button>
      </div>

      {/* Address list */}
      {loading ? (
        <div>Loading...</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No saved addresses</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add a shipping address to continue with your order</p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Saved Addresses</h3>
              <div className="space-y-3">
                {sortedAddresses.slice(0, showAllAddresses ? undefined : 2).map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setHasUserSelected(true); // Mark that user manually selected
                      onSelect(addr);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 relative ${
                      selectedId === addr.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-dark2'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{addr.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{addr.phone}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{addr.email}</p>
                        <p className="mt-1 text-gray-700 dark:text-gray-200 text-sm">{addr.address}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {[addr.city, addr.district, addr.state, addr.pincode].filter(Boolean).join(', ')}
                        </p>
                        {addr.landmark && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="text-gray-500 dark:text-gray-500">Landmark:</span> {addr.landmark}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(addr);
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

      {/* Add/Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark2 border border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update your shipping address details below.' : 'Fill in the details below to add a new shipping address.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  {...register('name')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  {...register('phone')}
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
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {getDeliveryPhoneHelperText()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address *
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                  errors.address 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Full address with building name, street, area"
                required
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pincode *
                </label>
                <PincodeInput
                  value={watch('pincode')}
                  onChange={handlePincodeChange}
                  onPincodeSelect={handlePincodeSelect}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.pincode 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="6-digit pincode"
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.pincode.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City *
                </label>
                <input
                  {...register('city')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.city 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="City name"
                  required
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.city.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  District *
                </label>
                <input
                  {...register('district')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.district 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="District name"
                  required
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.district.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State *
                </label>
                <input
                  {...register('state')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                    errors.state 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="State name"
                  required
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.state.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Landmark (Optional)
              </label>
              <input
                {...register('landmark')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark3 dark:text-gray-100 ${
                  errors.landmark 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nearby landmark for easier delivery"
              />
              {errors.landmark && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.landmark.message}</p>
              )}
            </div>
            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-dark3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Phone Update Modal */}
      {showPhoneUpdate && (
        <PhoneUpdateWithOtp
          initialPhone={userProfile?.phone_number || ''}
          onSuccess={handlePhoneUpdateUpdateSuccess}
          variant="modal"
          isOpen={showPhoneUpdate}
          onClose={() => setShowPhoneUpdate(false)}
        />
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