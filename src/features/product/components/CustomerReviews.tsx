import React, { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Edit3, Trash2 } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { Button } from '../../../auth/ui';
import StarComponent from '@lib/util/StarComponent';
// Removed unused import
import type { Review } from '../../../services/reviewService';
import { fetchProductReviews, addProductReview } from '../../../services/reviewService';
import { supabase } from '../../../lib/supabase';
// No need to import User type since it's not used

interface RatingDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  total: number;
  average: number;
}

interface CustomerReviewsProps {
  productId?: string;
  className?: string;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ productId, className = '' }) => {
  const { user } = useAuthStore();
  // Removed unused productStore since it's not used in this component
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [verifyingPurchase, setVerifyingPurchase] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState<{ rating: number; comment: string }>({ 
    rating: 5, 
    comment: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution | null>(null);

  // Calculate rating distribution
  const calculateRatingDistribution = useCallback((reviewsList: Review[]): RatingDistribution => {
    const distribution: RatingDistribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      total: 0,
      average: 0
    };

    if (reviewsList.length === 0) {
      return distribution;
    }

    const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
    reviewsList.forEach(review => {
      const ratingKey = review.rating.toString() as keyof Pick<RatingDistribution, '1' | '2' | '3' | '4' | '5'>;
      distribution[ratingKey]++;
    });

    return {
      ...distribution,
      total: reviewsList.length,
      average: Math.round((totalRating / reviewsList.length) * 10) / 10
    };
  }, []);

  // Fetch reviews for the product
  const loadReviews = useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const reviewsData = await fetchProductReviews(productId);
      setReviews(reviewsData);
      setRatingDistribution(calculateRatingDistribution(reviewsData));
      
      // Check if current user has a review
      if (user?.id) {
        const userReview = reviewsData.find((r: Review) => r.user_id === user.id);
        setUserReview(userReview || null);
        if (userReview) {
          setReviewForm({
            rating: userReview.rating,
            comment: userReview.comment || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, user?.id, calculateRatingDistribution]);

  // Check if user has purchased the product
  const verifyUserPurchase = useCallback(async () => {
    if (!user?.id || !productId) return;

    setVerifyingPurchase(true);
    try {
      // First, get orders for this user
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('order_id')
        .eq('user_id', user.id)
        .in('status', ['paid', 'shipped', 'delivered']);

      if (ordersError) {
        console.error('Error fetching user orders:', ordersError);
        setUserHasPurchased(false);
        return;
      }

      if (!orders || orders.length === 0) {
        setUserHasPurchased(false);
        return;
      }

      // Then, check if any of these orders contain the current product
      const orderIds = orders.map(order => order.order_id);
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
        .eq('product_id', productId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        setUserHasPurchased(false);
        return;
      }

      setUserHasPurchased(!!(orderItems && orderItems.length > 0));
    } catch (error) {
      console.error('Error checking user purchase:', error);
      setUserHasPurchased(false);
    } finally {
      setVerifyingPurchase(false);
    }
  }, [user?.id, productId]);

  // Load initial data
  useEffect(() => {
    if (productId) {
      const initializeData = async () => {
        await Promise.all([
          loadReviews(),
          verifyUserPurchase()
        ]);
      };
      initializeData();
    }
  }, [productId, loadReviews, verifyUserPurchase, user?.id]);

  // Handle review form submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !user?.id || submitting) return;

    setSubmitting(true);
    try {
      const reviewData = {
        user_id: user.id,
        product_id: productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        is_verified_purchase: userHasPurchased,
        title: '',
        review_type: 'registered' as const
      };

      await addProductReview(reviewData);
      await loadReviews();
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render no reviews state
  if (!loading && reviews.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
        <p className="text-gray-600 mb-4">Be the first to review this product!</p>
        {user && userHasPurchased && (
          <Button
            onClick={() => setShowReviewForm(true)}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            <Plus className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        )}

        {user && !userHasPurchased && !verifyingPurchase && (
          <p className="text-sm text-gray-500 italic">
            Purchase this product to write a review
          </p>
        )}

        {verifyingPurchase && (
          <div className="flex items-center justify-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 mr-2"></div>
            Checking purchase status...
          </div>
        )}
      </div>
    );
  }

  // Render reviews
  return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          {ratingDistribution && (
            <div className="flex items-center mt-1">
              <StarComponent rating={ratingDistribution?.average || 0} size="lg" />
              <span className="ml-2 text-gray-600">
                {ratingDistribution?.average || 0} out of 5 ({ratingDistribution?.total || 0} reviews)
              </span>
            </div>
          )}
        
        {user && !userReview && userHasPurchased && (
          <Button
            onClick={() => setShowReviewForm(true)}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            <Plus className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        )}

        {user && !userHasPurchased && !verifyingPurchase && (
          <p className="text-sm text-gray-500 italic">
            Purchase this product to write a review
          </p>
        )}

        {verifyingPurchase && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 mr-2"></div>
            Checking purchase status...
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {editingReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <form onSubmit={handleReviewSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= reviewForm.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                id="comment"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Share your thoughts about this product..."
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, comment: e.target.value })
                }
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                  setReviewForm({ rating: 5, comment: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.review_id} className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                  {review.user?.user_metadata?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {review.user?.user_metadata?.full_name || 'Anonymous'}
                  </p>
                  <div className="flex items-center">
                    <StarComponent rating={review.rating} size="md" />
                    {review.is_verified_purchase && (
                      <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {review.comment && (
              <p className="mt-2 text-gray-700">{review.comment}</p>
            )}
            
            {user?.id === review.user_id && (
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => {
                    setReviewForm({
                      rating: review.rating,
                      comment: review.comment || ''
                    });
                    setEditingReview(review);
                    setShowReviewForm(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Edit3 className="h-4 w-4 mr-1" /> Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this review?')) {
                      try {
                        const { error } = await supabase
                          .from('reviews')
                          .delete()
                          .eq('review_id', review.review_id);
                        
                        if (!error) {
                          await loadReviews();
                        }
                      } catch (error) {
                        console.error('Error deleting review:', error);
                      }
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerReviews;
