import { create } from 'zustand';
import { supabase } from '@lib/supabase';

interface Review {
  review_id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface ReviewState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  
  fetchProductReviews: (productId: string) => Promise<void>;
  addReview: (productId: string, rating: number, comment: string) => Promise<void>;
  updateReview: (reviewId: string, rating: number, comment: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  loading: false,
  error: null,

  fetchProductReviews: async (productId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_profiles(first_name, last_name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch reviews error:', error);
        set({ error: 'Failed to fetch reviews' });
      } else {
        set({ reviews: data || [] });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      set({ error: 'Failed to fetch reviews' });
    } finally {
      set({ loading: false });
    }
  },

  addReview: async (productId: string, rating: number, comment: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ error: 'User not authenticated' });
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment
        });

      if (error) {
        console.error('Add review error:', error);
        set({ error: 'Failed to add review' });
      } else {
        await get().fetchProductReviews(productId);
      }
    } catch (error) {
      console.error('Error adding review:', error);
      set({ error: 'Failed to add review' });
    } finally {
      set({ loading: false });
    }
  },

  updateReview: async (reviewId: string, rating: number, comment: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ rating, comment, updated_at: new Date().toISOString() })
        .eq('review_id', reviewId);

      if (error) {
        console.error('Update review error:', error);
        set({ error: 'Failed to update review' });
      } else {
        // Refresh reviews for the product
        const review = get().reviews.find(r => r.review_id === reviewId);
        if (review) {
          await get().fetchProductReviews(review.product_id);
        }
      }
    } catch (error) {
      console.error('Error updating review:', error);
      set({ error: 'Failed to update review' });
    } finally {
      set({ loading: false });
    }
  },

  deleteReview: async (reviewId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('review_id', reviewId);

      if (error) {
        console.error('Delete review error:', error);
        set({ error: 'Failed to delete review' });
      } else {
        // Refresh reviews for the product
        const review = get().reviews.find(r => r.review_id === reviewId);
        if (review) {
          await get().fetchProductReviews(review.product_id);
        }
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      set({ error: 'Failed to delete review' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null })
})); 