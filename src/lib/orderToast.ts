import { toast } from 'sonner';

/**
 * Toast notification utility for order actions
 */
export const orderToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),

  // Specific order action messages
  itemShipped: (itemName: string) => toast.success(`${itemName} has been shipped successfully`),
  itemDelivered: (itemName: string) => toast.success(`${itemName} has been delivered successfully`),
  itemCancelled: (itemName: string) => toast.success(`${itemName} has been cancelled successfully`),
  itemRefunded: (itemName: string) => toast.success(`${itemName} has been refunded successfully`),
  returnRequested: (itemName: string) => toast.success(`Return request submitted for ${itemName}`),

  // Error messages
  shippingFailed: (itemName: string, error: string) => toast.error(`Failed to ship ${itemName}: ${error}`),
  deliveryFailed: (itemName: string, error: string) => toast.error(`Failed to mark ${itemName} as delivered: ${error}`),
  cancellationFailed: (itemName: string, error: string) => toast.error(`Failed to cancel ${itemName}: ${error}`),
  refundFailed: (itemName: string, error: string) => toast.error(`Failed to refund ${itemName}: ${error}`),
  returnFailed: (itemName: string, error: string) => toast.error(`Failed to request return for ${itemName}: ${error}`),
};
