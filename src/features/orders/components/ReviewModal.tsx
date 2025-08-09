import React, { useState } from 'react';
import { useOrderStore } from '@store/orderStore';
import { useAuthStore } from '@store/authStore';
import type { Order, OrderItem } from '../../../types/order';

interface ReviewModalProps {
  order: Order;
  item: OrderItem;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ order, item, onClose }) => {
  const { submitReview, loading } = useOrderStore();
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!title.trim() || !comment.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await submitReview({
        order_id: order.order_id,
        product_id: item.product_id,
        user_id: user.id,
        rating,
        title,
        comment,
        images: [], // In production, you'd upload images first
      });

      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).slice(0, 5 - images.length);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const StarButton = ({ index }: { index: number }) => {
    const filled = index <= (hoveredRating || rating);
    
    return (
      <button
        type="button"
        onClick={() => setRating(index)}
        onMouseEnter={() => setHoveredRating(index)}
        onMouseLeave={() => setHoveredRating(0)}
        className={`w-8 h-8 transition-colors ${
          filled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        } hover:text-yellow-400`}
      >
        <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-[color:var(--color-dark2)] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
              Write a Review
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Product Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-[color:var(--color-dark1)] rounded-lg">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  {item.name}
                </h3>
                <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                  Color: {item.color} | Size: {item.size}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
                Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((index) => (
                  <StarButton key={index} index={index} />
                ))}
                <span className="ml-3 text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                  {rating > 0 && (
                    <>
                      {rating} out of 5 stars
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience in a few words"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]"
                required
                maxLength={100}
              />
              <p className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-50 mt-1">
                {title.length}/100 characters
              </p>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about your experience with this product..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] resize-none"
                required
                maxLength={1000}
              />
              <p className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-50 mt-1">
                {comment.length}/1000 characters
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
                Add Photos (Optional)
              </label>
              <div className="space-y-3">
                {images.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-[color:var(--color-dark1)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG or JPEG (Max 5 images)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Helpful Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Tips for a helpful review:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Share details about fit, quality, and comfort</li>
                <li>• Mention if the product met your expectations</li>
                <li>• Include photos to help other customers</li>
                <li>• Be honest and constructive</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-[color:var(--color-dark2)] border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0 || !title.trim() || !comment.trim()}
              className="px-6 py-3 bg-[color:var(--color-accent)] text-white rounded-lg font-medium hover:bg-[color:var(--color-accent)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
