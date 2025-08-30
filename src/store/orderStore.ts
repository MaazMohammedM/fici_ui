import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { Order, Review, OrderFilters } from '../types/order';

// Mock orders data (you can move this to a separate file if needed)
const mockOrders: Order[] = [];

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  reviews: Review[];
  loading: boolean;
  error: string | null;
  fetchOrders: (userId: string, filters?: OrderFilters) => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'created_at'>) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  submitReview: (review: Omit<Review, 'review_id' | 'created_at'>) => Promise<void>;
  fetchReviews: (productId: string) => Promise<void>;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  reviews: [],
  loading: false,
  error: null,

  fetchOrders: async (userId: string, filters?: OrderFilters) => {
    set({ loading: true, error: null });
    try {
      let filteredOrders = mockOrders.filter((order: Order) => order.user_id === userId);
      if (filters?.status && filters.status !== 'all') {
        filteredOrders = filteredOrders.filter((order: Order) => order.status === filters.status);
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredOrders = filteredOrders.filter((order: Order) =>
          order.id.toLowerCase().includes(searchLower) ||
          order.items.some((item: any) => item.name.toLowerCase().includes(searchLower))
        );
      }
      filteredOrders.sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      set({ 
        orders: filteredOrders,
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching:', error);
      set({ error: 'Failed to fetch', loading: false });
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ loading: true, error: null });
    
    try {
      const order = mockOrders.find((o: Order) => o.id === orderId);
      
      if (order) {
        set({ currentOrder: order, loading: false });
      } else {
        set({ error: 'Order not found', loading: false });
      }
      
    } catch (error) {
      console.error('Error fetching :', error);
      set({ error: 'Failed to fetch details', loading: false });
    }
  },

  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    
    try {
      const orderId = `ORD${Date.now()}`;
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        created_at: new Date().toISOString()
      };
      mockOrders.unshift(newOrder);
      
      set({ loading: false });
      return orderId;
      
    } catch (error) {
      console.error('Error creating:', error);
      set({ error: 'Failed to create', loading: false });
      return null;
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    set({ loading: true, error: null });
    
    try {
      const orderIndex = mockOrders.findIndex((o: Order) => o.id === orderId);
      if (orderIndex !== -1) {
        mockOrders[orderIndex].status = status;
      }
      
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
      
    } catch (error) {
      console.error('Error updating status:', error);
      set({ error: 'Failed to update status', loading: false });
    }
  },

  submitReview: async (review) => {
    set({ loading: true, error: null });
    
    try {
      // Insert review into Supabase
      const {data, error } = await supabase
        .from('reviews')
        .insert({
          order_id: review.order_id,
          product_id: review.product_id,
          user_id: review.user_id,
          rating: review.rating,
          comment: review.comment,
          title: review.title || '', // Add default title if missing
          images: review.images || [], // Add default images if missing
          is_verified_purchase: true
        })
        .select()
        .single();
        console.log("Data",data);

      if (error) throw error;

      const orderIndex = mockOrders.findIndex((o: Order) => o.id === review.order_id);
      if (orderIndex !== -1) {
        if (!mockOrders[orderIndex].reviews_submitted.includes(review.product_id)) {
          mockOrders[orderIndex].reviews_submitted.push(review.product_id);
        }
      }

      // Update local state
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map((order: Order) => {
        if (order.id === review.order_id) {
          return {
            ...order,
            reviews_submitted: [...order.reviews_submitted, review.product_id]
          };
        }
        return order;
      });
      
      set({ 
        orders: updatedOrders,
        currentOrder: currentOrder?.id === review.order_id 
          ? { 
              ...currentOrder, 
              reviews_submitted: [...currentOrder.reviews_submitted, review.product_id] 
            }
          : currentOrder,
        loading: false 
      });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      set({ error: 'Failed to submit review', loading: false });
    }
  },

  fetchReviews: async (productId: string) => {
    set({ loading: true, error: null });
    
    try {
      // Fetch reviews from Supabase
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          review_id,
          order_id,
          product_id,
          user_id,
          rating,
          comment,
          title,
          images,
          is_verified_purchase,
          created_at,
          users (
            full_name,
            avatar_url
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match your Review type
      const reviews: Review[] = (data || []).map((item: any) => ({
        review_id: item.review_id,
        order_id: item.order_id,
        product_id: item.product_id,
        user_id: item.user_id,
        rating: item.rating,
        comment: item.comment,
        title: item.title || '',
        images: item.images || [],
        is_verified_purchase: item.is_verified_purchase,
        created_at: item.created_at,
        user_name: item.users?.[0]?.full_name || item.users?.full_name || 'Anonymous',
        user_avatar: item.users?.[0]?.avatar_url || item.users?.avatar_url || null
      }));

      set({ reviews, loading: false });
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      set({ error: 'Failed to fetch reviews', loading: false });
    }
  },

  clearError: () => set({ error: null })
}));