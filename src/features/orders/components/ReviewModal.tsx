import React, { useState, useEffect } from 'react';
import { useOrderStore } from '@store/orderStore';
import { useAuthStore } from '@store/authStore';
import { Star, X, Send, Edit3 } from 'lucide-react';
import type { Order, OrderItem, Review } from '../../../types/order';

interface ReviewModalProps {
  order: Order;
  item: OrderItem;
  existingReview?: Review | null;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ order, item, existingReview, onClose }) => {
  const { submitReview, updateReview, loading } = useOrderStore();
  const { user } = useAuthStore();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!existingReview;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      if (isEditing && existingReview) {
        await updateReview(existingReview.review_id, {
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
      } else {
        await submitReview({
          product_id: item.product_id,
          user_id: user.id,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
      }
      onClose();
    } catch (error) {
      console.log("Order",order);
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
                {item.name || `Product ID: ${item.product_id}`}
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
        <form onSubmit={handleSubmit} className="p-6">
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-primary dark:text-secondary mb-3 font-primary">
              Rating *
            </label>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-accent fill-accent'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-primary">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-primary dark:text-secondary mb-2 font-primary">
              Review Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark1 text-primary dark:text-secondary placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-primary"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-primary">
              {title.length}/100 characters
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-primary dark:text-secondary mb-2 font-primary">
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this product..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark1 text-primary dark:text-secondary placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none font-primary"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-primary">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitting || loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-active disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 font-semibold disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none font-primary"
            >
              {submitting || loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isEditing ? <Edit3 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {isEditing ? 'Update Review' : 'Submit Review'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;