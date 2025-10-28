import React, { useState } from 'react';
import { updateOrderItemStatus, type OrderAction } from '@/lib/orderActions';
import { useAuthStore } from '@/store/authStore';
import { orderToast } from '@/lib/orderToast';
import AlertModal from '@components/ui/AlertModal';

interface OrderItem {
  order_item_id: string;
  product_name: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  thumbnail_url: string;
  item_status?: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded';
  cancel_reason?: string;
  return_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  return_requested_at?: string;
  return_approved_at?: string;
}

interface OrderData {
  order_id: string;
  payment_method: string;
  payment_status: string;
  user_id?: string;
  guest_session_id?: string;
  guest_email?: string;
}

interface OrderItemActionsProps {
  item: OrderItem;
  order: OrderData;
  isAdmin?: boolean;
  onSuccess?: (action: OrderAction, item: OrderItem) => void;
  onError?: (error: Error) => void;
}

const OrderItemActions: React.FC<OrderItemActionsProps> = ({
  item,
  order,
  isAdmin = false,
  onSuccess,
  onError
}) => {
  const { user, guestSession } = useAuthStore();
  const [processing, setProcessing] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showAlert = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setAlertModal({
      isOpen: true,
      message,
      type
    });
  };

  const closeAlert = () => {
    setAlertModal({
      isOpen: false,
      message: '',
      type: 'info'
    });
  };

  const handleAction = async (action: OrderAction, reason?: string) => {
    try {
      setProcessing(action);

      // Determine guest session ID
      let guestSessionId: string | undefined;
      if (order.guest_session_id) {
        guestSessionId = order.guest_session_id;
      } else if (guestSession?.guest_session_id) {
        guestSessionId = guestSession.guest_session_id;
      }

      await updateOrderItemStatus({
        action,
        orderItemId: item.order_item_id,
        reason,
        guestSessionId,
        isAdmin,
        adminUserId: isAdmin ? user?.id : undefined
      });

      orderToast.success(`${action.replace('_', ' ')} successful`);

      // Call success callback
      if (onSuccess) {
        onSuccess(action, item);
      }

    } catch (error) {
      console.error(`Error ${action}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      showAlert(`${action.replace('_', ' ')} failed: ${errorMessage}`, 'error');

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setProcessing(null);
    }
  };

  const canShip = item.item_status === 'pending' && isAdmin;
  const canDeliver = item.item_status === 'shipped' && isAdmin;
  const canCancel = item.item_status === 'pending' && !isAdmin;
  const canReturn = item.item_status === 'delivered' && !isAdmin;
  const canRefund = ['cancelled', 'delivered', 'shipped'].includes(item.item_status || '') && isAdmin;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Ship Button (Admin Only) */}
        {canShip && (
          <button
            onClick={() => handleAction('ship_item')}
            disabled={processing === 'ship_item'}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {processing === 'ship_item' ? 'Shipping...' : 'Ship'}
          </button>
        )}

        {/* Deliver Button (Admin Only) */}
        {canDeliver && (
          <button
            onClick={() => handleAction('deliver_item')}
            disabled={processing === 'deliver_item'}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {processing === 'deliver_item' ? 'Delivering...' : 'Deliver'}
          </button>
        )}

        {/* Cancel Button (User Only) */}
        {canCancel && (
          <button
            onClick={() => handleAction('cancel_item', 'Cancelled by user')}
            disabled={processing === 'cancel_item'}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            {processing === 'cancel_item' ? 'Cancelling...' : 'Cancel'}
          </button>
        )}

        {/* Return Button (User Only) */}
        {canReturn && (
          <button
            onClick={() => handleAction('request_return', 'Return requested by user')}
            disabled={processing === 'request_return'}
            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {processing === 'request_return' ? 'Requesting...' : 'Return'}
          </button>
        )}

        {/* Refund Button (Admin Only) */}
        {canRefund && (
          <button
            onClick={() => handleAction('refund_item', 'Admin initiated refund')}
            disabled={processing === 'refund_item'}
            className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {processing === 'refund_item' ? 'Refunding...' : 'Refund'}
          </button>
        )}
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={closeAlert}
      />
    </>
  );
};

export default OrderItemActions;
