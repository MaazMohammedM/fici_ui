import React, { useState } from 'react';
import { XCircle, CheckCircle, Clock, Package, Star, Edit3 } from 'lucide-react';
import GuestActionModal from '../../components/order/GuestActionModal';

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
  item_status?: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded' | 'replacement_requested' | 'replacement_initiated' | 'replacement_shipped' | 'replacement_delivered' | 'replacement_rejected' | 'returned_to_warehouse';
  cancel_reason?: string;
  return_reason?: string;
  replacement_reason?: string;
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
  onCancelItem?: (item: OrderItem, reason?: string) => void;
  onReturnItem?: (item: OrderItem, reason?: string) => void;
  onReplacementRequest?: (item: OrderItem, availableSizes?: string[]) => void;
  onAddReview?: (item: OrderItem) => void;
  canCancelItem?: (item: OrderItem) => boolean;
  canReturnItem?: (item: OrderItem) => boolean;
  canRequestReplacement?: (item: OrderItem) => boolean;
  canAddReview?: (item: OrderItem) => boolean;
  isGuest?: boolean;
  guestEmail?: string;
  guestPhone?: string | null;
  existingReview?: {
    rating: number;
    comment: string;
    created_at: string;
  } | null;
  existingReplacement?: {
    return_id: string;
    status: string;
    reason_description?: string | null;
    reason_code?: string | null;
    requested_size?: string | null;
    pickup_partner?: string | null;
    replacement_tracking_id?: string | null;
    replacement_tracking_url?: string | null;
    approved_by?: string | null;
    resolved_at?: string | null;
  } | null;
  existingRefunds?: {
    refund_id: string;
    refund_status: 'initiated' | 'processed' | 'failed' | 'cancelled';
    refund_method: 'razorpay' | 'cod' | 'manual' | 'wallet';
    provider_reference?: string;
    arn?: string;
    refund_amount: number;
    created_at: string;
    processed_at?: string;
  } | null;
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
  getReplacementStatus?: (item: OrderItem) => string | null;
  getReplacementReason?: (item: OrderItem) => string | null;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({
  item,
  onCancelItem,
  onReturnItem,
  onReplacementRequest,
  onAddReview,
  canCancelItem = () => false,
  canReturnItem = () => false,
  canRequestReplacement = () => false,
  canAddReview = () => false,
  isGuest = false,
  guestEmail,
  guestPhone,
  existingReview = null,
  existingReplacement = null,
  existingRefunds = null,
  formatRefundMessage = null,
  getReplacementStatus = () => null,
  getReplacementReason = () => null,
}) => {
  const [guestActionModal, setGuestActionModal] = useState<{
    isOpen: boolean;
    action: 'cancel' | 'replacement';
    item: OrderItem;
    reason?: string;
  }>({
    isOpen: false,
    action: 'cancel',
    item: {} as OrderItem
  });

  const handleGuestAction = (action: 'cancel' | 'replacement') => {
    setGuestActionModal({
      isOpen: true,
      action,
      item,
      reason: ''
    });
  };

  const handleGuestActionConfirmed = () => {
    setGuestActionModal({ isOpen: false, action: 'cancel', item: {} as OrderItem });
    if (guestActionModal.action === 'cancel' && onCancelItem) {
      onCancelItem(guestActionModal.item, guestActionModal.reason);
    } else if (guestActionModal.action === 'replacement' && onReturnItem) {
      onReturnItem(guestActionModal.item, guestActionModal.reason);
    }
  };
  const getItemStatusColor = (status?: string) => {
    const colors = {
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      refunded: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      replacement_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      replacement_initiated: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      replacement_shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      replacement_delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      replacement_rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      returned_to_warehouse: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
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
      replacement_requested: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />,
      replacement_initiated: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />,
      replacement_shipped: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />,
      replacement_delivered: <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />,
      replacement_rejected: <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />,
      returned_to_warehouse: <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />,
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
    { key: 'ordered', label: 'Ordered', active: ['pending', 'shipped', 'delivered', 'replacement_requested', 'replacement_initiated', 'replacement_shipped', 'replacement_delivered', 'replacement_rejected', 'returned_to_warehouse'].includes(itemStatus) },
    { key: 'shipped', label: 'Shipped', active: ['shipped', 'delivered', 'replacement_shipped', 'replacement_delivered'].includes(itemStatus) },
    { key: 'delivered', label: 'Delivered', active: ['delivered', 'replacement_delivered', 'returned_to_warehouse'].includes(itemStatus) }
  ];

  return (
    <>
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm md:text-base lg:text-lg leading-snug pr-2 break-words whitespace-normal"
                title={item.product_name}
              >
                {item.product_name}
              </h3>

              {/* Product Attributes - Always below title on mobile */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-600 dark:text-gray-300 sm:hidden">
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

              {/* Price Information - Mobile */}
              <div className="flex items-baseline gap-2 mt-1 sm:hidden">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  ₹{totalPrice}
                </span>
                {totalMrp && savings && (
                  <>
                    <span className="text-xs text-gray-500 line-through">
                      ₹{totalMrp}
                    </span>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Saved ₹{savings}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status Badge - Mobile First */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 sm:hidden">
              {getStatusIcon(itemStatus)}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getItemStatusColor(itemStatus)}`}>
                {(() => {
                  switch (itemStatus) {
                    case 'pending': return 'Pending';
                    case 'shipped': return 'Shipped';
                    case 'delivered': return 'Delivered';
                    case 'cancelled': return 'Cancelled';
                    case 'refunded': return 'Refunded';
                    case 'replacement_requested': return 'Replacement Requested';
                    case 'replacement_initiated': return 'Replacement Approved';
                    case 'replacement_shipped': return 'Replacement Shipped';
                    case 'replacement_delivered': return 'Replacement Delivered';
                    case 'replacement_rejected': return 'Replacement Rejected';
                    case 'returned_to_warehouse': return 'Returned';
                    default: return itemStatus?.toUpperCase() || 'PENDING';
                  }
                })()}
              </span>
            </div>
          </div>

          {/* Product Attributes & Price - Desktop */}
          <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
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

          {/* Price Information - Desktop */}
          <div className="hidden sm:flex items-baseline gap-2 mt-1">
            <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
              ₹{totalPrice}
            </span>
            {totalMrp && savings && (
              <>
                <span className="text-xs sm:text-sm text-gray-500 line-through">
                  ₹{totalMrp}
                </span>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Saved ₹{savings}
                </span>
              </>
            )}
          </div>

          {/* Status Badge - Desktop */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {getStatusIcon(itemStatus)}
            <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${getItemStatusColor(itemStatus)}`}>
              {(() => {
                  switch (itemStatus) {
                    case 'pending': return 'Pending';
                    case 'shipped': return 'Shipped';
                    case 'delivered': return 'Delivered';
                    case 'cancelled': return 'Cancelled';
                    case 'refunded': return 'Refunded';
                    case 'replacement_requested': return 'Replacement Requested';
                    case 'replacement_initiated': return 'Replacement Approved – Will be Shipped Soon';
                    case 'replacement_shipped': return 'Replacement Shipped';
                    case 'replacement_delivered': return 'Replacement Delivered';
                    case 'replacement_rejected': return 'Replacement Rejected';
                    case 'returned_to_warehouse': return 'Returned to Warehouse';
                    default: return itemStatus?.toUpperCase() || 'PENDING';
                  }
                })()}
            </span>
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
          {/* Refund Status Messages */}
          {existingRefunds && formatRefundMessage && (
            <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {existingRefunds.refund_status === 'initiated' && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                      <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                    </div>
                  )}
                  {existingRefunds.refund_status === 'processed' && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-400 flex items-center justify-center">
                      <CheckCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                    </div>
                  )}
                  {existingRefunds.refund_status === 'failed' && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-400 flex items-center justify-center">
                      <XCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                    </div>
                  )}
                  {existingRefunds.refund_status === 'cancelled' && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-400 flex items-center justify-center">
                      <XCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{formatRefundMessage(existingRefunds)?.title}</span>
                    <br />
                    <span>{formatRefundMessage(existingRefunds)?.message}</span>
                    {formatRefundMessage(existingRefunds)?.arn && (
                      <>
                        <br />
                        <span className="font-medium">Bank Reference:</span> {formatRefundMessage(existingRefunds)?.arn}
                      </>
                    )}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Refund Amount: ₹{existingRefunds.refund_amount?.toFixed(2)} | Method: {existingRefunds.refund_method?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Replacement Lifecycle Messages */}
          {(itemStatus === 'replacement_requested' || existingReplacement?.status === 'requested') && (
            <div className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-300">
                <span className="font-medium">Replacement Requested</span>
                {(existingReplacement?.reason_description || item.replacement_reason) && (
                  <>
                    <br />
                    <span className="font-medium">Reason:</span> {existingReplacement?.reason_description || item.replacement_reason}
                  </>
                )}
                <br />
                <span className="text-xs">Waiting for approval</span>
              </p>
            </div>
          )}
          
          {(itemStatus === 'replacement_initiated' || existingReplacement?.status === 'approved') && (
            (() => {
              
              return (
                <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300">
                    <span className="font-medium">
                      {existingReplacement?.reason_code === 'size_mismatch' && existingReplacement?.requested_size
                        ? `Replacement with ${existingReplacement.requested_size} size for this product has been approved`
                        : 'Replacement Approved'
                      }
                    </span>
                    <br />
                    <span className="text-xs">Replacement will be shipped soon</span>
                    {(existingReplacement?.reason_description || item.replacement_reason) && (
                      <>
                        <br />
                        <span className="font-medium">Reason:</span> {existingReplacement?.reason_description || item.replacement_reason}
                      </>
                    )}
                  </p>
                </div>
              );
            })()
          )}
          
          {(itemStatus === 'replacement_shipped' || existingReplacement?.status === 'replacement_shipped') && (
            (() => {
              
              return (
                <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">
                    <span className="font-medium">
                      {existingReplacement?.reason_code === 'size_mismatch' && existingReplacement?.requested_size
                        ? `Replacement with ${existingReplacement.requested_size} size for this product has been shipped`
                        : 'Replacement Shipped'
                      }
                    </span>
                    {(existingReplacement?.reason_description || item.replacement_reason) && (
                      <>
                        <br />
                        <span className="font-medium">Reason:</span> {existingReplacement?.reason_description || item.replacement_reason}
                      </>
                    )}
                  </p>
                </div>
              );
            })()
          )}
          
          {(itemStatus === 'replacement_shipped' || existingReplacement?.status === 'replacement_shipped') && (
            <>
              {(existingReplacement?.replacement_tracking_id || item.tracking_id) && (
                <>
                  <br />
                  <span className="font-medium">Tracking ID:</span> {existingReplacement?.replacement_tracking_id || item.tracking_id}
                </>
              )}
              {(existingReplacement?.replacement_tracking_url || item.tracking_url) && (
                <>
                  <br />
                  <a 
                    href={existingReplacement?.replacement_tracking_url || item.tracking_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                  >
                    Track Package
                  </a>
                </>
              )}
              {(existingReplacement?.pickup_partner || item.shipping_partner) && (
                <>
                  <br />
                  <span className="font-medium">Shipping Partner:</span> {existingReplacement?.pickup_partner || item.shipping_partner}
                </>
              )}
            </>
          )}
          
          {itemStatus === 'replacement_delivered' || existingReplacement?.status === 'completed' && (
            <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-300">
                <span className="font-medium">
                  {existingReplacement?.reason_code === 'size_mismatch' && existingReplacement?.requested_size
                    ? `Replacement of size ${existingReplacement.requested_size} has been delivered`
                    : 'Replacement Delivered'
                  }
                </span>
                {existingReplacement?.reason_code === 'size_mismatch' && (
                  <>
                    <br />
                    <span className="font-medium">Reason:</span> Size mismatch - Requested size {existingReplacement.requested_size}
                  </>
                )}
                {existingReplacement?.reason_description && existingReplacement?.reason_code !== 'size_mismatch' && (
                  <>
                    <br />
                    <span className="font-medium">Reason:</span> {existingReplacement?.reason_description}
                  </>
                )}
                {item.replacement_reason && !existingReplacement && (
                  <>
                    <br />
                    <span className="font-medium">Reason:</span> {item.replacement_reason}
                  </>
                )}
                {item.delivered_at && (
                  <>
                    <br />
                    <span className="font-medium">Delivered on:</span> {new Date(item.delivered_at).toLocaleDateString('en-IN')}
                  </>
                )}
                <br />
              </p>
            </div>
          )}
          
          {(itemStatus === 'returned_to_warehouse' || existingReplacement?.status === 'completed') && (
            <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-300">
                <span className="font-medium">Replacement Completed ✅</span>
                <br />
                <span className="text-xs">Your replacement has been successfully delivered and completed</span>
              </p>
            </div>
          )}

          {/* Replacement Rejected */}
          {(itemStatus === 'replacement_rejected' || existingReplacement?.status === 'rejected') && (
            <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-300">
                <span className="font-medium">Replacement Request Rejected</span>
                {(existingReplacement?.reason_description || item.replacement_reason) && (
                  <>
                    <br />
                    <span className="font-medium">Reason:</span> {existingReplacement?.reason_description || item.replacement_reason}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Action Buttons (Cancel, Return) */}
          {(canCancel || canReturn) && 
           !['replacement_requested', 'replacement_initiated', 'replacement_shipped', 'replacement_delivered', 'replacement_rejected', 'returned_to_warehouse'].includes(itemStatus) &&
           !existingReplacement && (
            <div className="flex flex-col xs:flex-row gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              {canCancel && (
                <button
                  onClick={() => isGuest ? handleGuestAction('cancel') : onCancelItem?.(item)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium touch-manipulation"
                  aria-label="Cancel this item"
                >
                  Cancel Item
                </button>
              )}
              {(() => {
            const canReplace = canReturnItem(item);
            const shouldShow = canReplace && !existingReplacement;
            return shouldShow;
          })() && (
                <button
                  onClick={() => {
                    console.log('🔍 OrderItemCard replacement button clicked:', { item, isGuest });
                    if (isGuest) {
                      handleGuestAction('replacement');
                    } else {
                      onReplacementRequest?.(item, []);
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium touch-manipulation"
                  aria-label="Request replacement for this item"
                >
                  Request Replacement
                </button>
              )}
            </div>
          )}

          {/* Review Section */}
          {(canReview || existingReview) && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              {existingReview ? (
                // Show existing review with edit option
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < existingReview.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                        {existingReview.rating}/5
                      </span>
                    </div>
                    {canAddReview?.(item) && (
                      <button
                        onClick={() => onAddReview?.(item)}
                        className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center gap-1"
                        aria-label="Edit review"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {existingReview.comment}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Reviewed on {existingReview.created_at ? 
                      (() => {
                        try {
                          return new Date(existingReview.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });
                        } catch {
                          return 'Invalid Date';
                        }
                      })() : 'Invalid Date'
                    }
                  </p>
                </div>
              ) : (
                // Show "Add Review" button when no review exists
                canReview && (
                  <button
                    onClick={() => onAddReview?.(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:bg-yellow-700 transition-colors font-medium touch-manipulation"
                    aria-label="Add review for this item"
                  >
                    <Star className="w-4 h-4" />
                    Add Review
                  </button>
                )
              )}
            </div>
          )}

          {/* {!isGuest && !canCancel && !canReturn && !canReview && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg inline-block">
                No actions available
              </span>
            </div>
          )} */}
        </div>
      </div>
    </div>

      {/* Guest Action Modal */}
      <GuestActionModal
        isOpen={guestActionModal.isOpen}
        onClose={() => setGuestActionModal({ isOpen: false, action: 'cancel', item })}
        action={guestActionModal.action}
        item={guestActionModal.item}
        guestEmail={guestEmail}
        guestPhone={guestPhone}
        onActionConfirmed={handleGuestActionConfirmed}
      />
    </>
  );
};

export default OrderItemCard;