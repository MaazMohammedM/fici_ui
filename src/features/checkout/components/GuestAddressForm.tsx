import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail } from 'lucide-react';
import { Input, Button } from '../../../auth/ui';
import PincodeInput from '@components/ui/PincodeInput';
import { useAuthStore } from '@store/authStore';
import type { Address } from './AddressForm';
import type { GuestContactInfo } from '../../../types/guest';
import { getIdentity, isGuestIdentityLocked, getLockedIdentityFields, getGuestLockedHelperText } from '@utils/identitySource';

// Schema for form validation
const GuestAddressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits'),
  landmark: z.string().optional()
});

type GuestAddressFormData = z.infer<typeof GuestAddressSchema>;

interface GuestAddressFormProps {
  selectedAddress: Address | null;
  onAddressSubmit: (address: Address) => void;
  guest_session_id?: string;
  guestContactInfo?: GuestContactInfo;
}

const isAddressComplete = (addr?: Address | null): boolean => {
  if (!addr) return false;
  const requiredFields: (keyof Address)[] = [
    'name',
    'phone',
    'email',
    'address',
    'city',
    'district',
    'state',
    'pincode',
  ];
  return requiredFields.every((field) => {
    const value = (addr as any)[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
};

const GuestAddressForm: React.FC<GuestAddressFormProps> = ({
  onAddressSubmit,
  selectedAddress,
  guest_session_id,
  guestContactInfo
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  // Show the form whenever we don't yet have a complete address captured.
  const [showForm, setShowForm] = useState(!isAddressComplete(selectedAddress));
  const formRef = useRef<HTMLFormElement>(null);
  const { guestSession, updateGuestContactInfo } = useAuthStore();
  
  // Get identity fields and locking status
  const identity = getIdentity();
  const isLocked = isGuestIdentityLocked();
  const lockedFields = getLockedIdentityFields();
  
  const effectiveGuestSessionId = useMemo(() => {
    return guest_session_id || guestSession?.guest_session_id || useAuthStore.getState().guestSession?.guest_session_id;
  }, [guest_session_id, guestSession]);

  // Load saved addresses from session storage on mount
  useEffect(() => {
    if (effectiveGuestSessionId) {
      const storageKey = `guest_addresses_${effectiveGuestSessionId}`;
      const existing = sessionStorage.getItem(storageKey);
      if (existing) {
        try {
          const addresses: Address[] = JSON.parse(existing);
          setSavedAddresses(addresses);
        } catch (error) {
          console.error('Error loading saved addresses:', error);
        }
      }
    }
  }, [effectiveGuestSessionId]);

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    reset,
    formState: { errors },
    clearErrors
  } = useForm<GuestAddressFormData>({
    resolver: zodResolver(GuestAddressSchema),
    defaultValues: {
      name: lockedFields.name?.value || guestContactInfo?.name || '',
      email: lockedFields.email.value || guestContactInfo?.email || '',
      phone: lockedFields.phone.value || guestContactInfo?.phone || '',
      address: selectedAddress?.address || '',
      city: selectedAddress?.city || '',
      state: selectedAddress?.state || '',
      pincode: selectedAddress?.pincode || '',
      district: selectedAddress?.district || '',
      landmark: selectedAddress?.landmark || ''
    }
  });

  // Update form when guest contact info or lock status changes
  useEffect(() => {
    if (guestContactInfo || isLocked) {
      reset({
        name: lockedFields.name?.value || guestContactInfo?.name || '',
        email: lockedFields.email?.value || guestContactInfo?.email || '',
        phone: lockedFields.phone?.value || guestContactInfo?.phone || '',
        address: selectedAddress?.address || '',
        city: selectedAddress?.city || '',
        state: selectedAddress?.state || '',
        pincode: selectedAddress?.pincode || '',
        district: selectedAddress?.district || '',
        landmark: selectedAddress?.landmark || ''
      });
    }
  }, [guestContactInfo, isLocked, selectedAddress, reset]);

  const handlePincodeChange = (value: string) => {
    setValue('pincode', value);
    clearErrors('pincode');
  };

  const handlePincodeSelect = (pincodeData: any) => {
    setValue('pincode', pincodeData.pincode);
    if (!watch('city')) setValue('city', pincodeData.city || '');
    if (!watch('state')) setValue('state', pincodeData.state || '');
    if (!watch('district')) setValue('district', pincodeData.districts?.[0] || '');
    clearErrors('pincode');
  };

  const saveGuestAddress = async (address: Address): Promise<boolean> => {
    try {
      const storageKey = `guest_addresses_${effectiveGuestSessionId}`;
      const existing = sessionStorage.getItem(storageKey);
      let addresses: Address[] = existing ? JSON.parse(existing) : [];
      
      // Check for duplicates
      const isDuplicate = addresses.some(addr => 
        addr.email === address.email && 
        addr.phone === address.phone && 
        addr.pincode === address.pincode
      );
      
      if (!isDuplicate) {
        addresses.push(address);
        sessionStorage.setItem(storageKey, JSON.stringify(addresses));
        setSavedAddresses(addresses);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving address:', error);
      return false;
    }
  };

  const onSubmit = async (data: GuestAddressFormData) => {
    setIsSubmitting(true);
    
    try {
      await updateGuestContactInfo({
        name: data.name,
        email: data.email,
        phone: data.phone
      });

      const newAddress: Address = {
        id: selectedAddress?.id || `guest-${Date.now()}`,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        district: data.district,
        landmark: data.landmark || '',
        is_default: true,
      };

      // Submit to parent
      onAddressSubmit(newAddress);
      
      // Save to session if we have a session ID
      if (effectiveGuestSessionId) {
        await saveGuestAddress(newAddress);
      }
      
      // Close the form
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSavedAddress = (address: Address) => {
    onAddressSubmit(address);
    setShowForm(false);
  };

  if (!showForm && selectedAddress) {
    return (
      <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shipping Address</h2>
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
            Change Address
          </Button>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="font-medium text-sm text-gray-900 dark:text-white">{selectedAddress.name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {selectedAddress.phone} • {selectedAddress.email}
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-200 mt-1">
            {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.district}, {selectedAddress.state} - {selectedAddress.pincode}
          </p>
          {selectedAddress.landmark && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Landmark: {selectedAddress.landmark}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} ref={formRef} className="space-y-4">
        {(isLocked || !!guestContactInfo) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {getGuestLockedHelperText()}
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
              Guest details are locked for security. Click “Change Info” on the checkout page to update your name, email or phone.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            error={errors.name?.message}
            disabled={lockedFields.name?.disabled || !!guestContactInfo?.name}
            {...register('name', { required: true })}
          />
          
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
            error={errors.phone?.message}
            disabled={lockedFields.phone?.disabled || !!guestContactInfo?.phone}
            {...register('phone', { required: true })}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            disabled={lockedFields.email?.disabled || !!guestContactInfo?.email}
            {...register('email', { required: true })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pincode *
            </label>
            <PincodeInput
              value={watch('pincode')}
              onChange={handlePincodeChange}
              onPincodeSelect={handlePincodeSelect}
              placeholder="Enter 6-digit pincode"
              className={errors.pincode ? 'border-red-500' : ''}
            />
            {errors.pincode && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.pincode.message}</p>
            )}
          </div>

          <Input
            label="Address"
            type="text"
            placeholder="House/Flat No, Building, Street"
            error={errors.address?.message}
            {...register('address', { required: true })}
          />

          <Input
            label="City"
            type="text"
            placeholder="Enter your city"
            error={errors.city?.message}
            {...register('city', { required: true })}
          />

          <Input
            label="State"
            type="text"
            placeholder="Enter your state"
            error={errors.state?.message}
            {...register('state', { required: true })}
          />

          <Input
            label="District"
            type="text"
            placeholder="Enter your district"
            error={errors.district?.message}
            {...register('district', { required: true })}
          />

          <Input
            label="Landmark (Optional)"
            type="text"
            placeholder="Nearby landmark"
            error={errors.landmark?.message}
            {...register('landmark')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            Save Address
          </Button>
          {selectedAddress && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default GuestAddressForm;