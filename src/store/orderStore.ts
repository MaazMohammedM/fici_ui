import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import { updateOrderItemStatus } from '@/lib/orderActions';
import type { Order, Review, OrderFilters, OrderItem } from '../types/order';

// Utility function to calculate aggregate order status based on item statuses
export const calculateAggregateOrderStatus = (items: OrderItem[]): Order['status'] => {
  if (!items || items.length === 0) return 'pending';
  
  const statuses = items.map(item => item.item_status || 'pending');
  const allCancelled = statuses.every(s => s === 'cancelled');
  const allDelivered = statuses.every(s => s === 'delivered');
  const allShipped = statuses.every(s => s === 'shipped');
  const allRefunded = statuses.every(s => s === 'refunded');
  
  const someCancelled = statuses.some(s => s === 'cancelled');
  const someDelivered = statuses.some(s => s === 'delivered');
  const someShipped = statuses.some(s => s === 'shipped');
  const someRefunded = statuses.some(s => s === 'refunded');
  
  if (allCancelled) return 'cancelled';
  if (allDelivered) return 'delivered';
  if (allShipped && !someDelivered && !someCancelled) return 'shipped';
  if (allRefunded) return 'cancelled'; // Treat all refunded as cancelled
  
  // Partial statuses
  if (someCancelled || someRefunded) {
    if (someDelivered) return 'partially_delivered';
    if (someShipped) return 'partially_cancelled';
    return 'partially_cancelled';
  }
  
  if (someDelivered && (someShipped || statuses.some(s => s === 'pending'))) {
    return 'partially_delivered';
  }
  
  // Return 'partially_shipped' when some items are shipped but not all
  if (someShipped && !allShipped) return 'partially_shipped';
  
  return 'pending';
};

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  reviews: Review[];
  userReviews: Review[]; // User's own reviews
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  // For authenticated users
  fetchOrders: (userId: string, filters?: OrderFilters & { page?: number; limit?: number }) => Promise<void>;
  // For guest users
  fetchGuestOrders: (email: string, phone: string, tpin?: string) => Promise<void>;
  // Common methods
  fetchOrderById: (orderId: string, email?: string, phone?: string, tpin?: string) => Promise<Order | null>;
  createOrder: (orderData: Omit<Order, 'id' | 'created_at'>) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  submitReview: (review: Omit<Review, 'review_id' | 'created_at'>) => Promise<void>;
  updateReview: (reviewId: string, updates: Partial<Review>) => Promise<void>;
  fetchReviews: (productId: string) => Promise<void>;
  fetchUserReviews: (userId: string) => Promise<void>;
  clearError: () => void;
  setPage: (page: number) => void;
  // Guest order methods
  verifyGuestOrderAccess: (orderId: string, email: string, phone: string) => Promise<boolean>;
  // Item-level methods
  cancelOrderItem: (orderItemId: string, reason: string, userId?: string, guestSessionId?: string) => Promise<void>;
  requestReturnItem: (orderItemId: string, reason: string, userId?: string, guestSessionId?: string, imageFile?: File) => Promise<void>;
  updateOrderItemStatus: (orderItemId: string, newStatus: string) => void;
  // Admin methods
  adminCancelOrderItem: (orderItemId: string, reason: string, adminUserId: string) => Promise<void>;
  adminShipOrderItem: (orderItemId: string, adminUserId: string) => Promise<void>;
  adminDeliverOrderItem: (orderItemId: string, adminUserId: string) => Promise<void>;
  adminRefundOrderItem: (orderItemId: string, reason: string, adminUserId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  reviews: [],
  userReviews: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  },

  async verifyGuestTPIN(tpin: string) {
    set({ loading: true, error: null });
    try {
      // Use the existing fetchGuestOrders logic for TPIN verification
      await get().fetchGuestOrders('', '', tpin);
      set({ loading: false });
    } catch (error: any) {
      console.error('Error verifying TPIN:', error);
      set({ error: error.message || 'Failed to verify TPIN', loading: false });
      throw error;
    }
  },

  async fetchOrders(userId: string, filters: OrderFilters & { page?: number; limit?: number } = {}) {
    set({ loading: true, error: null });
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;

      // Join orders with order_items
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `, { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      // Transform the data to match our Order type
      const transformedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.order_id,
        user_id: order.user_id,
        items: order.order_items || [], // now items come from order_items table
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
        delivery_charge: order.delivery_charge || 0,
        total_amount: order.total_amount || 0,
        status: order.status || "pending",
        payment_status: order.payment_status || "pending",
        payment_method: order.payment_method || "razorpay",
        shipping_address: order.shipping_address || {},
        created_at: order.created_at || order.order_date || new Date().toISOString(),
        order_date: order.order_date
      }));

      const totalPages = Math.ceil((count || 0) / limit);

      set({
        orders: transformedOrders,
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages
        },
        loading: false
      });
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      set({ error: error.message || "Failed to fetch orders", loading: false });
    }
  },

  async fetchGuestOrders(email: string, phone: string, tpin?: string) {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `, { count: 'exact' })
        .or(`guest_email.eq.${email},guest_phone.eq.${phone}${tpin ? `,guest_tpin.eq.${tpin}` : ''}`)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const transformedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.order_id,
        user_id: order.user_id,
        guest_session_id: order.guest_session_id,
        guest_email: order.guest_email,
        guest_phone: order.guest_phone,
        guest_name: order.guest_name,
        guest_tpin: order.guest_tpin,
        items: order.order_items || [],
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
        delivery_charge: order.delivery_charge || 0,
        total_amount: order.total_amount || 0,
        status: order.status || 'pending',
        payment_status: order.payment_status || 'pending',
        payment_method: order.payment_method || 'razorpay',
        shipping_address: order.shipping_address || {},
        created_at: order.created_at || order.order_date || new Date().toISOString(),
        order_date: order.order_date,
        is_guest_order: true
      }));

      set({
        orders: transformedOrders,
        pagination: {
          total: count || 0,
          page: 1,
          limit: 50,
          totalPages: 1
        },
        loading: false
      });
    } catch (error: any) {
      console.error('Error fetching guest orders:', error);
      set({ error: error.message || 'Failed to fetch guest orders', loading: false });
      throw error;
    }
  },

  async fetchOrderById(orderId: string, email?: string, phone?: string, tpin?: string): Promise<Order | null> {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('order_id', orderId);

      // For guest orders, verify email/phone/tpin matches
      if (email) query = query.eq('guest_email', email);
      if (phone) query = query.eq('guest_phone', phone);
      if (tpin) query = query.eq('guest_tpin', tpin);

      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) throw new Error('Order not found');

      // Handle both old and new guest order formats
      const guestEmail = data.guest_email || (data.guest_contact_info?.email);
      const guestPhone = data.guest_phone || (data.guest_contact_info?.phone);
      const guestName = data.guest_name || (data.guest_contact_info?.name);
      const guestTPIN = data.guest_tpin;
      const isGuestOrder = !data.user_id || data.guest_session_id;

      const transformedOrder: Order = {
        id: data.order_id,
        user_id: data.user_id,
        guest_session_id: data.guest_session_id,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_name: guestName,
        guest_tpin: guestTPIN,
        items: data.order_items || [],
        subtotal: data.subtotal || 0,
        discount: data.discount || 0,
        delivery_charge: data.delivery_charge || 0,
        total_amount: data.total_amount || 0,
        status: data.status || 'pending',
        payment_status: data.payment_status || 'pending',
        payment_method: data.payment_method || 'razorpay',
        payment_id: data.payment_id,
        shipping_address: data.shipping_address || {},
        billing_address: data.billing_address || {},
        tracking_number: data.tracking_number,
        tracking_url: data.tracking_url,
        notes: data.notes,
        created_at: data.created_at || data.order_date || new Date().toISOString(),
        order_date: data.order_date,
        updated_at: data.updated_at,
        paid_at: data.paid_at,
        shipped_at: data.shipped_at,
        delivered_at: data.delivered_at,
        cancelled_at: data.cancelled_at,
        merged_at: data.merged_at,
        is_guest_order: isGuestOrder,
        // Keep old format for backward compatibility
        guest_contact_info: data.guest_contact_info || {
          name: guestName,
          email: guestEmail,
          phone: guestPhone
        }
      };

      set({ currentOrder: transformedOrder, loading: false });
      return transformedOrder;
    } catch (error: any) {
      console.error('Error fetching order:', error);
      set({ error: error.message || 'Failed to fetch order', loading: false });
      return null;
    }
  },

  async createOrder(orderData: Omit<Order, 'id' | 'created_at'>) {
    set({ loading: true, error: null });
    try {
      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: orderData.user_id,
          items: orderData.items,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          delivery_charge: orderData.delivery_charge,
          total_amount: orderData.total_amount,
          status: orderData.status,
          payment_status: orderData.payment_status,
          payment_method: orderData.payment_method,
          shipping_address: orderData.shipping_address,
          order_date: new Date().toISOString()
        }])
        .select("order_id")
        .single();

      if (orderError) throw orderError;

      set({ loading: false });
      return orderResult.order_id;
    } catch (error: any) {
      console.error("Error creating order:", error);
      set({ error: error.message || "Failed to create order", loading: false });
      return null;
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) throw error;

      // Update local state
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map((order: Order) =>
        order.id === orderId ? { ...order, status } : order
      );
      
      set({ 
        orders: updatedOrders,
        currentOrder: currentOrder?.id === orderId 
          ? { ...currentOrder, status } 
          : currentOrder,
        loading: false 
      });
      
    } catch (error: any) {
      console.error('Error updating order status:', error);
      set({ error: error.message || 'Failed to update order status', loading: false });
    }
  },

  async submitReview(review: Omit<Review, 'review_id' | 'created_at'>) {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: review.product_id,
          user_id: review.user_id || null,
          guest_session_id: review.guest_session_id || null,
          rating: review.rating,
          comment: review.comment || null,
          title: review.title || null,
          is_verified_purchase: review.is_verified_purchase || false,
          review_type: review.review_type || 'registered',
        })
        .select()
        .single();

      if (error) throw error;

      // Update local userReviews state
      const { userReviews } = get();
      const newReview: Review = {
        review_id: data.review_id,
        product_id: data.product_id,
        user_id: data.user_id,
        rating: data.rating,
        comment: data.comment,
        title: data.title || '',
        is_verified_purchase: data.is_verified_purchase,
        created_at: data.created_at,
      };

      set({
        userReviews: [...userReviews, newReview],
        loading: false
      });

    } catch (error: any) {
      console.error('Error submitting review:', error);
      set({ error: error.message || 'Failed to submit review', loading: false });
    }
  },

  async updateReview(reviewId: string, updates: Partial<Review>) {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: updates.rating,
          comment: updates.comment,
          title: updates.title,
          updated_at: new Date().toISOString()
        })
        .eq('review_id', reviewId)
        .select()
        .single();

      if (error) throw error;

      // Update local userReviews state
      const { userReviews } = get();
      const updatedUserReviews = userReviews.map(review =>
        review.review_id === reviewId
          ? { ...review, ...updates, updated_at: data.updated_at }
          : review
      );

      set({
        userReviews: updatedUserReviews,
        loading: false
      });

    } catch (error: any) {
      console.error('Error updating review:', error);
      set({ error: error.message || 'Failed to update review', loading: false });
    }
  },

  async fetchReviews(productId: string) {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          review_id,
          product_id,
          user_id,
          guest_session_id,
          rating,
          comment,
          title,
          is_verified_purchase,
          review_type,
          created_at,
          updated_at,
          user_profiles (
            first_name,
            last_name
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviews: Review[] = (data || []).map((item: any) => ({
        review_id: item.review_id,
        product_id: item.product_id,
        user_id: item.user_id,
        guest_session_id: item.guest_session_id,
        rating: item.rating,
        comment: item.comment,
        title: item.title || '',
        is_verified_purchase: item.is_verified_purchase,
        review_type: item.review_type,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_name: item.user_profiles ? `${item.user_profiles.first_name} ${item.user_profiles.last_name}`.trim() : 'Anonymous',
        user_avatar: undefined
      }));

      set({ reviews, loading: false });

    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      set({ error: error.message || 'Failed to fetch reviews', loading: false });
    }
  },

  async fetchUserReviews(userId: string) {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const reviews: Review[] = (data || []).map((item: any) => ({
        review_id: item.review_id,
        product_id: item.product_id,
        user_id: item.user_id,
        guest_session_id: item.guest_session_id,
        rating: item.rating,
        comment: item.comment,
        title: item.title || '',
        is_verified_purchase: item.is_verified_purchase,
        review_type: item.review_type,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      set({ userReviews: reviews, loading: false });
    } catch (error: any) {
      console.error('Error fetching user reviews:', error);
      set({ error: error.message || 'Failed to fetch user reviews', loading: false });
    }
  },

  clearError() { set({ error: null }); },

  setPage(page: number) {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
  },

  async verifyGuestOrderAccess(orderId: string, email: string, phone: string) {
    try {
      let query = supabase
        .from('orders')
        .select('order_id')
        .eq('order_id', orderId);

      if (email) query = query.eq('guest_email', email);
      if (phone) query = query.eq('guest_phone', phone);

      const { data, error } = await query.single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error verifying guest order access:', error);
      return false; // Explicit return for error case
    }
  },

  async cancelOrderItem(orderItemId: string, reason: string, userId?: string, guestSessionId?: string) {
    set({ loading: true, error: null });
    try {
      // Use the new Edge Function for cancelling items
      await updateOrderItemStatus({
        action: 'cancel_item',
        orderItemId,
        reason,
        guestSessionId
      });

      // Update local state
      get().updateOrderItemStatus(orderItemId, 'cancelled');

      set({ loading: false });
    } catch (error: any) {
      console.error('Error cancelling order item:', error);
      set({ error: error.message || 'Failed to cancel item', loading: false });
      throw error;
    }
  },

  async requestReturnItem(orderItemId: string, reason: string, userId?: string, guestSessionId?: string, imageFile?: File) {
    set({ loading: true, error: null });
    try {
      // Use the new Edge Function for requesting returns
      await updateOrderItemStatus({
        action: 'request_return',
        orderItemId,
        reason,
        guestSessionId
      });

      // Update local state
      get().updateOrderItemStatus(orderItemId, 'returned');

      set({ loading: false });
    } catch (error: any) {
      console.error('Error requesting return:', error);
      set({ error: error.message || 'Failed to request return', loading: false });
      throw error;
    }
  },

  updateOrderItemStatus(orderItemId: string, newStatus: string) {
    const { currentOrder, orders } = get();

    // Update currentOrder if it contains this item
    if (currentOrder && Array.isArray(currentOrder.items)) {
      const updatedItems = currentOrder.items.map((item: any) =>
        item.order_item_id === orderItemId
          ? { ...item, item_status: newStatus }
          : item
      );
      set({ currentOrder: { ...currentOrder, items: updatedItems } });
    }

    // Update orders list
    const updatedOrders = orders.map(order => {
      if (Array.isArray(order.items)) {
        const hasItem = order.items.some((item: any) => item.order_item_id === orderItemId);
        if (hasItem) {
          const updatedItems = order.items.map((item: any) =>
            item.order_item_id === orderItemId
              ? { ...item, item_status: newStatus }
              : item
          );
          return { ...order, items: updatedItems };
        }
      }
      return order;
    });

    set({ orders: updatedOrders });
  },

  async adminCancelOrderItem(orderItemId: string, reason: string, adminUserId: string) {
    set({ loading: true, error: null });
    try {
      await updateOrderItemStatus({
        action: 'cancel_item',
        orderItemId,
        reason,
        isAdmin: true,
        adminUserId
      });

      get().updateOrderItemStatus(orderItemId, 'cancelled');
      set({ loading: false });
    } catch (error: any) {
      console.error('Error admin cancelling order item:', error);
      set({ error: error.message || 'Failed to cancel item', loading: false });
      throw error;
    }
  },

  async adminShipOrderItem(orderItemId: string, adminUserId: string) {
    set({ loading: true, error: null });
    try {
      await updateOrderItemStatus({
        action: 'ship_item',
        orderItemId,
        isAdmin: true,
        adminUserId
      });

      get().updateOrderItemStatus(orderItemId, 'shipped');
      set({ loading: false });
    } catch (error: any) {
      console.error('Error admin shipping order item:', error);
      set({ error: error.message || 'Failed to ship item', loading: false });
      throw error;
    }
  },

  async adminDeliverOrderItem(orderItemId: string, adminUserId: string) {
    set({ loading: true, error: null });
    try {
      await updateOrderItemStatus({
        action: 'deliver_item',
        orderItemId,
        isAdmin: true,
        adminUserId
      });

      get().updateOrderItemStatus(orderItemId, 'delivered');
      set({ loading: false });
    } catch (error: any) {
      console.error('Error admin delivering order item:', error);
      set({ error: error.message || 'Failed to deliver item', loading: false });
      throw error;
    }
  },

  async adminRefundOrderItem(orderItemId: string, reason: string, adminUserId: string) {
    set({ loading: true, error: null });
    try {
      await updateOrderItemStatus({
        action: 'refund_item',
        orderItemId,
        reason,
        isAdmin: true,
        adminUserId
      });

      get().updateOrderItemStatus(orderItemId, 'refunded');
      set({ loading: false });
    } catch (error: any) {
      console.error('Error admin refunding order item:', error);
      set({ error: error.message || 'Failed to refund item', loading: false });
      throw error;
    }
  },
}));