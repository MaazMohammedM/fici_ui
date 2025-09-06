import React, { useState, useEffect } from 'react';
import { Star, Plus, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { Button } from '../../../auth/ui';
import StarComponent from '@lib/util/StarComponent';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

interface CustomerReviewsProps {
  productId?: string;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ productId }) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchReviews();
      if (user) {
        checkUserPurchase();
      }
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
      
      // Check if current user has already reviewed
      if (user) {
        const existingReview = data?.find(review => review.user_id === user.id);
        setUserReview(existingReview || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserPurchase = async () => {
    if (!user || !productId) return;

    try {
      // Check if user has purchased this product
      const { data, error } = await supabase
        .from('order_items')
        .select(` 
          order_id,
          orders!inner (
            user_id,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'delivered');

      if (error) throw error;
      setUserHasPurchased((data && data.length > 0) || false);
    } catch (error) {
      console.error('Error checking user purchase:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !productId || !reviewForm.comment.trim()) return;

    setSubmitting(true);
    try {
      if (editingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: reviewForm.rating,
            comment: reviewForm.comment.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReview.id);

        if (error) throw error;
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            user_id: user.id,
            product_id: productId,
            rating: reviewForm.rating,
            comment: reviewForm.comment.trim()
          });

        if (error) throw error;
      }

      // Reset form and refresh reviews
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
      setEditingReview(null);
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      await fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReview(review);
    setReviewForm({ rating: review.rating, comment: review.comment });
    setShowReviewForm(true);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-2">
            Customer Reviews
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center space-x-2">
              <StarComponent rating={averageRating} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {averageRating.toFixed(1)} out of 5 ({reviews.length} reviews)
              </span>
            </div>
          )}
        </div>
        
        {user && userHasPurchased && !userReview && (
          <Button
            onClick={() => setShowReviewForm(true)}
            leftIcon={Plus}
            size="sm"
          >
            Write Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white dark:bg-dark2 p-6 rounded-2xl shadow-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {editingReview ? 'Edit Review' : 'Write a Review'}
          </h3>
          
          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                  className={`p-1 ${
                    star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Comment</label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmitReview}
              loading={submitting}
              disabled={!reviewForm.comment.trim()}
            >
              {editingReview ? 'Update Review' : 'Submit Review'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewForm(false);
                setEditingReview(null);
                setReviewForm({ rating: 5, comment: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No reviews yet</p>
          {user && userHasPurchased && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Be the first to review this product!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-dark2 p-6 rounded-2xl shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {getInitials(review.user_profiles?.first_name, review.user_profiles?.last_name)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary dark:text-secondary">
                      {review.user_profiles?.first_name} {review.user_profiles?.last_name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <StarComponent rating={review.rating} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {user && user.id === review.user_id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditReview(review)}
                      className="p-2 text-gray-400 hover:text-accent transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {!user && (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Sign in to write a review
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;