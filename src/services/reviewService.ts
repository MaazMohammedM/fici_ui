import { db, collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc } from '../lib/firebase';

export interface Review {
  review_id: string;
  user_id?: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  is_verified_purchase: boolean;
  title?: string;
  guest_session_id?: string;
  review_type: 'registered' | 'guest';
  user?: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export const fetchProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    // First, fetch reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('product_id', '==', productId),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(reviewsQuery);
    const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (!reviews?.length) return [];

    // For registered users, fetch their profile information
    const registeredUserIds = reviews
      .filter(review => review.id)
      .map(review => review.id);

    const userProfiles: Record<string, any> = {};

    if (registeredUserIds.length > 0) {
      const profilesQuery = query(
        collection(db, 'user_profiles'),
        where('user_id', 'in', registeredUserIds)
      );
      
      const profilesSnapshot = await getDocs(profilesQuery);
      const profiles = profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      profiles.forEach(profile => {
        const profileData = profile as any;
        userProfiles[profileData.user_id] = {
          email: profileData.email,
          user_metadata: {
            full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Anonymous',
            // Add avatar_url if available in your user_profiles
          }
        };
      });
    }

    // Combine reviews with user data
    const reviewsWithUserData = reviews.map(review => {
      const reviewData = review as any;
      return {
        ...reviewData,
        user: userProfiles[reviewData.user_id] || {
          email: reviewData.guest_session_id ? 'Guest User' : 'Anonymous',
          user_metadata: {
            full_name: reviewData.guest_session_id ? 'Guest User' : 'Anonymous',
            avatar_url: undefined
          }
        }
      };
    });

    return reviewsWithUserData;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const addProductReview = async (review: Omit<Review, 'review_id' | 'created_at' | 'updated_at'>) => {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...review,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return { id: docRef.id, ...review };
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};
