import { supabase } from '@/lib/supabase';

export type OrderAction = 'cancel_item' | 'ship_item' | 'deliver_item' | 'refund_item' | 'request_return' | 'approve_return';

// Update the interface at the top of the file
export interface UpdateOrderItemStatusParams {
  action: OrderAction;
  orderItemId: string;
  reason?: string;
  guestSessionId?: string;
  isAdmin?: boolean;
  adminUserId?: string;
  // Add shipping details
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  // Add metadata for additional context
  metadata?: Record<string, any>;
}
/**
 * Centralized function to update order item status via Supabase Edge Function
 * This replaces direct Supabase table updates with the new Edge Function
 */
/**
 * Order Actions - Updated: 2025-10-22 15:45 UTC
 * Edge Function response parsing fix
 */
export async function updateOrderItemStatus({
  action,
  orderItemId,
  reason,
  guestSessionId,
  isAdmin = false,
  adminUserId,
  shipping_partner,
  tracking_id,
  tracking_url,
  metadata
}: UpdateOrderItemStatusParams) {
  console.log('🔄 updateOrderItemStatus:', { 
    action, 
    orderItemId,
    isAdmin,
    hasShippingDetails: Boolean(shipping_partner || tracking_id)
  });

  try {
    // Get the current user's session for authorization
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      throw new Error('Authentication error. Please sign in again.');
    }

    // Prepare request headers (let Supabase set Content-Type automatically)
    const headers: Record<string, string> = {};

    // Build request body
    const body: any = {
      action,
      order_item_id: orderItemId,
      timestamp: new Date().toISOString()
    };

    // Add optional fields if provided
    if (reason) body.reason = reason;
    if (guestSessionId) body.guest_session_id = guestSessionId;
    if (metadata) body.metadata = metadata;

    // Add shipping details for ship_item action
    if (action === 'ship_item') {
      if (!shipping_partner || !tracking_id) {
        throw new Error('Shipping partner and tracking ID are required');
      }
      body.shipping_partner = shipping_partner;
      body.tracking_id = tracking_id;
      if (tracking_url) body.tracking_url = tracking_url;
    }

    // Add admin auth if applicable
    if (isAdmin && session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      if (adminUserId) {
        body.admin_user_id = adminUserId;
      }
    }

    console.log('📤 Sending request to update order item status:', {
      action,
      orderItemId,
      hasShipping: action === 'ship_item'
    });

    const response = await supabase.functions.invoke('update-item-status', {
      headers,
      body
    });

    // Handle response
    if (response.error) {
      console.error('❌ Error response:', {
        message: response.error.message
      });
      throw new Error(response.error.message || 'Failed to update order status');
    }

    console.log('✅ Order item status updated successfully');
    return response.data;

  } catch (error) {
    console.error('❌ Error in updateOrderItemStatus:', error);
    throw error;
  }
}

export function getGuestSessionId(): string | undefined {
  // This would need to be imported from the auth store
  // For now, return undefined - the calling code should handle this
  return undefined;
}

/**
 * Helper function to get admin authentication token
 */
export async function getAdminAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting admin auth token:', error);
    return null;
  }
}
