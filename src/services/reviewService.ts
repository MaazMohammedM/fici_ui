import { supabase } from '../lib/supabase';

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
    // First, fetch the reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;
    if (!reviews?.length) return [];

    // For registered users, fetch their profile information
    const registeredUserIds = reviews
      .filter(review => review.user_id)
      .map(review => review.user_id);

    let userProfiles: Record<string, any> = {};

    if (registeredUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', registeredUserIds);

      if (!profilesError && profiles) {
        profiles.forEach(profile => {
          userProfiles[profile.user_id] = {
            email: profile.email,
            user_metadata: {
              full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous',
              // Add avatar_url if available in your user_profiles
            }
          };
        });
      }
    }

    // Combine reviews with user data
    const reviewsWithUserData = reviews.map(review => ({
      ...review,
      user: userProfiles[review.user_id!] || {
        email: review.guest_session_id ? 'Guest User' : 'Anonymous',
        user_metadata: {
          full_name: review.guest_session_id ? 'Guest User' : 'Anonymous',
          avatar_url: undefined
        }
      }
    }));

    return reviewsWithUserData;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const addProductReview = async (review: Omit<Review, 'review_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};
