import React, { useState, useEffect, useCallback } from 'react';
import { Star, Plus } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { Button } from '../../../auth/ui';
import StarComponent from '@lib/util/StarComponent';
import type { Review } from '../../../services/reviewService';
import { fetchProductReviews } from '../../../services/reviewService';
import { db, collection, getDocs, query, where, orderBy, limit as limitFn } from '../../../lib/firebase';
import ReviewModal from '../../orders/components/ReviewModal';
import type { OrderItem } from '../../../types/order';
import { createPortal } from 'react-dom'; 
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userHasDeliveredOrder, setUserHasDeliveredOrder] = useState(false);
  const [verifyingPurchase, setVerifyingPurchase] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution | null>(null);
  const [userOrderItem, setUserOrderItem] = useState<OrderItem | null>(null);

  const calculateRatingDistribution = useCallback((reviewsList: Review[]): RatingDistribution => {
    const distribution: RatingDistribution = {
      '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
      total: 0, average: 0
    };
    if (reviewsList.length === 0) return distribution;
    const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
    reviewsList.forEach(review => {
      const key = review.rating.toString() as keyof Pick<RatingDistribution, '1'|'2'|'3'|'4'|'5'>;
      distribution[key]++;
    });
    return { ...distribution, total: reviewsList.length, average: Math.round((totalRating / reviewsList.length) * 10) / 10 };
  }, []);

  // Fetch reviews for the product
  const loadReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const reviewsData = await fetchProductReviews(productId);
      setReviews(reviewsData);
      setRatingDistribution(calculateRatingDistribution(reviewsData));
      if (user?.id) {
        const myReview = reviewsData.find((r: Review) => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, user?.id, calculateRatingDistribution]);

  const verifyUserPurchase = useCallback(async () => {
    if (!user?.id || !productId) return;
    setVerifyingPurchase(true);
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', user.id),
        where('status', '==', 'delivered')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (!orders?.length) {
        setUserHasDeliveredOrder(false);
        setUserOrderItem(null);
        return;
      }

      const orderIds = orders.map(o => (o as any).order_id || o.id);
      const orderItemsQuery = query(
        collection(db, 'order_items'),
        where('order_id', 'in', orderIds),
        where('product_id', '==', productId),
        where('item_status', '==', 'delivered')
      );
      
      const orderItemsSnapshot = await getDocs(orderItemsQuery);
      const orderItems = orderItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (!orderItems?.length) {
        setUserHasDeliveredOrder(false);
        setUserOrderItem(null);
        return;
      }

      setUserHasDeliveredOrder(true);
      setUserOrderItem(orderItems[0] as unknown as OrderItem);
    } catch (error) {
      console.error('Error checking user purchase:', error);
      setUserHasDeliveredOrder(false);
      setUserOrderItem(null);
    } finally {
      setVerifyingPurchase(false);
    }
  }, [user?.id, productId]);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      await Promise.all([loadReviews(), verifyUserPurchase()]);
    })();
  }, [productId, loadReviews, verifyUserPurchase, user?.id]);

  const handleOpenReviewModal = useCallback(async () => {
    if (!productId) return;

    setShowReviewModal(true);

    if (user && userHasDeliveredOrder && !userOrderItem && !verifyingPurchase) {
      await verifyUserPurchase();
    }
  }, [productId, user, userHasDeliveredOrder, userOrderItem, verifyingPurchase, verifyUserPurchase]);

  const handleCloseReviewModal = useCallback(() => {
    setShowReviewModal(false);
  }, []);

  const handleReviewSubmitted = async () => {
    await loadReviews(); 
    setShowReviewModal(false);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent"></div>
      </div>
    );
  }

  if (!loading && reviews.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No Reviews Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to review this product!</p>

        <div className="w-full flex justify-center mt-6 mb-4">
          {user && !userReview && userHasDeliveredOrder && (
            <Button
              onClick={handleOpenReviewModal} // CHANGED: use centralized opener
              className="bg-primary text-white hover:bg-primary-dark flex items-center px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Write a Review
            </Button>
          )}
        </div>

        {/* {user && !userHasDeliveredOrder && !verifyingPurchase && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Purchase this product to write a review
          </p>
        )} */}

        {verifyingPurchase && (
          <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 dark:border-gray-500 mr-2"></div>
            Checking purchase status...
          </div>
        )}

        {showReviewModal && productId && createPortal(
          userOrderItem ? (
            <ReviewModal
              key={`${userOrderItem.order_item_id}-${Date.now()}`}
              order={{
                id: userOrderItem.order_id || `temp-${Date.now()}`,
                items: [userOrderItem],
                status: 'delivered',
                created_at: new Date().toISOString(),
                subtotal: userOrderItem.price_at_purchase || 0,
                discount: 0,
                delivery_charge: 0,
                total_amount: userOrderItem.price_at_purchase || 0,
                effective_amount: userOrderItem.price_at_purchase || 0,
                payment_status: 'paid',
                payment_method: 'razorpay',
                shipping_address: {}
              }}
              item={userOrderItem}
              onClose={handleCloseReviewModal}
              onSubmit={() => {
                handleReviewSubmitted();
                handleCloseReviewModal();
              }}
            />
          ) : (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-dark2 rounded-lg px-6 py-4 shadow-lg">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-5 h-5 mr-2 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
                  Preparing your review form...
                </div>
              </div>
            </div>
          ),
          document.body
        )}
      </div>
    );
  }
  return (
    <div className={`bg-white dark:bg-dark1 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          {ratingDistribution && (
            <div className="flex items-center mt-1">
              <StarComponent rating={ratingDistribution?.average || 0} size="lg" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {ratingDistribution?.average || 0} out of 5 ({ratingDistribution?.total || 0} reviews)
              </span>
            </div>
          )}

          <div className="w-full flex justify-center mt-6 mb-4">
            {user && !userReview && userHasDeliveredOrder && (
              <Button
                onClick={handleOpenReviewModal} 
                className="bg-primary text-white hover:bg-primary-dark flex items-center px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
            )}
          </div>

          {user && !userHasDeliveredOrder && !verifyingPurchase && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Purchase this product to write a review
            </p>
          )}

          {verifyingPurchase && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 dark:border-gray-500 mr-2"></div>
              Checking purchase status...
            </div>
          )}
        </div>

        {showReviewModal && productId && createPortal(
          userOrderItem ? (
            <ReviewModal
              key={`${userOrderItem.order_item_id}-${Date.now()}`}
              order={{
                id: userOrderItem.order_id || `temp-${Date.now()}`,
                items: [userOrderItem],
                status: 'delivered',
                created_at: new Date().toISOString(),
                subtotal: userOrderItem.price_at_purchase || 0,
                discount: 0,
                delivery_charge: 0,
                total_amount: userOrderItem.price_at_purchase || 0,
                effective_amount: userOrderItem.price_at_purchase || 0,
                payment_status: 'paid',
                payment_method: 'razorpay',
                shipping_address: {}
              }}
              item={userOrderItem}
              onClose={handleCloseReviewModal}
              onSubmit={() => {
                handleReviewSubmitted();
                handleCloseReviewModal();
              }}
            />
          ) : (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-dark2 rounded-lg px-6 py-4 shadow-lg">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-5 h-5 mr-2 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
                  Preparing your review form...
                </div>
              </div>
            </div>
          ),
          document.body
        )}
      </div>

      <div className="mt-8 space-y-6">
        {reviews.map((review) => (
          <div key={review.review_id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">
                  {review.user?.user_metadata?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {review.user?.user_metadata?.full_name || 'Anonymous'}
                  </p>
                  <div className="flex items-center mt-1">
                    <StarComponent rating={review.rating} size="md" />
                    {review.is_verified_purchase && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>

            {review.comment && (
              <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerReviews;