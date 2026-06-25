import React from 'react';
import { Package } from 'lucide-react';
import type { Order } from '../../types/order-common';
import OrderItemCard from '../../features/orders/OrderItemCard';

interface OrderItemListProps {
  order: Order;
  isGuest: boolean;
  guestEmail?: string;
  guestPhone?: string | null;
  canCancelItem: (item: any) => boolean;
  canRequestReplacement: (item: any) => boolean;
  canAddReview: (item: any) => boolean;
  onCancelItem: (item: any, reason?: string) => void;
  onReplacementRequest: (item: any, reason?: string) => void;
  onAddReview: (item: any) => void;
  existingReviews?: Record<string, {
    rating: number;
    comment: string;
    created_at: string;
  }>;
  existingReplacements?: Record<string, {
    return_id: string;
    status: string;
    reason_description?: string | null;
  }>;
  existingRefunds?: Record<string, {
    refund_id: string;
    refund_status: 'initiated' | 'processed' | 'failed' | 'cancelled';
    refund_method: 'razorpay' | 'cod' | 'manual' | 'wallet';
    provider_reference?: string;
    arn?: string;
    refund_amount: number;
    created_at: string;
    processed_at?: string;
  }>;
  formatRefundMessage?: (refund: {
    refund_status: 'initiated' | 'processed' | 'failed' | 'cancelled';
    refund_method: 'razorpay' | 'cod' | 'manual' | 'wallet';
    provider_reference?: string;
    arn?: string;
    refund_amount: number;
    created_at: string;
    processed_at?: string;
  }) => {
    title: string;
    message: string;
    amount: number;
    method: string;
    arn?: string;
  } | null;
  getReplacementStatus?: (item: any) => string | null;
  getReplacementReason?: (item: any) => string | null;
}

export const OrderItemList: React.FC<OrderItemListProps> = ({
  order,
  isGuest,
  guestEmail,
  guestPhone,
  canCancelItem,
  canRequestReplacement,
  canAddReview,
  onCancelItem,
  onReplacementRequest,
  onAddReview,
  existingReviews = {},
  existingReplacements = {},
  existingRefunds = {},
  formatRefundMessage,
  getReplacementStatus,
  getReplacementReason
}) => {

  // Wrapper functions to handle optional reason parameter
  const handleCancelItem = (item: any) => {
    onCancelItem(item);
  };

  const handleReplacementRequest = (item: any) => {
    onReplacementRequest(item);
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
        <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Order Items ({order.order_items.length})
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {order.order_items.map((item) => (
          <OrderItemCard
            key={item.order_item_id}
            item={{
              ...item,
              order_item_id: item.order_item_id || item.product_id || '',
              size: item.size || 'N/A',
              thumbnail_url: item.thumbnail_url || item.product_thumbnail_url || '',
              price_at_purchase: item.price_at_purchase || 0,
              product_name: item.product_name || 'Product',
              product_thumbnail_url: item.product_thumbnail_url || item.thumbnail_url || ''
            }}
            onCancelItem={handleCancelItem}
            onReturnItem={handleReplacementRequest}
            onReplacementRequest={handleReplacementRequest}
            onAddReview={onAddReview}
            canCancelItem={canCancelItem}
            canReturnItem={canRequestReplacement}
            canAddReview={canAddReview}
            isGuest={isGuest}
            guestEmail={guestEmail}
            guestPhone={guestPhone}
            existingReview={existingReviews?.[item.product_id]}
            existingReplacement={existingReplacements?.[item.order_item_id]}
            existingRefunds={existingRefunds?.[item.order_item_id]}
            formatRefundMessage={formatRefundMessage}
            getReplacementStatus={getReplacementStatus}
            getReplacementReason={getReplacementReason}
          />
        ))}
      </div>

      {/* Price Summary */}
      <div className="mt-6 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total MRP</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ₹{order.order_items.reduce((total, item) => total + ((item.mrp || item.price_at_purchase) * item.quantity), 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-medium text-gray-900 dark:text-white">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Discount</span>
              <span className="font-medium text-green-600 dark:text-green-400">-₹{Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Delivery</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {order.delivery_charge === 0 ? 'Free' : `₹${order.delivery_charge?.toFixed(2) || '0.00'}`}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-base font-medium text-gray-900 dark:text-white">Total</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">₹{order.effective_amount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
