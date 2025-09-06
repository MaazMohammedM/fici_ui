import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, User, Phone, Mail } from 'lucide-react';
import { Input, Button } from '../../../auth/ui';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import type { Address } from './AddressForm';

const GuestAddressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits'),
  landmark: z.string().optional()
});

type GuestAddressFormData = z.infer<typeof GuestAddressSchema>;

interface GuestAddressFormProps {
  onAddressSubmit: (address: Address) => void;
  selectedAddress?: Address | null;
  guestSessionId?: string;
}

const GuestAddressForm: React.FC<GuestAddressFormProps> = ({
  onAddressSubmit,
  selectedAddress,
  guestSessionId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(!selectedAddress);
  const { guestContactInfo } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<GuestAddressFormData>({
    resolver: zodResolver(GuestAddressSchema),
    defaultValues: {
      name: guestContactInfo?.name || '',
      email: guestContactInfo?.email || '',
      phone: guestContactInfo?.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    }
  });

  useEffect(() => {
    if (guestSessionId) {
      loadGuestAddresses();
    }
  }, [guestSessionId]);

  const loadGuestAddresses = async () => {
    if (!guestSessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('guest_sessions')
        .select('shipping_addresses')
        .eq('session_id', guestSessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading guest addresses:', error);
        return;
      }

      if (data?.shipping_addresses) {
        const addresses = Array.isArray(data.shipping_addresses) ? data.shipping_addresses : [];
        setSavedAddresses(addresses);
      }
    } catch (error) {
      console.error('Error loading guest addresses:', error);
    }
  };

  const saveGuestAddress = async (address: Address) => {
    if (!guestSessionId) {
      console.error('No guest session ID provided');
      return false;
    }

    try {
      // First check if guest session exists
      const { data: existingSession, error: fetchError } = await supabase
        .from('guest_sessions')
        .select('session_id, shipping_addresses')
        .eq('session_id', guestSessionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching guest session:', fetchError);
        return false;
      }

      // If session doesn't exist, we can't save the address
      if (!existingSession) {
        console.error('Guest session not found:', guestSessionId);
        return false;
      }

      const currentAddresses = Array.isArray(existingSession.shipping_addresses) 
        ? existingSession.shipping_addresses 
        : [];
      
      const updatedAddresses = [...currentAddresses, { ...address, id: `guest_addr_${Date.now()}` }];
      
      const { error } = await supabase
        .from('guest_sessions')
        .update({ 
          shipping_addresses: updatedAddresses,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', guestSessionId);

      if (error) {
        console.error('Error saving guest address:', error);
        return false;
      }

      setSavedAddresses(updatedAddresses);
      return true;
    } catch (error) {
      console.error('Error saving guest address:', error);
      return false;
    }
  };

  const onSubmit = async (data: GuestAddressFormData) => {
    setIsSubmitting(true);
    
    try {
      const newAddress: Address = {
        id: `guest_addr_${Date.now()}`,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        landmark: data.landmark
      };

      console.log('Attempting to save address with guestSessionId:', guestSessionId);
      console.log('Address data:', newAddress);

      // If no guestSessionId, just submit the address without saving
      if (!guestSessionId) {
        console.warn('No guest session ID available, submitting address without saving');
        onAddressSubmit(newAddress);
        setShowForm(false);
        reset();
        return;
      }

      // Save to guest session
      const saved = await saveGuestAddress(newAddress);
      
      if (saved) {
        onAddressSubmit(newAddress);
        setShowForm(false);
        reset();
      } else {
        // Even if saving fails, still submit the address for checkout
        console.warn('Address saving failed, but proceeding with checkout');
        onAddressSubmit(newAddress);
        setShowForm(false);
        reset();
      }
    } catch (error) {
      console.error('Error submitting address:', error);
      // Even if there's an error, still try to proceed with the address
      const newAddress: Address = {
        id: `guest_addr_${Date.now()}`,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        landmark: data.landmark
      };
      onAddressSubmit(newAddress);
      setShowForm(false);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSavedAddress = (address: Address) => {
    onAddressSubmit(address);
    setShowForm(false);
  };

  return (
    <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            size="sm"
          >
            Add New Address
          </Button>
        )}
      </div>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && !showForm && (
        <div className="space-y-3 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Previously Used Addresses
          </h3>
          {savedAddresses.map((address) => (
            <div
              key={address.id}
              onClick={() => selectSavedAddress(address)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedAddress?.id === address.id 
                  ? 'border-accent bg-accent/5' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-accent/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{address.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {address.phone} • {address.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {address.address}, {address.city}, {address.state} {address.pincode}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              leftIcon={User}
              error={errors.name?.message}
              {...register('name')}
              required
            />
            <Input
              type="tel"
              label="Phone Number"
              placeholder="Enter your phone number"
              leftIcon={Phone}
              error={errors.phone?.message}
              {...register('phone')}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email address"
              leftIcon={Mail}
              error={errors.email?.message}
              {...register('email')}
              required
            />
            <Input
              label="Pincode"
              placeholder="Enter pincode"
              leftIcon={MapPin}
              error={errors.pincode?.message}
              {...register('pincode')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address *
            </label>
            <textarea
              placeholder="Enter your complete address"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-800 dark:text-white"
              rows={2}
              {...register('address')}
              required
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="Enter your city"
              error={errors.city?.message}
              {...register('city')}
              required
            />
            <Input
              label="State"
              placeholder="Enter your state"
              error={errors.state?.message}
              {...register('state')}
              required
            />
          </div>

          <Input
            label="Landmark (Optional)"
            placeholder="Enter nearby landmark"
            error={errors.landmark?.message}
            {...register('landmark')}
          />

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-1"
            >
              Save Address
            </Button>
            {savedAddresses.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      {selectedAddress && !showForm && (
        <div className="mt-4 p-4 bg-accent/5 border border-accent rounded-lg">
          <h4 className="font-semibold text-accent mb-2">Selected Address:</h4>
          <div className="text-sm">
            <p className="font-medium">{selectedAddress.name}</p>
            <p>{selectedAddress.phone} • {selectedAddress.email}</p>
            <p>{selectedAddress.address}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestAddressForm;