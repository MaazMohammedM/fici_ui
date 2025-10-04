import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { Order, Review, OrderFilters } from '../types/order';

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

  verifyGuestTPIN: async (tpin: string) => {
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

  fetchOrders: async (userId: string, filters: OrderFilters & { page?: number; limit?: number } = {}) => {
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
  

  fetchUserReviews: async (userId: string) => {
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
        rating: item.rating,
        comment: item.comment,
        title: item.title || '',
        is_verified_purchase: item.is_verified_purchase,
        created_at: item.created_at,
      }));

      set({ userReviews: reviews, loading: false });
    } catch (error: any) {
      console.error('Error fetching user reviews:', error);
      set({ error: error.message || 'Failed to fetch user reviews', loading: false });
    }
  },

  fetchOrderById: async (orderId: string, email?: string, phone?: string, tpin?: string): Promise<Order | null> => {
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

  createOrder: async (orderData) => {
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

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
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

  submitReview: async (review) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: review.product_id,
          user_id: review.user_id,
          rating: review.rating,
          comment: review.comment,
          title: review.title || '',
          is_verified_purchase: true,
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

  updateReview: async (reviewId: string, updates: Partial<Review>) => {
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

  fetchReviews: async (productId: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          review_id,
          product_id,
          user_id,
          rating,
          comment,
          title,
          is_verified_purchase,
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
        rating: item.rating,
        comment: item.comment,
        title: item.title || '',
        is_verified_purchase: item.is_verified_purchase,
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

  setPage: (page: number) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
  },

  fetchGuestOrders: async (email: string, phone: string, tpin?: string) => {
    set({ loading: true, error: null });
    try {
      // Build queries that include related order_items
      const baseSelect = `*, order_items (*)`;
      const queries: any[] = [];

      // First, try to find orders by guest_email, guest_phone, or guest_tpin
      if (email || phone || tpin) {
        const query = supabase
          .from('orders')
          .select(baseSelect, { count: 'exact' })
          .order('created_at', { ascending: false });

        // Build OR conditions for email, phone, and tpin
        const orConditions = [];
        if (email) {
          orConditions.push(`guest_email.eq.${email}`);
        }
        if (phone) {
          orConditions.push(`guest_phone.eq.${phone}`);
        }
        if (tpin) {
          // Check both guest_tpin and guest_pin_hash fields for TPIN
          orConditions.push(`guest_tpin.eq.${tpin}`);
          orConditions.push(`guest_pin_hash.eq.${tpin}`);
        }

        if (orConditions.length > 0) {
          query.or(orConditions.join(','));
          queries.push(query);
        }
      }

      // If no queries to run, set empty orders
      if (queries.length === 0) {
        set({
          orders: [],
          loading: false,
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        });
        return;
      }

      const results = await Promise.all(queries);

      // Check for errors in results
      for (const r of results) {
        if (r.error) {
          console.error('Error in guest order query:', r.error);
          // Don't throw for individual query errors, continue with successful ones
          continue;
        }
      }

      // Combine and deduplicate by order_id
      const orderMap = new Map<string, any>();
      for (const r of results) {
        if (r.data && Array.isArray(r.data)) {
          for (const row of r.data) {
            if (row?.order_id && !orderMap.has(row.order_id)) {
              orderMap.set(row.order_id, row);
            }
          }
        }
      }

      const uniqueOrders: any[] = Array.from(orderMap.values());
      const totalCount = uniqueOrders.length;

      const transformedOrders: Order[] = uniqueOrders.map((order: any) => {
        const guestEmail = order.guest_email;
        const guestPhone = order.guest_phone;
        const guestName = order.guest_name;

        return {
          id: order.order_id,
          user_id: order.user_id,
          guest_session_id: order.guest_session_id,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          guest_name: guestName,
          items: order.order_items || [],
          subtotal: order.subtotal || 0,
          discount: order.discount || 0,
          delivery_charge: order.delivery_charge || 0,
          total_amount: order.total_amount || 0,
          status: order.status || 'pending',
          payment_status: order.payment_status || 'pending',
          payment_method: order.payment_method || 'razorpay',
          payment_id: order.payment_id,
          shipping_address: order.shipping_address || {},
          billing_address: order.billing_address || {},
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          notes: order.notes,
          created_at: order.created_at || order.order_date || new Date().toISOString(),
          order_date: order.order_date,
          updated_at: order.updated_at,
          paid_at: order.paid_at,
          shipped_at: order.shipped_at,
          delivered_at: order.delivered_at,
          cancelled_at: order.cancelled_at,
          merged_at: order.merged_at,
          is_guest_order: true,
          guest_contact_info: {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
          },
        };
      });

      set({
        orders: transformedOrders,
        loading: false,
        pagination: {
          total: totalCount,
          page: 1,
          limit: 10,
          totalPages: Math.ceil(totalCount / 10),
        },
      });
    } catch (error: any) {
      console.error('Error fetching guest orders:', error);
      set({
        error: error.message || 'Failed to fetch guest orders',
        loading: false,
      });
    }
  },

  verifyGuestOrderAccess: async (orderId: string, email: string, phone: string) => {
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

  clearError: () => set({ error: null })
}));