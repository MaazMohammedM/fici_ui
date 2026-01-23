import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { XCircle, Package, ArrowLeft, X, Upload, CheckCircle } from 'lucide-react';
import OrderItemCard from './OrderItemCard';
import ReviewModal from './components/ReviewModal';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getAvailableSizes } from '../../lib/utils/productValidation';
import FiciLoader from '../../components/ui/FiciLoader';
import { OrderHeader } from '../../components/order/OrderHeader';
import { OrderItemList } from '../../components/order/OrderItemList';
import { ReplacementRequestModal } from '../../components/order/ReplacementRequestModal';
import type { ReplacementRequestData } from '../../types/replacement';
import { CancelModal } from '../../components/order/CancelModal';
import { OtpFlow } from '../../components/otp/OtpFlow';
import { isCurrentIdentityVerified, shouldRequireOtpVerification, markCurrentIdentityVerified } from '../../utils/identityVerification';
import type { 
  Order, 
  ShippingAddress, 
  PaymentStatus, 
  PaymentMethod 
} from '../../types/order';
import type { OrderItem } from '../../types/order-common';
import type { Order as CommonOrder } from '../../types/order-common';

interface OrderDetails {
  order_id: string;
  order_date: string;
  status: Order['status'];
  total_amount: number;
  effective_amount: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  order_items?: OrderItem[];
  guest_email?: string;
  guest_phone?: string;
  guest_session_id?: string;
  user_id?: string;
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
}

