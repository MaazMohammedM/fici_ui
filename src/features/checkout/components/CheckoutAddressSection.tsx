import React from 'react';
import { ArrowLeft, Shield, Phone, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import AddressCard from './AddressForm';
import GuestAddressForm from './GuestAddressForm';
import type { Address } from './AddressForm';
import type { GuestContactInfo } from '../../../types/guest';

interface CheckoutAddressSectionProps {
  selectedAddress: Address | null;
  onAddressSelect: (address: Address) => void;
  userProfile: any;
  onPhoneUpdateSuccess: (newPhone: string) => void;
  guestContactInfo: GuestContactInfo | null;
  guestSession: any;
  guestAddressProp: any;
  onBackToGuestForm: () => void;
  isGuest: boolean;
  guestInfo: GuestContactInfo | null;
  hasUnsavedChanges: boolean;
  onNavigationAttempt: (callback: () => void) => void;
}

const CheckoutAddressSection: React.FC<CheckoutAddressSectionProps> = ({
  selectedAddress,
  onAddressSelect,
  userProfile,
  onPhoneUpdateSuccess,
  guestContactInfo,
  guestSession,
  guestAddressProp,
  onBackToGuestForm,
  isGuest,
  guestInfo,
  hasUnsavedChanges,
  onNavigationAttempt
}) => {
  const navigate = useNavigate();
  const { mode } = useThemeStore();
  const user = useAuthStore((state) => state.user);

  return (
    <>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() =>
              onNavigationAttempt(() => navigate("/cart"))
            }
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-sm sm:text-base font-medium"
            aria-label="Back to cart"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </button>
        </div>
        
        {/* Guest info pill (mobile / tablet). Desktop variant is shown above the address form. */}
        {isGuest && guestInfo && (
          <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Guest:</span>{" "}
              {guestInfo.email}
            </span>
            <button
              onClick={onBackToGuestForm}
              className="flex items-center text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Change Info
            </button>
          </div>
        )}
      </header>

      {/* Guest info strip (desktop) */}
      {isGuest && guestInfo && (
        <div className="hidden lg:flex items-center justify-between mb-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Guest:</span> {guestInfo.email}
          </span>
          <button
            onClick={onBackToGuestForm}
            className="flex items-center text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            Change Info
          </button>
        </div>
      )}
      
      {/* Address selection warning */}
      {!selectedAddress && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-amber-800 dark:text-amber-200 font-medium">
              Please select or add a shipping address to continue
            </span>
          </div>
        </div>
      )}
      
      {user ? (
        <AddressCard
          selectedId={selectedAddress?.id}
          onSelect={(addr) => {
            console.log('CheckoutPage: Address selected:', addr.id, addr.name);
            onAddressSelect(addr);
          }}
          userProfile={userProfile}
          onPhoneUpdateSuccess={onPhoneUpdateSuccess}
        />
      ) : (
        <GuestAddressForm
          selectedAddress={guestAddressProp}
          onAddressSubmit={(addr) => onAddressSelect(addr)}
          guestContactInfo={guestContactInfo}
          guest_session_id={guestSession?.guest_session_id}
        />
      )}
    </>
  );
};

export default CheckoutAddressSection;
