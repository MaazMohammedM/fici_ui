import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Truck, CheckCircle, XCircle, Clock, Package, ArrowLeft, X, Upload, Star } from 'lucide-react';
import OrderItemCard from './OrderItemCard';
import ReviewModal from './components/ReviewModal';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '@lib/supabase';

interface OrderItem {
  order_item_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  thumbnail_url: string;
  product_name: string;
  product_thumbnail_url: string;
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  mrp?: number;
  color?: string;
  item_status?: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded';
  cancel_reason?: string;
  return_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
  return_requested_at?: string;
  return_approved_at?: string;
}

interface OrderDetails {
  order_id: string;
  order_date: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'partially_delivered' | 'partially_cancelled' | 'partially_refunded' | 'partially_shipped';
  total_amount: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  payment_method: string;
  payment_status: string;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
  };
  items: OrderItem[];
  guest_email?: string;
  guest_phone?: string;
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
}

const OrderDetailsPage = ({ isGuest = false }: { isGuest?: boolean }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isGuest: isGuestUser, guestSession } = useAuthStore();
  const { fetchOrderById, updateOrderStatus, cancelOrderItem, requestReturnItem, loading: storeLoading, error: storeError, submitReview } = useOrderStore();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedItemsForCancel, setSelectedItemsForCancel] = useState<string[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderDetails | null>(null);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [showReturnItemModal, setShowReturnItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [itemCancelReason, setItemCancelReason] = useState('');
  const [itemReturnReason, setItemReturnReason] = useState('');
  const [returnImage, setReturnImage] = useState<File | null>(null);
  const [processingItem, setProcessingItem] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<OrderItem | null>(null);
  const [existingReviews, setExistingReviews] = useState<{ [productId: string]: any }>({});
  const [dbItems, setDbItems] = useState<OrderItem[]>([]);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const transformOrderData = (orderData: any): OrderDetails => {
    return {
      order_id: orderData.id,
      order_date: orderData.order_date || orderData.created_at || '',
      status: orderData.status as OrderDetails['status'],
      total_amount: orderData.total_amount,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      delivery_charge: orderData.delivery_charge,
      payment_method: orderData.payment_method || '',
      payment_status: orderData.payment_status,
      shipping_address: orderData.shipping_address as OrderDetails['shipping_address'],
      items: Array.isArray(orderData.items) ? orderData.items as OrderItem[] : [],
      guest_email: orderData.guest_email,
      guest_phone: orderData.guest_phone,
      shipping_partner: (orderData as any).shipping_partner,
      tracking_id: (orderData as any).tracking_id,
      tracking_url: orderData.tracking_url,
      shipped_at: orderData.shipped_at,
      delivered_at: orderData.delivered_at,
    };
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
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setIsLoading(true);
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const orderData = await fetchOrderById(orderId, email, undefined, tpin);

        if (!orderData) throw new Error('Order not found or access denied');

        const transformedOrder = transformOrderData(orderData);

        setOrder(transformedOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isGuest, searchParams, fetchOrderById]);

  useEffect(() => {
    const loadDbItems = async () => {
      if (!order?.order_id) return;
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.order_id);
      if (!error) setDbItems((data || []) as any);
    };
    loadDbItems();
  }, [order?.order_id]);

  const handleCancelConfirm = async () => {
    if (!order || !cancelReason || selectedItemsForCancel.length === 0) {
      alert('Please select items and a reason for cancellation');
      return;
    }

    try {
      setCancellingOrder(true);
      const { data: toUpdate, error: checkError } = await supabase
        .from('order_items')
        .select('order_item_id, order_id, item_status')
        .eq('order_id', order.order_id)
        .in('order_item_id', selectedItemsForCancel);

      if (checkError || !toUpdate?.length) {
        alert('No matching items found to cancel. Please refresh and try again.');
        return;
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ item_status: 'cancelled', cancel_reason: cancelReason })
        .in('order_item_id', selectedItemsForCancel)
        .eq('order_id', order.order_id);

      if (itemsError) throw new Error(`Failed to cancel items: ${itemsError.message}`);

      setDbItems(prev => {
        const map = new Map(prev.map(i => [i.order_item_id, i]));
        selectedItemsForCancel.forEach(id => {
          const existing = map.get(id) || order.items.find(i => i.order_item_id === id);
          if (existing) {
            map.set(id, { ...existing, item_status: 'cancelled', cancel_reason: cancelReason });
          }
        });
        return Array.from(map.values());
      });
      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => selectedItemsForCancel.includes(i.order_item_id)
          ? { ...i, item_status: 'cancelled', cancel_reason: cancelReason }
          : i)
      }) : prev);

      const { data: allItems, error: fetchError } = await supabase
        .from('order_items')
        .select('item_status')
        .eq('order_id', order.order_id);

      if (fetchError) throw new Error(`Failed to fetch items: ${fetchError.message}`);

      const statuses = allItems?.map(i => i.item_status) || [];
      const allCancelled = statuses.every(s => s === 'cancelled');
      const newOrderStatus = allCancelled ? 'cancelled' : 'partially_cancelled';

      const updateData: any = {
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
        order_status: cancelReason,
        comments: cancelComments || null
      };

      if (allCancelled) updateData.cancelled_at = new Date().toISOString();

      await supabase.from('orders').update(updateData).eq('order_id', order.order_id);

      // Refetch the order data to get the latest state
      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);

        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData));
        }
      }

      setShowCancelModal(false);
      setCancelReason('');
      setCancelComments('');
      setSelectedItemsForCancel([]);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      alert(`Failed to cancel items: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleCancelItem = async () => {
    if (!selectedItem || !itemCancelReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    try {
      setProcessingItem(true);
      await cancelOrderItem(selectedItem.order_item_id, itemCancelReason, user?.id, guestSession?.guest_session_id);

      setDbItems(prev => {
        const map = new Map(prev.map(i => [i.order_item_id, i]));
        map.set(selectedItem.order_item_id, { ...selectedItem, item_status: 'cancelled', cancel_reason: itemCancelReason });
        return Array.from(map.values());
      });
      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => i.order_item_id === selectedItem.order_item_id
          ? { ...i, item_status: 'cancelled', cancel_reason: itemCancelReason }
          : i)
      }) : prev);

      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);

        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData));
        }
      }

      setShowCancelItemModal(false);
      setSelectedItem(null);
      setItemCancelReason('');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      alert(`Failed to cancel item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingItem(false);
    }
  };

  const handleReturnItem = async () => {
    if (!selectedItem || !itemReturnReason) {
      alert('Please provide a reason for return');
      return;
    }

    try {
      setProcessingItem(true);
      await requestReturnItem(
        selectedItem.order_item_id,
        itemReturnReason,
        user?.id,
        guestSession?.guest_session_id,
        returnImage || undefined
      );

      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);

        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData));
        }
      }

      setShowReturnItemModal(false);
      setSelectedItem(null);
      setItemReturnReason('');
      setReturnImage(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      alert(`Failed to request return: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingItem(false);
    }
  };

  const canCancelItem = (item: OrderItem) => {
    const override = dbItems.find(d => d.order_item_id === item.order_item_id);
    const itemStatus = (override?.item_status) || item.item_status || (item as any).status || 'pending';
    return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
  };

  const canReturnItem = (item: OrderItem) => {
    return item.item_status === 'delivered' && !['returned', 'refunded', 'cancelled'].includes(item.item_status || '');
  };

  const canCancelOrder = (order: OrderDetails) => {
    const itemsToCheck = dbItems.length > 0 ? dbItems : order.items;
    return itemsToCheck.some(item => canCancelItem(item));
  };

  const canReturnOrder = (order: OrderDetails) => {
    return order.items.some(item => canReturnItem(item));
  };

  // Check if user can add a review for an item (delivered and no existing review)
  const canAddReview = (item: OrderItem) => {
    const itemStatus = item.item_status || (item as any).status || 'pending';
    const isDelivered = itemStatus === 'delivered';
    const hasReview = existingReviews[item.product_id];
    
    // Only return false if the item is not delivered or already has a review
    // This ensures the button stays visible until a review is actually submitted
    return isDelivered && !hasReview;
  };
  
  // Check if the review was just submitted for the current item
  const isJustSubmitted = (item: OrderItem) => {
    return reviewSubmitted && selectedItemForReview?.product_id === item.product_id;
  };

  // Check for existing reviews when order loads
  useEffect(() => {
    const checkExistingReviews = async () => {
      if (!order?.items || (!user && !guestSession)) return;

      const productIds = order.items.map(item => item.product_id);

      try {
        let query = supabase
          .from('reviews')
          .select('product_id, user_id, guest_session_id')
          .in('product_id', productIds);

        if (user) {
          query = query.eq('user_id', user.id);
        } else if (guestSession) {
          query = query.eq('guest_session_id', guestSession.guest_session_id);
        }

        const { data: reviews, error } = await query;

        if (error) throw error;

        const reviewMap: { [productId: string]: any } = {};
        (reviews || []).forEach(review => {
          reviewMap[review.product_id] = review;
        });

        setExistingReviews(reviewMap);
      } catch (error) {
        console.error('Error checking existing reviews:', error);
      }
    };

    checkExistingReviews();
  }, [order?.items, user, guestSession]);

  const handleAddReview = (item: OrderItem) => {
    setSelectedItemForReview(item);
    setReviewSubmitted(false);
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedItemForReview(null);
  };

  const handleReviewSubmitted = async () => {
    if (selectedItemForReview) {
      // Mark that a review exists for this product
      setExistingReviews(prev => ({
        ...prev,
        [selectedItemForReview.product_id]: { exists: true }
      }));
      setReviewSubmitted(true);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    setShowReviewModal(false);
    setSelectedItemForReview(null);
  };

  if (isLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || storeError || !order) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex gap-3">
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{error || storeError || 'Order not found'}</p>
                <Link
                  to={isGuest ? '/guest/orders' : '/orders'}
                  className="inline-flex items-center mt-3 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to {isGuest ? 'Order Lookup' : 'Order History'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orderStatuses = order.items.map(item => item.item_status || 'pending');
  const allCancelled = orderStatuses.every(s => s === 'cancelled');
  const allDelivered = orderStatuses.every(s => s === 'delivered');
  const orderStatusDisplay = allCancelled ? 'Cancelled' : allDelivered ? 'Delivered' : order.status.charAt(0).toUpperCase() + order.status.slice(1);
  const statusColorClass = allCancelled ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 
                           allDelivered ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                           order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                           order.status === 'partially_shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                           order.status === 'partially_cancelled' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                           order.status === 'partially_delivered' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                           'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';

  const itemsToRender = (dbItems.length > 0 ? order.items.map(item => {
    const match = dbItems.find(d => d.order_item_id === item.order_item_id);
    return match ? { ...item, ...match } : item;
  }) : order.items);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            to={isGuest ? '/guest/orders' : '/orders'}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {isGuest ? 'Order Lookup' : 'Order History'}
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-lg sm:rounded-xl">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Order #{order.order_id.split('-')[0]}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {new Date(order.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusColorClass}`}>
                  {orderStatusDisplay}
                </span>

                {(!isGuest || order.payment_method === 'cod') && !isGuestUser && (
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={cancellingOrder}
                        className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                    {canReturnOrder(order) && (
                      <button
                        onClick={() => { setSelectedOrderForReturn(order); setShowReturnModal(true); }}
                        className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Request Return
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Shipping Details */}
          {order.shipping_partner && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg p-4 sm:p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Your Order is {order.status === 'shipped' ? 'On the Way' : 'Shipped'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {order.status === 'shipped' 
                      ? 'Your package is on its way to you.'
                      : 'Your package has been delivered.'}
                  </p>
                </div>
                {order.status === 'shipped' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    In Transit
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Shipping Partner</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.shipping_partner}</p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Tracking Number</h3>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white break-all">
                    {order.tracking_id}
                  </p>
                </div>

                {order.shipped_at && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Shipped On</h3>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(order.shipped_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {order.status === 'shipped' ? 'Expected Delivery' : 'Delivered On'}
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {order.status === 'shipped' ? (
                      <span className="font-medium">
                        {new Date(new Date(order.shipped_at || new Date()).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                        <span className="text-xs text-gray-500 ml-1">(Estimated)</span>
                      </span>
                    ) : order.delivered_at ? (
                      new Date(order.delivered_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    ) : 'N/A'}
                  </p>
                </div>
              </div>

              {order.tracking_url && (
                <div className="mt-6">
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Track Your Package
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Order Items ({order.items.length})
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {itemsToRender.map((item) => (
                <OrderItemCard
                  key={item.order_item_id}
                  item={item}
                  onCancelItem={(item) => { setSelectedItem(item); setShowCancelItemModal(true); }}
                  onReturnItem={(item) => { setSelectedItem(item); setShowReturnItemModal(true); }}
                  onAddReview={handleAddReview}
                  canCancelItem={canCancelItem}
                  canReturnItem={canReturnItem}
                  canAddReview={canAddReview}
                  isGuest={isGuest}
                />
              ))}
            </div>

            {/* Price Summary */}
            <div className="mt-6 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total MRP</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{order.items.reduce((total, item) => total + ((item.mrp || item.price_at_purchase) * item.quantity), 0).toFixed(2)}
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
                  <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">₹{order.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Payment */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Shipping & Payment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h3>
                <address className="not-italic text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <div>{order.shipping_address?.name || 'N/A'}</div>
                  <div>{order.shipping_address?.address || 'N/A'}</div>
                  <div>{order.shipping_address?.city || 'N/A'}, {order.shipping_address?.state || 'N/A'}</div>
                  <div>{order.shipping_address?.pincode || 'N/A'}</div>
                  <div>Phone: {order.shipping_address?.phone || 'N/A'}</div>
                </address>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">Payment Method</h3>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p className="capitalize">{order.payment_method?.replace(/_/g, ' ') || 'N/A'}</p>
                  <p className="capitalize text-gray-500 dark:text-gray-400">{order.payment_status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          {!isGuest && !isGuestUser && (
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">Need Help?</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                If you have any questions about your order, please contact our customer service.
              </p>
              <a
                href="mailto:support@fici.com"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Contact Support
              </a>
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && order && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Cancel Order Items</h2>
                <button onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelComments(''); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Select the items you want to cancel and provide a reason.
              </p>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Items to Cancel</label>
                  <button
                    onClick={() => setSelectedItemsForCancel(dbItems.filter(canCancelItem).map(i => i.order_item_id))}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Select All
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  {dbItems.map((item) => {
                    const isDisabled = !canCancelItem(item);
                    return (
                      <label
                        key={item.order_item_id}
                        className={`flex items-center gap-3 p-2 rounded ${isDisabled ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemsForCancel.includes(item.order_item_id)}
                          onChange={(e) => {
                            if (isDisabled) return;
                            setSelectedItemsForCancel(prev => 
                              e.target.checked ? [...prev, item.order_item_id] : prev.filter(id => id !== item.order_item_id)
                            );
                          }}
                          disabled={isDisabled}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <img src={item.thumbnail_url || item.product_thumbnail_url} alt={item.product_name} className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Size: {item.size} • Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">₹{(item.price_at_purchase! * item.quantity).toLocaleString('en-IN')}</p>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{selectedItemsForCancel.length} item(s) selected</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason *</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select a reason</option>
                    <option value="changed_mind">Changed my mind</option>
                    <option value="found_better_deal">Found a better deal</option>
                    <option value="wrong_item">Ordered wrong item</option>
                    <option value="delivery_too_slow">Delivery too slow</option>
                    <option value="duplicate_order">Duplicate order</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comments (Optional)</label>
                  <textarea
                    value={cancelComments}
                    onChange={(e) => setCancelComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
                <button
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelComments(''); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                  disabled={cancellingOrder}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancellingOrder || !cancelReason || selectedItemsForCancel.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {cancellingOrder ? 'Cancelling...' : `Cancel ${selectedItemsForCancel.length} Item(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Item Modal */}
        {showCancelItemModal && selectedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Cancel Item</h2>
                <button onClick={() => { setShowCancelItemModal(false); setSelectedItem(null); setItemCancelReason(''); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex gap-3">
                <img src={selectedItem.product_thumbnail_url || selectedItem.thumbnail_url} alt={selectedItem.product_name} className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{selectedItem.product_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedItem.size && `Size: ${selectedItem.size}`}
                    {selectedItem.color && ` • ${selectedItem.color}`}
                  </p>
                  <p className="text-sm font-medium mt-1">₹{(selectedItem.price_at_purchase! * selectedItem.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason *</label>
                <select
                  value={itemCancelReason}
                  onChange={(e) => setItemCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select a reason</option>
                  <option value="changed_mind">Changed my mind</option>
                  <option value="found_better_deal">Found a better deal</option>
                  <option value="wrong_item">Ordered wrong item</option>
                  <option value="delivery_too_slow">Delivery too slow</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => { setShowCancelItemModal(false); setSelectedItem(null); setItemCancelReason(''); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                  disabled={processingItem}
                >
                  Keep Item
                </button>
                <button
                  onClick={handleCancelItem}
                  disabled={processingItem || !itemCancelReason}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {processingItem ? 'Cancelling...' : 'Cancel Item'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Item Modal */}
        {showReturnItemModal && selectedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Request Return</h2>
                <button onClick={() => { setShowReturnItemModal(false); setSelectedItem(null); setItemReturnReason(''); setReturnImage(null); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex gap-3">
                <img src={selectedItem.product_thumbnail_url || selectedItem.thumbnail_url} alt={selectedItem.product_name} className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{selectedItem.product_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedItem.size && `Size: ${selectedItem.size}`}
                    {selectedItem.color && ` • ${selectedItem.color}`}
                  </p>
                  <p className="text-sm font-medium mt-1">₹{(selectedItem.price_at_purchase! * selectedItem.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason *</label>
                  <textarea
                    value={itemReturnReason}
                    onChange={(e) => setItemReturnReason(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image (Optional)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {returnImage ? returnImage.name : 'Choose file'}
                      </span>
                      <input type="file" accept="image/*" onChange={(e) => setReturnImage(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    {returnImage && (
                      <button onClick={() => setReturnImage(null)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 5MB</p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
                <button
                  onClick={() => { setShowReturnItemModal(false); setSelectedItem(null); setItemReturnReason(''); setReturnImage(null); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                  disabled={processingItem}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnItem}
                  disabled={processingItem || !itemReturnReason}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {processingItem ? 'Submitting...' : 'Submit Return'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Order Modal */}
        {showReturnModal && selectedOrderForReturn && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Request Return</h2>
                <button onClick={() => { setShowReturnModal(false); setSelectedOrderForReturn(null); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                You can request a return within 3 days of delivery.
              </p>

              <div className="space-y-2 mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                <p><strong>Order ID:</strong> {selectedOrderForReturn.order_id}</p>
                <p><strong>Items:</strong> {selectedOrderForReturn.items.length} item(s)</p>
                <p><strong>Delivered:</strong> {selectedOrderForReturn.delivered_at ? new Date(selectedOrderForReturn.delivered_at).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => { setShowReturnModal(false); setSelectedOrderForReturn(null); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowReturnModal(false); window.location.reload(); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedItemForReview && (
          <ReviewModal
            order={{
              id: order?.order_id || '',
              items: [selectedItemForReview],
              status: order?.status || 'delivered',
              created_at: order?.order_date || '',
              subtotal: order?.subtotal || 0,
              discount: order?.discount || 0,
              delivery_charge: order?.delivery_charge || 0,
              total_amount: order?.total_amount || 0,
              payment_status: ['pending', 'paid', 'failed', 'refunded'].includes(order?.payment_status || '') ? order.payment_status as 'pending' | 'paid' | 'failed' | 'refunded' : 'paid',
              payment_method: order?.payment_method || 'razorpay',
              shipping_address: order?.shipping_address || {},
            }}
            item={selectedItemForReview}
            onClose={handleCloseReviewModal}
            onSubmit={handleReviewSubmitted}
          />
        )}

        {/* Success Toast */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in max-w-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">
              {reviewSubmitted ? 'Review submitted successfully!' : 'Order cancelled successfully!'}
            </span>
            <button onClick={() => setShowSuccessMessage(false)} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;