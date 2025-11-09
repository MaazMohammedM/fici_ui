import { supabase } from '@lib/supabase';
import { logger } from '@lib/logger';

export interface OrderLookupParams {
  orderId: string;
  email?: string;
  phone?: string;
  guestSessionId?: string;
}

export interface OrderQueryOptions {
  page?: number;
  limit?: number;
  status?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: {
    field: string;
    order: 'asc' | 'desc';
  };
}
export interface OrderCreateRequest {
  user_id?: string;
  guest_session_id?: string;
  guest_contact_info?: {
    email: string;
    phone: string;
    name: string;
  };
  order_id: string;
  payment_method: string;
  items: any[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  shipping_address: any;
  amount: number;
}

export class OrderService {
  static async createOrder(orderData: OrderCreateRequest) {
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData
      });

      if (error) {
        logger.error('Order creation error:', error);
        throw new Error(error.message || 'Failed to create order');
      }

      return data;
    } catch (error) {
      logger.error('Order service error:', error);
      throw error;
    }
  }

  /**
   * Lookup order by ID and email/phone (for guests)
   */
  static async lookupGuestOrder({ orderId, email, phone }: OrderLookupParams) {
    try {
      if (!orderId || (!email && !phone)) {
        throw new Error('Order ID and either email or phone is required');
      }

      // First try to get the order with the most specific query
      let query = supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId);

      // Add email filter if provided
      if (email) {
        query = query.eq('guest_email', email);
      }
      // Fallback to phone if email not provided
      else if (phone) {
        query = query.eq('guest_phone', phone);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new Error('Order not found. Please check your details and try again.');
      }

      return data;
    } catch (error) {
      logger.error('Guest order lookup failed:', error);
      throw error;
    }
  }

  /**
   * Get orders with advanced filtering and pagination
   */
  static async getOrders(
    userId?: string,
    options: OrderQueryOptions = {}
  ) {
    try {
      const {
        page = 1,
        limit = 10,
        status = [],
        dateRange,
        sortBy = { field: 'created_at', order: 'desc' }
      } = options;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      // Filter by user ID or guest session
      if (userId) {
        query = query.or(`user_id.eq.${userId},guest_session_id.eq.${userId}`);
      }

      // Apply status filters
      if (status.length > 0) {
        query = query.in('status', status);
      }

      // Apply date range filter
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      // Apply sorting
      query = query.order(sortBy.field, { ascending: sortBy.order === 'asc' });

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  static generateOrderId(): string {
    return crypto.randomUUID();
  }

  static validateOrderData(data: any): boolean {
    return !!(
      data.items?.length > 0 &&
      data.shipping_address &&
      data.payment_method &&
      data.subtotal >= 0
    );
  }

  /**
   * Get order by ID with proper authorization
   */
  static async getOrderById(orderId: string, userId?: string) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*, product:products(*)),
          shipping_address:addresses(*)
        `)
        .eq('order_id', orderId);

      // For authenticated users, check user_id
      if (userId) {
        query = query.or(`user_id.eq.${userId},guest_session_id.eq.${userId}`);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new Error('Order not found or access denied');
      }

      return data;
    } catch (error) {
      logger.error(`Failed to fetch order ${orderId}:`, error);
      throw error;
    }
  }
}
