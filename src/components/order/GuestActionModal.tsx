import React, { useState } from 'react';
import { X, Shield, Loader2 } from 'lucide-react';
import { OtpFlow } from '../otp/OtpFlow';
import type { OrderItem } from '../../types/order';

interface GuestActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'cancel' | 'replacement';
  item: OrderItem;
  guestEmail: string;
  guestPhone?: string | null;
  onActionConfirmed: (reason?: string) => void;
}

const GuestActionModal: React.FC<GuestActionModalProps> = ({
  isOpen,
  onClose,
  action,
  item,
  guestEmail,
  guestPhone,
  onActionConfirmed
}) => {
  const [showOtp, setShowOtp] = useState(false);
  const [reason, setReason] = useState('');

  const handleOtpVerified = () => {
    onActionConfirmed(reason);
  };

  const handleProceed = () => {
    if (!reason.trim()) {
      alert(`Please provide a reason for ${action === 'cancel' ? 'cancellation' : 'replacement request'}`);
      return;
    }
    setShowOtp(true);
  };

  const getActionTitle = () => {
    switch (action) {
      case 'cancel':
        return 'Cancel Item';
      case 'replacement':
        return 'Request Replacement';
      default:
        return 'Confirm Action';
    }
  };

  const getActionMessage = () => {
    switch (action) {
      case 'cancel':
        return 'To cancel this item, we need to verify your identity for security purposes.';
      case 'replacement':
        return 'To request a replacement for this item, we need to verify your identity for security purposes.';
      default:
        return 'To proceed with this action, we need to verify your identity.';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {getActionTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showOtp ? (
          <div className="space-y-4">
            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Size: {item.size} | Quantity: {item.quantity}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Price: ₹{item.price_at_purchase}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for {action === 'cancel' ? 'cancellation' : 'replacement request'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Please describe why you want to ${action === 'cancel' ? 'cancel this item' : 'request a replacement for this item'}...`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Identity Verification Required
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {getActionMessage()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    We'll send a verification code to your email: {guestEmail}
                    {guestPhone && (
                      <span>
                        <br />
                        Phone: {guestPhone}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={!reason.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Proceed with Verification
              </button>
            </div>
          </div>
        ) : (
          <OtpFlow
            purpose={action}
            onVerified={handleOtpVerified}
            onCancel={onClose}
            prefilledMethod="email"
            userType="guest"
            initialEmail={guestEmail}
            initialPhone={guestPhone || undefined}
            checkoutSessionId={`guest_${item.order_item_id}_${action}`}
          />
        )}
      </div>
    </div>
  );
};

export default GuestActionModal;