const OrderDetailsPage = ({ isGuest = false }: { isGuest?: boolean }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isGuest: isGuestUser, guestSession } = useAuthStore();
  const { fetchOrderById, cancelOrderItem, requestReturnItem, cancelOrderItems, loading: storeLoading, error: storeError } = useOrderStore();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // OTP verification handler
  const handleOtpVerified = () => {
    if (processingItem) {
      console.log('⚠️ OTP verified but already processing, ignoring');
      return;
    }
    
    markCurrentIdentityVerified();
    setShowOtpModal(false);
    
    // Execute the pending action after OTP verification
    if (pendingAction === 'cancel') {
      executeCancelAction();
    } else if (pendingAction === 'replacement' && pendingRequestData) {
      executeReplacementAction(pendingRequestData);
    }
    
    // Reset pending action
    setPendingAction(null);
    setPendingReason('');
    setPendingRequestData(null);
  };

  const executeCancelAction = async () => {
    try {
      setProcessingItem(true);
      
      // For guest users, try to use the order's guest session ID as fallback
      const effectiveGuestSessionId = guestSession?.guest_session_id || 
        (isGuestUser && order?.guest_session_id ? order.guest_session_id : 
         sessionStorage.getItem('guest_session_id'));
      
      await cancelOrderItem(selectedItem.order_item_id, pendingReason, user?.id, effectiveGuestSessionId);

      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => i.order_item_id === selectedItem.order_item_id
          ? { ...i, item_status: 'cancelled', cancel_reason: pendingReason }
          : i)
      }) : prev);

      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);
        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData as unknown as Record<string, unknown>));
        }
      }
    } catch (error) {
      console.error('Error cancelling item:', error);
      alert('Failed to cancel item. Please try again.');
    } finally {
      setProcessingItem(false);
    }
  };

  const executeReplacementAction = async (requestData: ReplacementRequestData) => {
    if (!selectedItem) return;
    
    try {
      setProcessingItem(true);
      
      // For guest users, try to use the order's guest session ID as fallback
      const effectiveGuestSessionId = guestSession?.guest_session_id || 
        (isGuestUser && order?.guest_session_id ? order.guest_session_id : 
         sessionStorage.getItem('guest_session_id'));
      
      // Call edge function with request_replacement action
      const { updateOrderItemStatus } = await import('../../lib/orderActions');
      await updateOrderItemStatus({
        action: 'request_replacement',
        orderItemId: selectedItem.order_item_id,
        reason_code: requestData.reason_code,
        reason: requestData.reason,
        requested_size: requestData.requested_size,
        guestSessionId: effectiveGuestSessionId
      });

      // Update local state
      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => i.order_item_id === selectedItem.order_item_id
          ? { ...i, item_status: 'replacement_requested', replacement_reason: requestData.reason || '' }
          : i)
      }) : prev);

      // Show success message
      setShowSuccessMessage(true);
      setSuccessMessage('Replacement requested successfully. Our team will review it shortly.');

      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);
        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData as unknown as Record<string, unknown>));
        }
      }
    } catch (error) {
      console.error('Error requesting replacement:', error);
      alert('Failed to request replacement. Please try again.');
    } finally {
      setProcessingItem(false);
    }
  };

  const handleReplacementFormConfirm = async (requestData: ReplacementRequestData) => {
    if (!selectedItem) return;
    
    // Check if OTP verification is required for guest users
    if (isGuestUser && shouldRequireOtpVerification()) {
      if (!isCurrentIdentityVerified()) {
        setPendingAction('replacement');
        setPendingRequestData(requestData);
        setShowOtpModal(true);
        return;
      }
    }
    
    await executeReplacementAction(requestData);
    setShowReplacementForm(false);
    setSelectedItem(null);
    setAvailableSizesForReplacement([]);
  };
  const isGuestAccess = isGuest || (!user && !isGuestUser);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedItemsForCancel, setSelectedItemsForCancel] = useState<string[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderDetails | null>(null);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [showReturnItemModal, setShowReturnItemModal] = useState(false);
  const [showReplacementItemModal, setShowReplacementItemModal] = useState(false);
  const [showReplacementForm, setShowReplacementForm] = useState(false);
  const [availableSizesForReplacement, setAvailableSizesForReplacement] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [itemCancelReason, setItemCancelReason] = useState('');
  const [itemReturnReason, setItemReturnReason] = useState('');
  const [itemReplacementReason, setItemReplacementReason] = useState('');
  const [returnImage, setReturnImage] = useState<File | null>(null);
  const [processingItem, setProcessingItem] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<OrderItem | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState<Record<string, boolean>>({});
  const [existingReviews, setExistingReviews] = useState<Record<string, {
    product_id: string;
    user_id?: string;
    guest_session_id?: string;
    rating: number;
    comment: string;
    created_at: string;
    review_id?: string;
  }>>({});
  const [existingReplacements, setExistingReplacements] = useState<Record<string, {
    return_id: string;
    status: string;
    reason_description?: string | null;
  }>>({});
  const [existingRefunds, setExistingRefunds] = useState<Record<string, {
    refund_id: string;
    refund_status: 'initiated' | 'processed' | 'failed' | 'cancelled';
    refund_method: 'razorpay' | 'cod' | 'manual' | 'wallet';
    provider_reference?: string;
    arn?: string;
    refund_amount: number;
    created_at: string;
    processed_at?: string;
  }>>({});
  
  // OTP verification state for guest users
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'cancel' | 'replacement' | null>(null);
  const [pendingReason, setPendingReason] = useState<string>('');
  const [pendingRequestData, setPendingRequestData] = useState<ReplacementRequestData | null>(null);

  const transformOrderData = (orderData: Record<string, unknown>): OrderDetails => {
    return {
      order_id: orderData.id as string,
      order_date: (orderData.order_date || orderData.created_at || '') as string,
      status: orderData.status as Order['status'],
      total_amount: orderData.total_amount as number,
      effective_amount: orderData.effective_amount as number,
      subtotal: orderData.subtotal as number,
      discount: orderData.discount as number,
      delivery_charge: orderData.delivery_charge as number,
      payment_method: (orderData.payment_method as PaymentMethod) || 'cod',
      payment_status: (orderData.payment_status as PaymentStatus) || 'pending',
      shipping_address: orderData.shipping_address as ShippingAddress,
      items: Array.isArray(orderData.items) ? orderData.items as OrderItem[] : [],
      order_items: Array.isArray(orderData.order_items) ? orderData.order_items as OrderItem[] : Array.isArray(orderData.items) ? orderData.items as OrderItem[] : [],
      guest_email: orderData.guest_email as string | undefined,
      guest_phone: orderData.guest_phone as string | undefined,
      shipping_partner: orderData.shipping_partner as string | undefined,
      tracking_id: orderData.tracking_id as string | undefined,
      tracking_url: orderData.tracking_url as string | undefined,
      shipped_at: orderData.shipped_at as string | undefined,
      delivered_at: orderData.delivered_at as string | undefined,
    };
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const email = isGuestAccess ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuestAccess ? searchParams.get('tpin') || undefined : undefined;
        
        const orderData = await fetchOrderById(orderId, email, undefined, tpin);

        if (!orderData) {
          throw new Error('Order not found or access denied');
        }

        // Validate required fields
        if (!orderData.id || !orderData.status || !orderData.shipping_address) {
          throw new Error('Invalid order data received from server');
        }

        const transformedOrder = transformOrderData(orderData as unknown as Record<string, unknown>);
        setOrder(transformedOrder);
        
        // Set guest session in auth store if order has guest session
        if (isGuestAccess && orderData.guest_session_id) {
          const { setGuestSessionFromAuth } = useAuthStore.getState();
          setGuestSessionFromAuth({
            guest_session_id: orderData.guest_session_id,
            email: orderData.guest_email,
            phone: orderData.guest_phone,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            is_active: true
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
        console.error('Error fetching order:', errorMessage, err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isGuest, searchParams, fetchOrderById]);

  
  const handleCancelEntireOrderClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelEntireOrder = async (customReason?: string) => {
    if (!order) {
      alert('Order not found');
      return;
    }

    try {
      setCancellingOrder(true);
      
      // Get all pending items
      const pendingItems = order.items.filter(item => item.item_status === 'pending');
      if (pendingItems.length === 0) {
        alert('No pending items to cancel');
        return;
      }

      // Call edge function with cancel_order action
      const { updateOrderItemStatus } = await import('../../lib/orderActions');
      await updateOrderItemStatus({
        action: 'cancel_order',
        order_id: order.order_id,
        reason: customReason || cancelReason || 'Customer requested cancellation',
        guestSessionId: guestSession?.guest_session_id
      });

      // Update local state
      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => i.item_status === 'pending'
          ? { ...i, item_status: 'cancelled', cancel_reason: customReason || cancelReason || 'Customer requested cancellation' }
          : i)
      }) : prev);

      // Refetch order data
      if (orderId) {
        const email = isGuestAccess ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuestAccess ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);
        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData as unknown as Record<string, unknown>));
        }
      }

      setShowCancelModal(false);
      setCancelReason('');
      setCancelComments('');
      setShowSuccessMessage(true);
      setSuccessMessage('Order cancelled successfully');
      setTimeout(() => { setShowSuccessMessage(false); setSuccessMessage(''); }, 5000);
    } catch (err) {
      alert(`Failed to cancel order: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleCancelConfirm = async (customReason?: string) => {
    if (!order || !cancelReason || selectedItemsForCancel.length === 0) {
      alert('Please select items and a reason for cancellation');
      return;
    }

    try {
      setCancellingOrder(true);
      
      await cancelOrderItems({
        orderId: order.order_id,
        orderItemIds: selectedItemsForCancel,
        cancelReason: customReason || cancelReason,
        comments: cancelComments,
        userId: user?.id,
        guestSessionId: guestSession?.guest_session_id
      });

      // Update local state
      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => selectedItemsForCancel.includes(i.order_item_id)
          ? { ...i, item_status: 'cancelled', cancel_reason: customReason || cancelReason }
          : i)
      }) : prev);

      // Refetch the order data to get the latest state
      if (orderId) {
        const email = isGuestAccess ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuestAccess ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);

        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData as unknown as Record<string, unknown>));
        }
      }

      setShowCancelModal(false);
      setCancelReason('');
      setCancelComments('');
      setSelectedItemsForCancel([]);
      setShowSuccessMessage(true);
      setSuccessMessage('Items cancelled successfully');
      setTimeout(() => { setShowSuccessMessage(false); setSuccessMessage(''); }, 5000);
    } catch (err) {
      alert(`Failed to cancel items: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCancellingOrder(false);
    }
  };

  // Wrapper function for CancelModal compatibility
  const handleCancelItemWithReason = (item?: OrderItem) => {
    const customReason = itemCancelReason;
    handleCancelItem(item!);
  };

  const handleCancelItem = async (item: OrderItem) => {
    const customReason = itemCancelReason; // Use current reason state
    
    if (!item || !customReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    // Check if OTP verification is required for guest users
    if (isGuestUser && shouldRequireOtpVerification()) {
      if (!isCurrentIdentityVerified()) {
        // Let OrderItemCard handle the OTP verification through GuestActionModal
        // The action will be executed after OTP verification
        return;
      }
    }

    try {
      setProcessingItem(true);
      
      // For guest users, try to use the order's guest session ID as fallback
      const effectiveGuestSessionId = guestSession?.guest_session_id || 
        (isGuestUser && order?.guest_session_id ? order.guest_session_id : 
         sessionStorage.getItem('guest_session_id'));
      
      await cancelOrderItem(item.order_item_id, customReason, user?.id, effectiveGuestSessionId);

      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => i.order_item_id === item.order_item_id
          ? { ...i, item_status: 'cancelled', cancel_reason: customReason }
          : i)
      }) : prev);

      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);
        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData as unknown as Record<string, unknown>));
        }
      }
    } catch (error) {
      console.error('Error cancelling item:', error);
      alert('Failed to cancel item. Please try again.');
    } finally {
      setProcessingItem(false);
    }
  };

  const handleReplacementRequest = async (item: OrderItem) => {
    if (!item || !itemReplacementReason) {
      alert('Please provide a reason for replacement');
      return;
    }

    // Check if OTP verification is required for guest users
    if (isGuestUser && shouldRequireOtpVerification()) {
      if (!isCurrentIdentityVerified()) {
        setSelectedItem(item);
        setPendingAction('replacement');
        setPendingReason(itemReplacementReason);
        setShowOtpModal(true);
        return;
      }
    }

    try {
      setProcessingItem(true);
      
      // For guest users, try to use the order's guest session ID as fallback
      const effectiveGuestSessionId = guestSession?.guest_session_id || 
        (isGuestUser && order?.guest_session_id ? order.guest_session_id : 
         sessionStorage.getItem('guest_session_id'));
      
      console.log('🔍 Guest session debug:', {
        guestSession: guestSession,
        orderGuestSessionId: order?.guest_session_id,
        sessionStorageId: sessionStorage.getItem('guest_session_id'),
        effectiveGuestSessionId,
        isGuestUser
      });
      
      // Call edge function with request_replacement action
      const { updateOrderItemStatus } = await import('../../lib/orderActions');
      await updateOrderItemStatus({
        action: 'request_replacement',
        orderItemId: item.order_item_id,
        reason: itemReplacementReason,
        guestSessionId: effectiveGuestSessionId
      });

      // Update local state
      setOrder(prev => prev ? ({
        ...prev,
        items: prev.items.map(i => i.order_item_id === item.order_item_id
          ? { ...i, item_status: 'replacement_requested', replacement_reason: itemReplacementReason }
          : i)
      }) : prev);

      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);
        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData as unknown as Record<string, unknown>));
        }
      }

      setShowReplacementItemModal(false);
      setSelectedItem(null);
      setItemReplacementReason('');
      setShowSuccessMessage(true);
      setSuccessMessage('Replacement request submitted');
      setTimeout(() => { setShowSuccessMessage(false); setSuccessMessage(''); }, 5000);
    } catch (error) {
      console.error('Error requesting replacement:', error);
      alert('Failed to request replacement. Please try again.');
    } finally {
      setProcessingItem(false);
    }
  };

  const handleReplacementRequestClick = () => {
    if (!selectedItem || !itemReplacementReason) {
      alert('Please provide a reason for replacement');
      return;
    }
    handleReplacementRequest(selectedItem);
  };

  const handleReturnItem = async () => {
    if (!selectedItem || !itemReturnReason) {
      alert('Please provide a reason for return');
      return;
    }

    // Check if OTP verification is required for guest users
    if (isGuestUser && shouldRequireOtpVerification()) {
      if (!isCurrentIdentityVerified()) {
        setPendingAction('replacement'); // Use replacement action for returns
        setPendingReason(itemReturnReason);
        setShowOtpModal(true);
        return;
      }
    }

    try {
      setProcessingItem(true);
      
      // For guest users, try to use the order's guest session ID as fallback
      const effectiveGuestSessionId = guestSession?.guest_session_id || 
        (isGuestUser && order?.guest_session_id ? order.guest_session_id : 
         sessionStorage.getItem('guest_session_id'));
      
      await requestReturnItem(
        selectedItem.order_item_id,
        itemReturnReason,
        user?.id,
        effectiveGuestSessionId,
        returnImage || undefined
      );

      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        const updatedOrderData = await fetchOrderById(orderId, email, undefined, tpin);

        if (updatedOrderData) {
          setOrder(transformOrderData(updatedOrderData as unknown as Record<string, unknown>));
        }
      }

      setShowReturnItemModal(false);
      setSelectedItem(null);
      setItemReturnReason('');
      setReturnImage(null);
      setShowSuccessMessage(true);
      setSuccessMessage('Return request submitted');
      setTimeout(() => { setShowSuccessMessage(false); setSuccessMessage(''); }, 5000);
    } catch (err) {
      alert(`Failed to request return: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingItem(false);
    }
  };

  const canCancelItem = useCallback((item: OrderItem) => {
    const itemStatus = item.item_status || 'pending';
    return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
  }, []);

  const canRequestReplacement = useCallback((item: OrderItem) => {
    // Show "Request Replacement" button ONLY if status is "delivered"
    if (!item.item_status?.trim() || item.item_status?.trim() !== 'delivered') {
      return false;
    }
    
    // Check if there's already an active replacement for this item
    const existingReplacement = existingReplacements[item.order_item_id || ''] || null;
    if (existingReplacement) {
      return false;
    }
    
    // Hide/disable button if status is ANY of these:
    const blockedStatuses = [
      'replacement_requested',
      'replacement_initiated', 
      'replacement_shipped',
      'replacement_delivered',
      'replacement_rejected',
      'returned_to_warehouse',
      'refunded',
      'cancelled'
    ];
    
    if (blockedStatuses.includes(item.item_status || '')) {
      return false;
    }
    
    if (!item.delivered_at) {
      return false;
    }
    
    // Check if delivered within 3 days
    const deliveredDate = new Date(item.delivered_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const isWithin3Days = deliveredDate >= threeDaysAgo;
    
    // TEMP: Bypass 3-day rule for testing
    const finalResult = true; // isWithin3Days;
    
    return finalResult;
  }, [existingReplacements]); // Add back existingReplacements dependency but optimize elsewhere

  const getReplacementStatus = useCallback((item: OrderItem) => {
    const existingReplacement = existingReplacements[item.order_item_id];
    if (!existingReplacement) return null;
    
    switch (existingReplacement.status) {
      case 'requested':
        return 'Replacement Requested';
      case 'approved':
        return 'Replacement Approved';
      case 'rejected':
        return 'Replacement Rejected';
      case 'pickup_scheduled':
        return 'Pickup Scheduled';
      case 'in_transit':
        return 'In Transit';
      case 'received':
        return 'Received';
      case 'replacement_shipped':
        return 'Replacement Shipped';
      case 'completed':
        return 'Replacement Completed';
      default:
        return 'Replacement ' + existingReplacement.status;
    }
  }, [existingReplacements]);

  const getReplacementReason = useCallback((item: OrderItem) => {
    const existingReplacement = existingReplacements[item.order_item_id];
    return existingReplacement?.reason_description || null;
  }, [existingReplacements]);

  const canReturnItem = useCallback((item: OrderItem) => {
    const itemStatus = item.item_status || 'pending';
    const isDelivered = itemStatus === 'delivered';
    const notInReplacementLifecycle = !['replacement_requested', 'replacement_initiated', 'replacement_shipped', 'replacement_delivered', 'returned_to_warehouse'].includes(itemStatus);
    const notAlreadyProcessed = !['returned', 'refunded', 'cancelled', 'replacement_rejected'].includes(itemStatus);
    
    return isDelivered && notInReplacementLifecycle && notAlreadyProcessed;
  }, []);

  const canCancelOrder = (order: OrderDetails) => {
    return order.items.some(item => canCancelItem(item));
  };

  const canReturnOrder = (order: OrderDetails) => {
    return order.items.some(item => canReturnItem(item));
  };

  // Check if user can add a review for an item (delivered and no existing review)
  const canAddReview = (item: OrderItem) => {
    const itemStatus = item.item_status || 'pending';
    const hasReview = existingReviews[item.product_id];
    
    // Statuses that allow reviews
    const reviewableStatuses = [
      'delivered',
      'replacement_requested',
      'replacement_initiated',
      'replacement_shipped',
      'replacement_delivered',
      'replacement_rejected',
      'returned_to_warehouse'
    ];
    
    const isReviewableStatus = reviewableStatuses.includes(itemStatus);
    
    // Return true if item has a reviewable status and no existing review
    return isReviewableStatus && !hasReview;
  };
  

  // Check for existing reviews when order loads
  useEffect(() => {
    const checkExistingReviews = async () => {
      if (!order?.items || (!user && !guestSession)) return;

      const productIds = order.items.map(item => item.product_id);

      try {
        let query = supabase
          .from('reviews')
          .select('product_id, user_id, guest_session_id, rating, comment, created_at, review_id')
          .in('product_id', productIds);

        if (user) {
          query = query.eq('user_id', user.id);
        } else if (guestSession) {
          query = query.eq('guest_session_id', guestSession.guest_session_id);
        }

        const { data: reviews, error } = await query;

        if (error) throw error;

        // Type the reviews response properly
        type ReviewResponse = {
          product_id: string;
          user_id?: string;
          guest_session_id?: string;
          rating: number;
          comment: string;
          created_at: string;
          review_id?: string;
        };

        const reviewMap: Record<string, ReviewResponse> = {};
        
        // Handle both array and single review scenarios
        if (Array.isArray(reviews)) {
          (reviews as ReviewResponse[]).forEach(review => {
            reviewMap[review.product_id] = review;
          });
        } else if (reviews) {
          // Single review object
          reviewMap[(reviews as ReviewResponse).product_id] = reviews as ReviewResponse;
        }

        setExistingReviews(reviewMap);
      } catch (error) {
        console.error('Error checking existing reviews:', error);
      }
    };

    checkExistingReviews();
  }, [order?.items, user, guestSession]);

  // Check for existing replacements when order loads
  const checkExistingReplacements = async () => {
    if (!order?.items || (!user && !guestSession)) return;

    const orderItemIds = order.items.map(item => item.order_item_id);

    try {
      const { data: replacements, error } = await supabase
        .from('returns')
        .select('return_id, order_item_id, status, reason_description,reason_code, requested_size, pickup_partner, replacement_tracking_id, replacement_tracking_url, approved_by, resolved_at')
        .in('order_item_id', orderItemIds)
        .eq('request_type', 'replacement');

      if (error) throw error;

      // Include all replacements except rejected ones
      const activeReplacements = replacements?.filter(r => 
        r.status !== 'rejected'
      ) || [];

      const replacementMap: Record<string, { 
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
      }> = {};
      
      if (Array.isArray(activeReplacements)) {
        activeReplacements.forEach(replacement => {
          replacementMap[replacement.order_item_id] = {
            return_id: replacement.return_id,
            status: replacement.status,
            reason_description: replacement.reason_description,
            reason_code: replacement.reason_code,
            requested_size: replacement.requested_size,
            pickup_partner: replacement.pickup_partner,
            replacement_tracking_id: replacement.replacement_tracking_id,
            replacement_tracking_url: replacement.replacement_tracking_url,
            approved_by: replacement.approved_by,
            resolved_at: replacement.resolved_at
          };
        });
      }

      setExistingReplacements(replacementMap);
    } catch (error) {
      console.error('Error checking existing replacements:', error);
    }
  };

  useEffect(() => {
    checkExistingReplacements();
  }, [order?.items, user, guestSession]);

  // Check for existing refunds when order loads
  const checkExistingRefunds = async () => {
    if (!order?.items || (!user && !guestSession)) return;

    const orderItemIds = order.items.map(item => item.order_item_id);

    try {
      const { data: refunds, error } = await supabase
        .from('refunds')
        .select('*')
        .in('order_item_id', orderItemIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const refundMap: Record<string, {
        refund_id: string;
        refund_status: 'initiated' | 'processed' | 'failed' | 'cancelled';
        refund_method: 'razorpay' | 'cod' | 'manual' | 'wallet';
        provider_reference?: string;
        arn?: string;
        refund_amount: number;
        created_at: string;
        processed_at?: string;
      }> = {};
      
      if (Array.isArray(refunds)) {
        refunds.forEach(refund => {
          // Keep only the latest refund for each order item
          if (!refundMap[refund.order_item_id] || 
              new Date(refund.created_at) > new Date(refundMap[refund.order_item_id].created_at)) {
            refundMap[refund.order_item_id] = refund;
          }
        });
      }

      setExistingRefunds(refundMap);
    } catch (error) {
      console.error('Error checking existing refunds:', error);
    }
  };

  useEffect(() => {
    checkExistingRefunds();
  }, [order?.items, user, guestSession]);

  // Format refund message for user-friendly display
  const formatRefundMessage = (refund: {
    refund_status: 'initiated' | 'processed' | 'failed' | 'cancelled';
    refund_method: 'razorpay' | 'cod' | 'manual' | 'wallet';
    provider_reference?: string;
    arn?: string;
    refund_amount: number;
    created_at: string;
    processed_at?: string;
  }) => {
    const date = new Date(refund.processed_at || refund.created_at)
      .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    switch (refund.refund_status) {
      case 'initiated':
        return {
          title: `Refund initiated on ${date}.`,
          message: 'Your refund is being processed and will be credited to your original payment method shortly.',
          amount: refund.refund_amount,
          method: refund.refund_method
        };
      
      case 'processed':
        if (refund.refund_method === 'razorpay') {
          return {
            title: `Refund processed on ${date}.`,
            message: 'The amount will be credited to your original payment method within 5–7 working days.',
            amount: refund.refund_amount,
            method: refund.refund_method,
            arn: refund.arn
          };
        }
        return {
          title: `Refund completed on ${date}.`,
          message: 'Our team has processed your refund.',
          amount: refund.refund_amount,
          method: refund.refund_method
        };
      
      case 'failed':
        return {
          title: 'Refund failed.',
          message: 'There was an issue processing your refund. Please contact support.',
          amount: refund.refund_amount,
          method: refund.refund_method
        };
      
      case 'cancelled':
        return {
          title: 'Refund cancelled.',
          message: 'This refund request has been cancelled.',
          amount: refund.refund_amount,
          method: refund.refund_method
        };
      
      default:
        return null;
    }
  };

  const handleAddReview = (item: OrderItem) => {
    setSelectedItemForReview(item);
    setReviewSubmitted(prev => ({
      ...prev,
      [item.product_id]: false
    }));
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedItemForReview(null);
  };

  const handleReviewSubmitted = async (productId: string, reviewData: {
    rating: number;
    comment: string;
    title?: string;
    images?: string[];
  }) => {
    setExistingReviews(prev => ({
      ...prev,
      [productId]: {
        product_id: productId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        title: reviewData.title,
        created_at: new Date().toISOString(),
        review_id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    }));
    
    setReviewSubmitted(prev => ({
      ...prev,
      [productId]: true
    }));
    
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
    setShowReviewModal(false);
    setSelectedItemForReview(null);
  };

  if (isLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <FiciLoader />
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
                  to={isGuestAccess ? '/orders' : '/orders'}
                  className="inline-flex items-center mt-3 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to {isGuestAccess ? 'Order Lookup' : 'Order History'}
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

  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <OrderHeader
          order={order as any}
          isGuest={isGuest}
          cancellingOrder={cancellingOrder}
          onCancelEntireOrder={handleCancelEntireOrderClick}
          canCancelOrder={canCancelOrder(order as any)}
        />

        <OrderItemList
          order={order as any}
          isGuest={isGuest}
          guestEmail={order?.guest_email}
          guestPhone={order?.guest_phone}
          canCancelItem={canCancelItem}
          canRequestReplacement={canRequestReplacement}
          canAddReview={canAddReview}
          onAddReview={handleAddReview}
          onCancelItem={(item, reason) => { 
            setSelectedItem(item); 
            setItemCancelReason(reason || ''); 
            setShowCancelItemModal(true); 
          }}
          onReplacementRequest={(item, availableSizes) => { 
            console.log('🔍 Replacement request clicked in OrderDetailsPage:', { item, availableSizes });
            console.log('🔍 Before state update:', {
              currentSelectedItem: selectedItem?.product_name,
              currentShowReplacementForm: showReplacementForm
            });
            
            // Fetch available sizes for this product
            const fetchProductSizes = async () => {
              try {
                const { data: product } = await supabase
                  .from('products')
                  .select('sizes')
                  .eq('product_id', item.product_id)
                  .single();
                
                if (product?.sizes) {
                  const sizes = getAvailableSizes(product);
                  console.log('📏 Available sizes fetched:', sizes);
                  setAvailableSizesForReplacement(sizes);
                }
              } catch (error) {
                console.error('Error fetching product sizes:', error);
                setAvailableSizesForReplacement([]);
              }
            };
            
            // Set state immediately and ensure modal renders
            setSelectedItem(item); 
            setShowReplacementForm(true); 
            
            // Fetch available sizes
            fetchProductSizes();
            
            // Force a re-render by using setTimeout
            setTimeout(() => {
              console.log('🔍 State after setting:', {
                selectedItem: item.product_name,
                showReplacementForm: true,
                availableSizesForReplacement: [] // Will be updated after fetch
              });
            }, 0);
          }}
          existingReviews={existingReviews}
          existingReplacements={existingReplacements}
          existingRefunds={existingRefunds}
          formatRefundMessage={formatRefundMessage}
          getReplacementStatus={getReplacementStatus}
          getReplacementReason={getReplacementReason}
        />

        {/* Shipping & Payment */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Shipping & Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h3>
              <address className="not-italic text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>{order.shipping_address?.name || 'N/A'}</div>
                <div>{order.shipping_address?.address || 'N/A'}</div>
                <div>
                  {order.shipping_address?.city || 'N/A'}, {order.shipping_address?.district ? `${order.shipping_address.district}, ` : ''}{order.shipping_address?.state || 'N/A'} - {order.shipping_address?.pincode || 'N/A'}
                </div>
                <div>Phone: {order.shipping_address?.phone || 'N/A'}</div>
              </address>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">Payment Details</h3>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Method: <span className="font-medium capitalize">{order.payment_method}</span></div>
                <div>Status: <span className="font-medium capitalize">{order.payment_status}</span></div>
                <div>Total: <span className="font-medium">₹{order.effective_amount?.toFixed(2) || '0.00'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        {!isGuest && !isGuestUser && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">Need Help?</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
              If you have any questions about your order,<br/> please contact our customer service at support@ficishoes.com.
            </p>
            <a
              href="mailto:support@ficishoes.com"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        )}

        {/* Cancel Item Modal */}
        <CancelModal
          isOpen={showCancelItemModal}
          onClose={() => { setShowCancelItemModal(false); setSelectedItem(null); setItemCancelReason(''); }}
          onConfirm={() => handleCancelItemWithReason(selectedItem)}
          type="item"
          order={order as any}
          reason={itemCancelReason}
          onReasonChange={setCancelReason}
          isProcessing={processingItem}
        />

        {/* Cancel Entire Order Modal */}
        <CancelModal
          isOpen={showCancelModal}
          onClose={() => { setShowCancelModal(false); setCancelReason(''); setCancelComments(''); }}
          onConfirm={handleCancelEntireOrder}
          type="order"
          order={order as any}
          reason={cancelReason}
          onReasonChange={setCancelReason}
          comments={cancelComments}
          onCommentsChange={setCancelComments}
          isProcessing={cancellingOrder}
        />

        {/* Replacement Request Modal */}
        {(() => {
          console.log('🔍 Modal visibility check:', {
            showReplacementForm,
            selectedItem: selectedItem?.product_name,
            shouldShow: showReplacementForm && selectedItem
          });
          return showReplacementForm && selectedItem;
        })() && (
          <ReplacementRequestModal
            isOpen={showReplacementForm}
            onClose={() => {
              setShowReplacementForm(false);
              setSelectedItem(null);
              setItemReplacementReason('');
            }}
            selectedItem={selectedItem}
            replacementReason={itemReplacementReason}
            setReplacementReason={setItemReplacementReason}
            processingItem={processingItem}
            onConfirmReplacement={handleReplacementFormConfirm}
            availableSizes={availableSizesForReplacement}
          />
        )}

        {/* Return Item Modal */}
        {showReturnItemModal && selectedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Request Return</h2>
                <button onClick={() => { setShowReturnItemModal(false); setSelectedItem(null); setItemReturnReason(''); setReturnImage(null); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Item to return:</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">{selectedItem.product_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Size: {selectedItem.size} | Quantity: {selectedItem.quantity}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Price: ₹{selectedItem.price_at_purchase}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for return</label>
                <textarea
                  value={itemReturnReason}
                  onChange={(e) => setItemReturnReason(e.target.value)}
                  placeholder="Please describe the reason for return..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload image (optional)</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReturnImage(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-600 dark:text-gray-300"
                  />
                  {returnImage && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Selected: {returnImage.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReturnItemModal(false); setSelectedItem(null); setItemReturnReason(''); setReturnImage(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnItem}
                  disabled={processingItem || !itemReturnReason}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {processingItem ? 'Submitting...' : 'Submit Return'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedItemForReview && (
          <ReviewModal
            order={order as unknown as Order}
            item={selectedItemForReview}
            onClose={handleCloseReviewModal}
            onSubmit={(reviewData) => {
              if (selectedItemForReview) {
                handleReviewSubmitted(selectedItemForReview.product_id, {
                  rating: reviewData.rating,
                  comment: reviewData.comment,
                  images: []
                });
              }
            }}
          />
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in max-w-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">
              {successMessage}
            </span>
            <button onClick={() => setShowSuccessMessage(false)} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* OTP Verification Modal for Guest Users */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Verify Your Identity
                </h2>
                <button 
                  onClick={() => { 
                    setShowOtpModal(false); 
                    setPendingAction(null); 
                    setPendingReason(''); 
                  }} 
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                For your security, please verify your identity before proceeding with this action.
              </p>

              <OtpFlow
                purpose={pendingAction === 'cancel' ? 'cancel' : 'replacement'}
                onVerified={handleOtpVerified}
                onCancel={() => {
                  setShowOtpModal(false);
                  setPendingAction(null);
                  setPendingReason('');
                }}
                prefilledMethod={order?.guest_email ? 'email' : 'phone'}
                initialEmail={order?.guest_email}
                initialPhone={order?.guest_phone}
                userType="guest"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;