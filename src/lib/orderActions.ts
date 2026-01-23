import { supabase } from '@/lib/supabase';

export type OrderAction = 'cancel_item' | 'ship_item' | 'deliver_item' | 'refund_item' | 'request_replacement' | 'approve_replacement' | 'reject_replacement' | 'ship_replacement' | 'deliver_replacement' | 'mark_replacement_returned' | 'request_return' | 'cancel_order';

// Update the interface at the top of the file
export interface UpdateOrderItemStatusParams {
  action: OrderAction;
  orderItemId?: string;
  order_id?: string;
  reason?: string;
  reason_code?: string;
  requested_size?: string | null;
  guestSessionId?: string;
  approvedBy?: string;
  isAdmin?: boolean;
  adminUserId?: string;
  // Add shipping details
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  // Add refund details
  refund_amount?: number;
  refund_type?: 'full' | 'partial';
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
  order_id,
  reason,
  reason_code,
  requested_size,
  guestSessionId,
  approvedBy,
  isAdmin = false,
  adminUserId,
  shipping_partner,
  tracking_id,
  tracking_url,
  refund_amount,
  refund_type,
  metadata
}: UpdateOrderItemStatusParams) {

  try {
    // For guest users, we don't need to get authenticated session
    // Only get session for admin actions
    let session = null;
    if (isAdmin) {
      const { data: { session: adminSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError.message);
        throw new Error('Authentication error. Please sign in again.');
      }
      session = adminSession;
    }

    // Prepare request headers (let Supabase set Content-Type automatically)
    const headers: Record<string, string> = {};

    // Build request body to match edge function expectations
    const body: any = {
      action
    };

    // Add order_item_id for item-level actions (except cancel_order)
    if (action !== 'cancel_order' && orderItemId) {
      body.order_item_id = orderItemId;
    }

    // Add order_id for cancel_order action
    if (action === 'cancel_order' && order_id) {
      body.order_id = order_id;
    }

    // Add optional fields if provided
    if (reason) body.reason = reason;
    if (reason_code) body.reason_code = reason_code;
    if (requested_size) body.requested_size = requested_size;
    if (guestSessionId) body.guest_session_id = guestSessionId;
    if (metadata) body.metadata = metadata;
    if (approvedBy) body.approved_by = approvedBy;

    // Add shipping details for ship_item and ship_replacement actions
    if (action === 'ship_item' || action === 'ship_replacement') {
      console.log('🔍 Adding shipping details for action:', action, {
        shipping_partner,
        tracking_id,
        tracking_url
      });
      if (!shipping_partner || !tracking_id) {
        throw new Error('Shipping partner and tracking ID are required');
      }
      body.shipping_partner = shipping_partner;
      body.tracking_id = tracking_id;
      if (tracking_url) body.tracking_url = tracking_url;
    }

    // Add refund details for refund_item action
    if (action === 'refund_item') {
      if (refund_amount) body.refund_amount = refund_amount;
      if (refund_type) body.refund_type = refund_type;
    }

    // Add admin auth if applicable
    if (isAdmin && session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      if (adminUserId) {
        body.admin_user_id = adminUserId;
      }
    }


    console.log('🚀 Calling edge function update-item-status with:', {
      action,
      body: JSON.stringify(body, null, 2),
      guestSessionId,
      headers: Object.keys(headers)
    });

    const response = await supabase.functions.invoke('update-item-status', {
      headers,
      body
    });

    console.log('📥 Edge function response:', {
      status: response.data ? 'success' : 'error',
      error: response.error,
      body: response.data
    });

    // Handle response
    if (response.error) {
      console.error('❌ Error response:', {
        message: response.error.message
      });
      throw new Error(response.error.message || 'Failed to update order status');
    }

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
