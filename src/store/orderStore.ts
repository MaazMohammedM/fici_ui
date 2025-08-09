import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { Order, Review, OrderFilters } from '../types/order';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  reviews: Review[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchOrders: (userId: string, filters?: OrderFilters) => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'order_id' | 'order_date'>) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  submitReview: (review: Omit<Review, 'review_id' | 'created_at'>) => Promise<void>;
  fetchReviews: (productId: string) => Promise<void>;
  clearError: () => void;
}

// Mock data for demonstration
const mockOrders: Order[] = [
  {
    order_id: 'ORD001',
    user_id: 'user1',
    status: 'delivered',
    items: [
      {
        product_id: 'SH001_black',
        article_id: 'SH001',
        name: 'Premium Leather Shoes',
        color: 'Black',
        size: '9',
        image: 'https://via.placeholder.com/300x300?text=Leather+Shoes',
        price: 2999,
        mrp: 3999,
        quantity: 1,
        discount_percentage: 25
      },
      {
        product_id: 'SH002_brown',
        article_id: 'SH002',
        name: 'Casual Sneakers',
        color: 'Brown',
        size: '10',
        image: 'https://via.placeholder.com/300x300?text=Sneakers',
        price: 1999,
        mrp: 2499,
        quantity: 2,
        discount_percentage: 20
      }
    ],
    total_amount: 6997,
    discount_amount: 1501,
    tax_amount: 629,
    shipping_amount: 0,
    payment_method: 'Credit Card',
    payment_status: 'completed',
    shipping_address: {
      name: 'John Doe',
      phone: '+91 9876543210',
      address: '123 Main Street, Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    order_date: '2024-01-15T10:30:00Z',
    estimated_delivery: '2024-01-20T18:00:00Z',
    tracking_number: 'FICI1234567890',
    reviews_submitted: []
  },
  {
    order_id: 'ORD002',
    user_id: 'user1',
    status: 'shipped',
    items: [
      {
        product_id: 'SH003_white',
        article_id: 'SH003',
        name: 'Sport Running Shoes',
        color: 'White',
        size: '9',
        image: 'https://via.placeholder.com/300x300?text=Running+Shoes',
        price: 3499,
        mrp: 4999,
        quantity: 1,
        discount_percentage: 30
      }
    ],
    total_amount: 3814,
    discount_amount: 1500,
    tax_amount: 315,
    shipping_amount: 0,
    payment_method: 'UPI',
    payment_status: 'completed',
    shipping_address: {
      name: 'John Doe',
      phone: '+91 9876543210',
      address: '123 Main Street, Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    order_date: '2024-01-10T14:20:00Z',
    estimated_delivery: '2024-01-18T18:00:00Z',
    tracking_number: 'FICI0987654321',
    reviews_submitted: []
  },
  {
    order_id: 'ORD003',
    user_id: 'user1',
    status: 'confirmed',
    items: [
      {
        product_id: 'SH004_navy',
        article_id: 'SH004',
        name: 'Formal Oxford Shoes',
        color: 'Navy',
        size: '8',
        image: 'https://via.placeholder.com/300x300?text=Oxford+Shoes',
        price: 4999,
        mrp: 6999,
        quantity: 1,
        discount_percentage: 28
      }
    ],
    total_amount: 5449,
    discount_amount: 2000,
    tax_amount: 450,
    shipping_amount: 0,
    payment_method: 'Debit Card',
    payment_status: 'completed',
    shipping_address: {
      name: 'John Doe',
      phone: '+91 9876543210',
      address: '123 Main Street, Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    order_date: '2024-01-08T09:15:00Z',
    estimated_delivery: '2024-01-15T18:00:00Z',
    reviews_submitted: []
  }
];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  reviews: [],
  loading: false,
  error: null,

  fetchOrders: async (userId: string, filters?: OrderFilters) => {
    set({ loading: true, error: null });
    
    try {
      // For now, using mock data. In production, this would query Supabase
      let filteredOrders = mockOrders.filter(order => order.user_id === userId);
      
      if (filters?.status && filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.order_id.toLowerCase().includes(searchLower) ||
          order.items.some(item => item.name.toLowerCase().includes(searchLower))
        );
      }
      
      // Sort by order date (newest first)
      filteredOrders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
      
      set({ 
        orders: filteredOrders,
        loading: false 
      });
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ error: 'Failed to fetch orders', loading: false });
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ loading: true, error: null });
    
    try {
      // For now, using mock data
      const order = mockOrders.find(o => o.order_id === orderId);
      
      if (order) {
        set({ currentOrder: order, loading: false });
      } else {
        set({ error: 'Order not found', loading: false });
      }
      
    } catch (error) {
      console.error('Error fetching order:', error);
      set({ error: 'Failed to fetch order details', loading: false });
    }
  },

  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    
    try {
      // In production, this would create order in Supabase
      const orderId = `ORD${Date.now()}`;
      const newOrder: Order = {
        ...orderData,
        order_id: orderId,
        order_date: new Date().toISOString()
      };
      
      // Update mock data
      mockOrders.unshift(newOrder);
      
      set({ loading: false });
      return orderId;
      
    } catch (error) {
      console.error('Error creating order:', error);
      set({ error: 'Failed to create order', loading: false });
      return null;
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    set({ loading: true, error: null });
    
    try {
      // In production, this would update order in Supabase
      const orderIndex = mockOrders.findIndex(o => o.order_id === orderId);
      if (orderIndex !== -1) {
        mockOrders[orderIndex].status = status;
      }
      
      // Update local state
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map(order =>
        order.order_id === orderId ? { ...order, status } : order
      );
      
      set({ 
        orders: updatedOrders,
        currentOrder: currentOrder?.order_id === orderId 
          ? { ...currentOrder, status } 
          : currentOrder,
        loading: false 
      });
      
    } catch (error) {
      console.error('Error updating order status:', error);
      set({ error: 'Failed to update order status', loading: false });
    }
  },

  submitReview: async (review) => {
    set({ loading: true, error: null });
    
    try {
      // In production, this would save review to Supabase
      const newReview: Review = {
        ...review,
        review_id: `REV${Date.now()}`,
        created_at: new Date().toISOString(),
        is_verified_purchase: true
      };
      
      // Update mock data - mark review as submitted for this order/product
      const orderIndex = mockOrders.findIndex(o => o.order_id === review.order_id);
      if (orderIndex !== -1) {
        if (!mockOrders[orderIndex].reviews_submitted.includes(review.product_id)) {
          mockOrders[orderIndex].reviews_submitted.push(review.product_id);
        }
      }
      
      // Update local state
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map(order => {
        if (order.order_id === review.order_id) {
          return {
            ...order,
            reviews_submitted: [...order.reviews_submitted, review.product_id]
          };
        }
        return order;
      });
      
      set({ 
        orders: updatedOrders,
        currentOrder: currentOrder?.order_id === review.order_id 
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
      // In production, this would fetch reviews from Supabase
      // For now, returning empty array
      set({ reviews: [], loading: false });
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      set({ error: 'Failed to fetch reviews', loading: false });
    }
  },

  clearError: () => set({ error: null })
}));
