import React, { useState, useEffect } from 'react';
import { useOrderStore } from '@store/orderStore';
import { useAuthStore } from '@store/authStore';
import { Star, X, Send, Edit3 } from 'lucide-react';
import type { Order, OrderItem, Review } from '../../../types/order';

interface ReviewModalProps {
  order: Order;
  item: OrderItem;
  existingReview?: {
    rating: number;
    comment: string;
    title?: string;
    review_id?: string;
  } | null;
  onClose: () => void;
  onSubmit?: (reviewData: {
    rating: number;
    comment: string;
    title: string;
  }) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ order, item, existingReview, onClose, onSubmit }) => {
  
  const { submitReview, updateReview, loading } = useOrderStore();
  const { user, guestSession } = useAuthStore();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [title, setTitle] = useState(existingReview?.title || '');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!existingReview;
  const isGuest = !user;
  const reviewType = isGuest ? 'guest' : 'registered';

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
      setTitle(existingReview.title || '');
    }
  }, [existingReview]);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !title.trim()) return;

    setSubmitting(true);
    try {
      if (isEditing && existingReview?.review_id) {
        await updateReview(existingReview.review_id, {
          rating,
          comment: comment.trim(),
          title: title.trim(),
        });
      } else {
        // Handle both registered and guest users
        const reviewData: any = {
          product_id: item.product_id,
          rating,
          comment: comment.trim(),
          title: title.trim(),
          is_verified_purchase: true,
          review_type: reviewType,
        };

        if (user) {
          reviewData.user_id = user.id;
        } else if (guestSession) {
          reviewData.guest_session_id = guestSession.guest_session_id;
        }

        await submitReview(reviewData);
      }
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit({
          rating,
          comment: comment.trim(),
          title: title.trim()
        });
      } else {
        // Fallback to onClose if onSubmit is not provided
        onClose();
      }
    } catch (error) {
      console.error('Error submitting/updating review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Rate this product';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-dark2 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-light2/20 dark:border-gray-700 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark2 p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary dark:text-secondary font-primary flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit3 className="w-5 h-5" />
                  Edit Review
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  Write a Review
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <img
              src={item.thumbnail_url || '/placeholder-image.jpg'}
              alt={item.name || 'Product'}
              className="w-16 h-16 object-cover rounded-lg border border-light2/20 dark:border-gray-700"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.jpg';
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-primary dark:text-secondary font-primary">
                {item.name || `Product Name: ${item.product_name}`}
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-primary">
                Size: {item.size || 'N/A'} • Color: {item.color || 'N/A'}
              </div>
              <div className="text-lg font-semibold text-primary dark:text-secondary font-primary">
                ₹{item.price_at_purchase?.toLocaleString('en-IN') || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience in a few words..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {rating > 0 ? `${rating}/5` : 'Select rating'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={rating === 0 || !title.trim() || submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEditing ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isEditing ? 'Update Review' : 'Submit Review'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;