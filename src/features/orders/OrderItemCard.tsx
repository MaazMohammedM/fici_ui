import React from 'react';
import { XCircle, CheckCircle, Clock, Package, Star } from 'lucide-react';

interface OrderItem {
  order_item_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  thumbnail_url: string;
  product_name: string;
  product_thumbnail_url: string;
  mrp?: number;
  color?: string;
  item_status?: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded';
  cancel_reason?: string;
  return_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
  return_requested_at?: string;
  return_approved_at?: string;
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface OrderItemCardProps {
  item: OrderItem;
  onCancelItem?: (item: OrderItem) => void;
  onReturnItem?: (item: OrderItem) => void;
  onAddReview?: (item: OrderItem) => void;
  canCancelItem?: (item: OrderItem) => boolean;
  canReturnItem?: (item: OrderItem) => boolean;
  canAddReview?: (item: OrderItem) => boolean;
  isGuest?: boolean;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({
  item,
  onCancelItem,
  onReturnItem,
  onAddReview,
  canCancelItem = () => false,
  canReturnItem = () => false,
  canAddReview = () => false,
  isGuest = false
}) => {
  const getItemStatusColor = (status?: string) => {
    const colors = {
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      refunded: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  // Add this component inside your OrderDetailsPage component, or as a separate component if preferred
const ShippingDetails = ({ item }: { item: OrderItem }) => {
  if (item.item_status !== 'shipped') return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
        Shipping Information
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Courier:</span>{' '}
          <span className="font-medium">{item.shipping_partner}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Tracking #:</span>{' '}
          <span className="font-mono">{item.tracking_id}</span>
        </div>
        {item.tracking_url && (
          <div className="sm:col-span-2">
            <a
              href={item.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
            >
              Track Package
              <svg
                className="w-3.5 h-3.5 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
        {item.shipped_at && (
          <div className="sm:col-span-2 text-sm text-gray-500 dark:text-gray-400">
            Shipped on: {new Date(item.shipped_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};
  const getStatusIcon = (status?: string) => {
    const icons = {
      delivered: <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />,
      shipped: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />,
      cancelled: <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />,
      returned: <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />,
      refunded: <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />,
      pending: <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600" />
    };
    return icons[status as keyof typeof icons] || icons.pending;
  };

  const canCancel = !isGuest && canCancelItem(item);
  const canReturn = !isGuest && canReturnItem(item);
  const canReview = !isGuest && canAddReview(item);
  const itemStatus = item.item_status || 'pending';
  const totalPrice = (item.price_at_purchase * item.quantity).toLocaleString('en-IN');
  const totalMrp = item.mrp ? (item.mrp * item.quantity).toLocaleString('en-IN') : null;
  const savings = item.mrp && item.mrp > item.price_at_purchase 
    ? ((item.mrp - item.price_at_purchase) * item.quantity).toLocaleString('en-IN') 
    : null;

  const statusSteps = [
    { key: 'ordered', label: 'Ordered', active: ['pending', 'shipped', 'delivered'].includes(itemStatus) },
    { key: 'shipped', label: 'Shipped', active: ['shipped', 'delivered'].includes(itemStatus) },
    { key: 'delivered', label: 'Delivered', active: itemStatus === 'delivered' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-shadow">
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={item.product_thumbnail_url || item.thumbnail_url}
            alt={item.product_name}
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-cover rounded-md border border-gray-200 dark:border-gray-600"
            loading="lazy"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3 overflow-hidden">
          {/* Title and Status Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm md:text-base lg:text-lg leading-snug pr-2 break-words whitespace-normal"
                title={item.product_name}
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxHeight: '2.8em',
                  lineHeight: '1.4em'
                }}
              >
                {item.product_name}
              </h3>

              {/* Product Attributes - Mobile Horizontal Layout */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {item.size && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Size:</span>
                    <span>{item.size}</span>
                  </div>
                )}
                {item.color && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Color:</span>
                    <span className="capitalize">{item.color}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="font-medium">Qty:</span>
                  <span>{item.quantity}</span>
                </div>
              </div>

              {/* Price Information */}
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                  ₹{totalPrice}
                </span>
                {totalMrp && savings && (
                  <>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                      ₹{totalMrp}
                    </span>
                    <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Save ₹{savings}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {getStatusIcon(itemStatus)}
              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${getItemStatusColor(itemStatus)}`}>
                {itemStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Status Timeline - Desktop Version */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm overflow-x-auto pb-1">
            {statusSteps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-1 whitespace-nowrap ${step.active ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current flex-shrink-0"></div>
                  <span>{step.label}</span>
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={`flex-1 min-w-[20px] max-w-[60px] h-0.5 ${statusSteps[index + 1].active ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Status Timeline - Mobile Compact Version */}
          <div className="sm:hidden flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
            {statusSteps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-1 whitespace-nowrap ${step.active ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></div>
                  <span>{step.label.slice(0, 3)}</span>
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={`flex-1 min-w-[20px] max-w-[40px] h-0.5 ${statusSteps[index + 1].active ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
{/* Inside your order item mapping/render */}
<div className="space-y-2">
  {/* Existing item details... */}
  <ShippingDetails item={item} />
</div>
          {/* Status Messages */}
          {['cancelled', 'returned', 'refunded'].includes(itemStatus) && (item.cancel_reason || item.return_reason) && (
            <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Reason:</span> {item.cancel_reason || item.return_reason}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {!isGuest && (canCancel || canReturn || canReview) && (
            <div className="flex flex-col xs:flex-row gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              {canCancel && (
                <button
                  onClick={() => onCancelItem?.(item)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium touch-manipulation"
                  aria-label="Cancel this item"
                >
                  Cancel Item
                </button>
              )}
              {canReturn && (
                <button
                  onClick={() => onReturnItem?.(item)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium touch-manipulation"
                  aria-label="Request return for this item"
                >
                  Request Return
                </button>
              )}
              {canReview && (
                <button
                  onClick={() => onAddReview?.(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:bg-yellow-700 transition-colors font-medium touch-manipulation"
                  aria-label="Add review for this item"
                >
                  <Star className="w-4 h-4" />
                  Add Review
                </button>
              )}
            </div>
          )}

          {!isGuest && !canCancel && !canReturn && !canReview && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg inline-block">
                No actions available
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderItemCard;