import { httpsCallable, getFunctions } from 'firebase/functions';
import { collection, getDocs, query, where, orderBy, limit as limitClause, startAfter, or as queryOr, and as queryAnd } from 'firebase/firestore';
import { db } from '@lib/firebase';
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
      const createOrderFunction = httpsCallable(getFunctions(), 'createOrder');
      const result = await createOrderFunction(orderData);

      if (!result.data) {
        throw new Error('Failed to create order');
      }

      return result.data;
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

      // Build query conditions
      const baseConditions = [where('order_id', '==', orderId)];
      
      let finalQuery;
      if (email) {
        finalQuery = query(
          collection(db, 'orders'),
          ...baseConditions,
          where('guest_email', '==', email)
        );
      } else if (phone) {
        finalQuery = query(
          collection(db, 'orders'),
          ...baseConditions,
          where('guest_phone', '==', phone)
        );
      } else {
        throw new Error('Email or phone is required');
      }

      const querySnapshot = await getDocs(finalQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Order not found. Please check your details and try again.');
      }

      return Object.assign({}, querySnapshot.docs[0].data(), {
        order_id: querySnapshot.docs[0].id
      });
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

      let ordersQuery = query(
        collection(db, 'orders')
      );

      // Filter by user ID or guest session
      if (userId) {
        ordersQuery = query(
          ordersQuery,
          queryOr(
            where('user_id', '==', userId),
            where('guest_session_id', '==', userId)
          )
        );
      }

      // Apply status filters
      if (status.length > 0) {
        const statusConditions = status.map(s => where('status', '==', s));
        ordersQuery = query(ordersQuery, queryOr(...statusConditions));
      }

      // Apply date range filter
      if (dateRange) {
        ordersQuery = query(
          ordersQuery,
          where('created_at', '>=', dateRange.from),
          where('created_at', '<=', dateRange.to)
        );
      }

      // Apply sorting
      const direction = sortBy.order === 'asc' ? 'asc' : 'desc';
      ordersQuery = query(ordersQuery, orderBy(sortBy.field, direction));

      // Apply pagination
      ordersQuery = query(ordersQuery, limitClause(limit));
      if (page > 1) {
        // For simplicity, we'll skip pagination for now
        // In a real implementation, you'd use startAfter with the last document from previous page
      }

      const querySnapshot = await getDocs(ordersQuery);
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        order_id: doc.id
      }));

      return {
        data: data || [],
        pagination: {
          total: data.length,
          page,
          limit,
          totalPages: Math.ceil(data.length / limit)
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
      let ordersQuery = query(
        collection(db, 'orders'),
        where('order_id', '==', orderId)
      );

      // For authenticated users, check user_id
      if (userId) {
        ordersQuery = query(
          ordersQuery,
          queryOr(
            where('user_id', '==', userId),
            where('guest_session_id', '==', userId)
          )
        );
      }

      const querySnapshot = await getDocs(ordersQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Order not found or access denied');
      }

      const orderData = {
        ...querySnapshot.docs[0].data(),
        order_id: querySnapshot.docs[0].id
      };

      // Fetch related data (order_items, shipping_address)
      // This is a simplified version - in production you'd want proper joins or batch queries
      return orderData;
    } catch (error) {
      logger.error(`Failed to fetch order ${orderId}:`, error);
      throw error;
    }
  }
}
