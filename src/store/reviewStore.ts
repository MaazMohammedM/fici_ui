import { create } from 'zustand';
import { db, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from '@/lib/firebase';
import { useAuthStore } from './authStore';

interface Review {
  id: string;
  product_id: string;
  user_id?: string;
  rating: number;
  comment: string;
  title?: string;
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
  updateReview: (reviewId: string, rating: number, comment: string, title?: string) => Promise<void>;
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
      const q = query(
        collection(db, 'reviews'),
        where('product_id', '==', productId),
        orderBy('created_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const reviews: Review[] = [];
      
      for (const docSnap of snapshot.docs) {
        const reviewData = docSnap.data() as any;
        let userData = null;
        
        if (reviewData.user_id) {
          const userDocRef = doc(db, 'user_profiles', reviewData.user_id);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            userData = userDocSnap.data();
          }
        }
        
        reviews.push({
          id: docSnap.id,
          product_id: reviewData.product_id,
          user_id: reviewData.user_id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          title: reviewData.title,
          created_at: reviewData.created_at?.toDate?.()?.toISOString() || reviewData.created_at,
          updated_at: reviewData.updated_at?.toDate?.()?.toISOString() || reviewData.updated_at,
          user: userData ? {
            first_name: userData.first_name,
            last_name: userData.last_name
          } : undefined
        });
      }
      
      set({ reviews });
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
      const { user } = useAuthStore.getState();
      
      if (!user) {
        set({ error: 'User not authenticated' });
        return;
      }

      const reviewData = {
        product_id: productId,
        user_id: user.uid,
        rating,
        comment,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      await get().fetchProductReviews(productId);
    } catch (error) {
      console.error('Error adding review:', error);
      set({ error: 'Failed to add review' });
    } finally {
      set({ loading: false });
    }
  },

  updateReview: async (reviewId: string, rating: number, comment: string, title?: string) => {
    set({ loading: true, error: null });
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        rating,
        comment,
        title,
        updated_at: serverTimestamp()
      });

      // Refresh reviews for the product
      const review = get().reviews.find(r => r.id === reviewId);
      if (review) {
        await get().fetchProductReviews(review.product_id);
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
      const reviewRef = doc(db, 'reviews', reviewId);
      await deleteDoc(reviewRef);

      // Refresh reviews for the product
      const review = get().reviews.find(r => r.id === reviewId);
      if (review) {
        await get().fetchProductReviews(review.product_id);
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