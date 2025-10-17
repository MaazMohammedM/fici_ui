import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Truck, CheckCircle, XCircle, Clock, Package, ArrowLeft, X, Upload } from 'lucide-react';
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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
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
  const { user, isGuest: isGuestUser, guestSession } = useAuthStore();
  const { fetchOrderById, updateOrderStatus, cancelOrderItem, requestReturnItem, loading: storeLoading, error: storeError } = useOrderStore();
  // Source of truth for DB-backed order_items
  const [dbItems, setDbItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setIsLoading(true);

        // Use orderStore API to fetch order
        let email, phone, tpin;
        if (isGuest) {
          email = searchParams.get('email') || undefined;
          tpin = searchParams.get('tpin') || undefined;
        }

        const orderData = await fetchOrderById(orderId, email, phone, tpin);

        if (!orderData) {
          throw new Error('Order not found or access denied');
        }

        // Transform order data to match our interface
        const transformedOrder: OrderDetails = {
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

        console.log('🔍 DEBUG - Order Data Transformation:');
        console.log('Raw orderData:', orderData);
        console.log('Raw orderData.items:', orderData.items);
        const itemsArray = orderData.items;
        if (Array.isArray(itemsArray)) {
          console.log('Raw orderData.items full details:', itemsArray.map((item: any) => ({
            order_item_id: item.order_item_id,
            item_status: item.item_status,
            status: item.status,
            product_name: item.product_name
          })));
        }
        console.log('Transformed order items:', transformedOrder.items.map(item => ({
          id: item.order_item_id,
          status: item.item_status,
          product: item.product_name
        })));

        setOrder(transformedOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
        console.error('Error fetching order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isGuest, searchParams, fetchOrderById]);

  // Fetch order_items from DB for accurate IDs and statuses
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

  const cancelOrder = async () => {
    if (!order) return;

    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!order || !cancelReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    if (selectedItemsForCancel.length === 0) {
      alert('Please select at least one item to cancel');
      return;
    }

    try {
      setCancellingOrder(true);
      console.log('Cancelling items:', selectedItemsForCancel);

      // Verify items exist in DB before updating
      const { data: toUpdate, error: checkError } = await supabase
        .from('order_items')
        .select('order_item_id, order_id, item_status')
        .eq('order_id', order.order_id)
        .in('order_item_id', selectedItemsForCancel);

      if (checkError) throw new Error(`Failed to verify items: ${checkError.message}`);
      if (!toUpdate || toUpdate.length === 0) {
        console.warn('No matching order_items found for cancellation');
        alert('No matching items found to cancel. Please refresh and try again.');
        return;
      }

      // Step 1: Update selected order_items to cancelled status
      const { data: updatedItems, error: itemsError } = await supabase
        .from('order_items')
        .update({
          item_status: 'cancelled',
          cancel_reason: cancelReason
        })
        .in('order_item_id', selectedItemsForCancel)
        .eq('order_id', order.order_id) // Add order_id filter
        .select();

      if (itemsError) {
        console.error('Error updating order items:', itemsError);
        throw new Error(`Failed to cancel order items: ${itemsError.message}`);
      }
      console.log('Updated items:', updatedItems);

      // Step 2: Calculate aggregate order status
      const { data: allItems, error: fetchError } = await supabase
        .from('order_items')
        .select('item_status')
        .eq('order_id', order.order_id);

      if (fetchError) {
        console.error('Error fetching order items:', fetchError);
        throw new Error(`Failed to fetch order items: ${fetchError.message}`);
      }

      console.log('All items after cancel:', allItems);

      // Determine new order status
      const statuses = allItems?.map(i => i.item_status) || [];
      const allCancelled = statuses.every(s => s === 'cancelled');
      const someCancelled = statuses.some(s => s === 'cancelled');
      
      let newOrderStatus: any = order.status;
      if (allCancelled) {
        newOrderStatus = 'cancelled';
      } else if (someCancelled) {
        newOrderStatus = 'partially_cancelled';
      }

      console.log('New order status:', newOrderStatus);

      // Step 3: Update order status
      const updateData: any = {
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
        order_status: cancelReason || 'cancelled',
        comments: cancelComments || null
      };

      if (allCancelled) {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { data: updatedOrder, error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', order.order_id)
        .select();

      if (orderError) {
        console.error('Error updating order:', orderError);
        throw new Error(`Failed to update order: ${orderError.message}`);
      }

      console.log('Updated order:', updatedOrder);

      // Update local state
      const updatedItemsLocal = dbItems.map(item => {
        if (selectedItemsForCancel.includes(item.order_item_id)) {
          return { ...item, item_status: 'cancelled' as const, cancel_reason: cancelReason };
        }
        return item;
      });
      setDbItems(updatedItemsLocal);
      setOrder({ ...order, status: newOrderStatus, items: updatedItemsLocal });
      setShowCancelModal(false);
      setCancelReason('');
      setCancelComments('');
      setSelectedItemsForCancel([]);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to cancel items: ${errorMessage}`);
      console.error('Error cancelling items:', err);
    } finally {
      setCancellingOrder(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
    setCancelComments('');
  };

  const canCancelOrder = (order: OrderDetails) => {
    // Use dbItems for cancel check since it comes directly from database with accurate statuses
    // If dbItems is not loaded yet, fall back to order.items
    const itemsToCheck = dbItems.length > 0 ? dbItems : order.items;

    const cancellableItems = itemsToCheck.filter(item => canCancelItem(item));
    console.log('🔍 DEBUG - Cancel Order Check:');
    console.log('Order payment method:', order.payment_method);
    console.log('Order status:', order.status);
    console.log('Using items for check:', itemsToCheck.length > 0 ? 'dbItems' : 'order.items');
    console.log('Items count:', itemsToCheck.length);
    console.log('Items details:', itemsToCheck.map(item => ({
      id: item.order_item_id,
      status: item.item_status || (item as any).status,
      product: item.product_name
    })));
    console.log('Cancellable items count:', cancellableItems.length);
    console.log('Cancellable items:', cancellableItems.map(item => ({
      id: item.order_item_id,
      status: item.item_status || (item as any).status
    })));

    return cancellableItems.length > 0;
  };

  const canReturnOrder = (order: OrderDetails) => {
    // Check if there are any items that can be returned
    return order.items.some(item => canReturnItem(item));
  };

  const openReturnModal = (order: OrderDetails) => {
    setSelectedOrderForReturn(order);
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedOrderForReturn(null);
  };

  const handleReturnSuccess = () => {
    closeReturnModal();
    // Refresh order data
    window.location.reload();
  };

  // Item-level action handlers
  const openCancelItemModal = (item: OrderItem) => {
    setSelectedItem(item);
    setShowCancelItemModal(true);
  };

  const closeCancelItemModal = () => {
    setShowCancelItemModal(false);
    setSelectedItem(null);
    setItemCancelReason('');
  };

  const handleCancelItem = async () => {
    if (!selectedItem || !itemCancelReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    try {
      setProcessingItem(true);
      await cancelOrderItem(
        selectedItem.order_item_id,
        itemCancelReason,
        user?.id,
        guestSession?.guest_session_id
      );
      
      // Refresh order
      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        await fetchOrderById(orderId, email, undefined, tpin);
      }
      
      closeCancelItemModal();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      alert(`Failed to cancel item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingItem(false);
    }
  };

  const openReturnItemModal = (item: OrderItem) => {
    setSelectedItem(item);
    setShowReturnItemModal(true);
  };

  const closeReturnItemModal = () => {
    setShowReturnItemModal(false);
    setSelectedItem(null);
    setItemReturnReason('');
    setReturnImage(null);
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
      
      // Refresh order
      if (orderId) {
        const email = isGuest ? searchParams.get('email') || undefined : undefined;
        const tpin = isGuest ? searchParams.get('tpin') || undefined : undefined;
        await fetchOrderById(orderId, email, undefined, tpin);
      }
      
      closeReturnItemModal();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      alert(`Failed to request return: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingItem(false);
    }
  };

  // Helper functions for item status
  const getItemStatusColor = (status?: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'returned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'refunded':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const canCancelItem = (item: OrderItem) => {
    // Get the item status - check both item_status and status fields
    const itemStatus = item.item_status || (item as any).status || 'pending';

    // Can only cancel items that are pending and not already cancelled/returned/refunded
    return itemStatus === 'pending' &&
           !['cancelled', 'returned', 'refunded'].includes(itemStatus);
  };

  const canReturnItem = (item: OrderItem) => {
    // Can only return items that are delivered (not shipped or other statuses)
    return item.item_status === 'delivered' &&
           !['returned', 'refunded', 'cancelled'].includes(item.item_status || '');
  };

  const getAggregateOrderMessage = (items: OrderItem[]) => {
    if (!items || items.length === 0) return '';

    const statuses = items.map(item => item.item_status || 'pending');
    const allCancelled = statuses.every(s => s === 'cancelled');
    const allDelivered = statuses.every(s => s === 'delivered');
    const someCancelled = statuses.some(s => s === 'cancelled' || s === 'refunded');
    const someProcessing = statuses.some(s => s === 'shipped' || s === 'pending');

    if (allCancelled) return 'This order has been cancelled.';
    if (allDelivered) return 'All items have been delivered.';
    if (someCancelled && someProcessing) return 'Partially fulfilled order.';
    if (someProcessing) return 'Some items are being processed.';

    return '';
  };

  if (isLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || storeError) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || storeError}</p>
              <div className="mt-4">
                <Link
                  to={isGuest ? '/guest/orders' : '/orders'}
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  &larr; Back to {isGuest ? 'Order Lookup' : 'Order History'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-gray-600 mb-4">We couldn't find an order with that ID.</p>
          <Link
            to={isGuest ? '/guest/orders' : '/orders'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to {isGuest ? 'Order Lookup' : 'Order History'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to={isGuest ? '/guest/orders' : '/orders'}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {isGuest ? 'Order Lookup' : 'Order History'}
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_id.split('-')[0]}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Placed on {new Date(order.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  (() => {
                    const statuses = order.items.map(item => item.item_status || 'pending');
                    const allCancelled = statuses.every(s => s === 'cancelled');
                    const allDelivered = statuses.every(s => s === 'delivered');

                    if (allCancelled) return 'bg-red-100 text-red-800';
                    if (allDelivered) return 'bg-green-100 text-green-800';
                    if (order.status === 'shipped') return 'bg-blue-100 text-blue-800';
                    if (order.status === 'cancelled') return 'bg-red-100 text-red-800';
                    return 'bg-yellow-100 text-yellow-800';
                  })()
                }`}>
                  {(() => {
                    const statuses = order.items.map(item => item.item_status || 'pending');
                    const allCancelled = statuses.every(s => s === 'cancelled');
                    const allDelivered = statuses.every(s => s === 'delivered');

                    if (allCancelled) return 'Cancelled';
                    if (allDelivered) return 'Delivered';
                    return order.status.charAt(0).toUpperCase() + order.status.slice(1);
                  })()}
                </span>

                {/* Action Buttons */}
                {(!isGuest || order.payment_method === 'cod') && !isGuestUser && (
                  <div className="flex gap-2">
                    {canCancelOrder(order) && (
                      <button
                        onClick={cancelOrder}
                        disabled={cancellingOrder}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    {canReturnOrder(order) && (
                      <button
                        onClick={() => openReturnModal(order)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Request Return
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Tracking Section */}
          {(order.status === 'shipped' || order.status === 'delivered') && (order.tracking_id || order.shipping_partner) && (
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Shipment Tracking
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {order.shipping_partner && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Shipping Partner</h3>
                    <p className="mt-1 text-sm text-gray-600">{order.shipping_partner}</p>
                  </div>
                )}
                {order.tracking_id && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Tracking ID</h3>
                    <p className="mt-1 text-sm text-gray-600 font-mono">{order.tracking_id}</p>
                  </div>
                )}
                {order.tracking_url && (
                  <div className="md:col-span-2">
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      Track Package
                    </a>
                  </div>
                )}
                {order.shipped_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Shipped On</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(order.shipped_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {order.delivered_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Delivered On</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(order.delivered_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Order Items ({order.items.length})
            </h2>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.order_item_id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <img
                      src={item.product_thumbnail_url || item.thumbnail_url}
                      alt={item.product_name}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-base">{item.product_name}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getItemStatusColor(item.item_status)}`}>
                          {(item.item_status || 'pending').toUpperCase()}
                        </span>
                      </div>

                      {/* Attributes */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                        {item.size && <span>Size: <strong>{item.size}</strong></span>}
                        {item.color && <span>Color: <strong>{item.color}</strong></span>}
                        <span>Qty: <strong>{item.quantity}</strong></span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-bold text-gray-900">₹{(item.price_at_purchase! * item.quantity).toLocaleString('en-IN')}</span>
                        {item.mrp && item.mrp > item.price_at_purchase! && (
                          <>
                            <span className="text-sm text-gray-500 line-through">₹{(item.mrp * item.quantity).toLocaleString('en-IN')}</span>
                            <span className="text-xs text-green-600 font-medium">
                              Save ₹{((item.mrp - item.price_at_purchase!) * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Status Timeline - Simplified */}
                      <div className="flex items-center gap-1 mb-3">
                        {item.item_status === 'cancelled' || item.item_status === 'refunded' ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              {item.item_status === 'cancelled' ? 'Cancelled' : 'Refunded'}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className={`flex items-center gap-1 ${['pending', 'shipped', 'delivered'].includes(item.item_status || 'pending') ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className="w-2 h-2 rounded-full bg-current"></div>
                              <span className="text-xs">Ordered</span>
                            </div>
                            <div className={`flex-1 h-0.5 ${['shipped', 'delivered'].includes(item.item_status || '') ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                            <div className={`flex items-center gap-1 ${['shipped', 'delivered'].includes(item.item_status || '') ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className="w-2 h-2 rounded-full bg-current"></div>
                              <span className="text-xs">Shipped</span>
                            </div>
                            <div className={`flex-1 h-0.5 ${item.item_status === 'delivered' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                            <div className={`flex items-center gap-1 ${item.item_status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className="w-2 h-2 rounded-full bg-current"></div>
                              <span className="text-xs">Delivered</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Cancel/Return Reason */}
                      {(item.item_status === 'cancelled' || item.item_status === 'returned' || item.item_status === 'refunded') && (item.cancel_reason || item.return_reason) && (
                        <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <strong>Reason:</strong> {item.cancel_reason || item.return_reason}
                        </div>
                      )}

                      {/* Item Actions */}
                      {!isGuest && !isGuestUser && (
                        <div className="flex gap-2">
                          {canCancelItem(item) && (
                            <button
                              onClick={() => openCancelItemModal(item)}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                              title="Cancel this item"
                            >
                              Cancel Item
                            </button>
                          )}
                          {canReturnItem(item) && (
                            <button
                              onClick={() => openReturnItemModal(item)}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                              title="Request return for this item"
                            >
                              Request Return
                            </button>
                          )}
                          {!canCancelItem(item) && !canReturnItem(item) && (
                            <span className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-md">
                              No actions available
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="space-y-3">
                {/* Total MRP */}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total MRP</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{order.items.reduce((total, item) => total + ((item.mrp || item.price_at_purchase) * item.quantity), 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">Discount</span>
                    <span className="text-sm font-medium text-green-600">-₹{Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delivery</span>
                  <span className="text-sm font-medium text-gray-900">
                    {order.delivery_charge === 0 ? 'Free' : `₹${order.delivery_charge?.toFixed(2) || '0.00'}`}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-bold text-gray-900">₹{order.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping & Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
                <address className="mt-2 not-italic text-sm text-gray-600">
                  {order.shipping_address?.name || 'N/A'}<br />
                  {order.shipping_address?.address || 'N/A'}<br />
                  {order.shipping_address?.city || 'N/A'}, {(order.shipping_address as any)?.district && `${(order.shipping_address as any).district}, `}{order.shipping_address?.state || 'N/A'}<br />
                  {order.shipping_address?.pincode || 'N/A'}<br />
                  Phone: {order.shipping_address?.phone || 'N/A'}
                </address>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Payment Method</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="capitalize">{order.payment_method?.replace(/_/g, ' ') || 'N/A'}</p>
                  <p className="mt-1 text-sm text-gray-500 capitalize">
                    {order.payment_status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!isGuest && !isGuestUser && (
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Need Help?</h2>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about your order, please contact our customer service.
              </p>
              <a
                href="mailto:support@fici.com"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Contact Support
              </a>
            </div>
          )}
        </div>

        {/* Cancel Order Modal with Item Selection */}
        {showCancelModal && order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cancel Order Items</h2>
                <button onClick={closeCancelModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Select the items you want to cancel and provide a reason. This will help us improve our service.
              </p>

              {/* Item Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Items to Cancel
                  </label>
                  <button
                    onClick={() => {
                      const cancelableItems = dbItems
                        .filter(item => canCancelItem(item))
                        .map(item => item.order_item_id);
                      setSelectedItemsForCancel(cancelableItems);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Select All Cancellable
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {dbItems.map((item) => {
                    const isDisabled = !canCancelItem(item);
                    return (
                      <label
                        key={item.order_item_id}
                        className={`flex items-center gap-3 p-2 rounded ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemsForCancel.includes(item.order_item_id)}
                          onChange={(e) => {
                            if (e.target.checked && !canCancelItem(item)) {
                              return; // Prevent checking items that can't be cancelled
                            }
                            if (e.target.checked) {
                              setSelectedItemsForCancel(prev => [...prev, item.order_item_id]);
                            } else {
                              setSelectedItemsForCancel(prev => prev.filter(id => id !== item.order_item_id));
                            }
                          }}
                          disabled={isDisabled}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <img
                          src={item.thumbnail_url || item.product_thumbnail_url}
                          alt={item.product_name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-600">
                            Size: {item.size} • Qty: {item.quantity} • Status: {item.item_status || 'pending'}
                          </p>
                        </div>
                        <p className="text-sm font-medium">₹{(item.price_at_purchase! * item.quantity).toLocaleString('en-IN')}</p>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedItemsForCancel.length} item(s) selected
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for cancellation *
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="changed_mind">Changed my mind</option>
                    <option value="found_better_deal">Found a better deal elsewhere</option>
                    <option value="wrong_item">Ordered wrong item</option>
                    <option value="delivery_too_slow">Delivery time too late</option>
                    <option value="duplicate_order">Duplicate order</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional comments (Optional)
                  </label>
                  <textarea
                    value={cancelComments}
                    onChange={(e) => setCancelComments(e.target.value)}
                    placeholder="Please provide any additional details..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeCancelModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={cancellingOrder}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancellingOrder || !cancelReason || selectedItemsForCancel.length === 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {cancellingOrder ? 'Cancelling...' : `Cancel ${selectedItemsForCancel.length} Item(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Request Modal - Simple implementation for now */}
        {showReturnModal && selectedOrderForReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Request Return</h2>
              <p className="text-gray-600 mb-4">
                You can request a return within 3 days of delivery. Our customer service team will contact you to arrange the pickup.
              </p>
              <div className="space-y-3 mb-6">
                <p className="text-sm"><strong>Order ID:</strong> {selectedOrderForReturn.order_id}</p>
                <p className="text-sm"><strong>Items:</strong> {selectedOrderForReturn.items.length} item(s)</p>
                <p className="text-sm"><strong>Delivered:</strong> {selectedOrderForReturn.delivered_at ? new Date(selectedOrderForReturn.delivered_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeReturnModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnSuccess}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Return Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Item Modal */}
        {showCancelItemModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cancel Item</h2>
                <button onClick={closeCancelItemModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <img
                    src={selectedItem.product_thumbnail_url || selectedItem.thumbnail_url}
                    alt={selectedItem.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.product_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedItem.size && `Size: ${selectedItem.size}`}
                      {selectedItem.color && ` • Color: ${selectedItem.color}`}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please select a reason for cancelling this item.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for cancellation *
                  </label>
                  <select
                    value={itemCancelReason}
                    onChange={(e) => setItemCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="changed_mind">Changed my mind</option>
                    <option value="found_better_deal">Found a better deal elsewhere</option>
                    <option value="wrong_item">Ordered wrong item</option>
                    <option value="delivery_too_slow">Delivery time too late</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeCancelItemModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={processingItem}
                >
                  Keep Item
                </button>
                <button
                  onClick={handleCancelItem}
                  disabled={processingItem || !itemCancelReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processingItem ? 'Cancelling...' : 'Cancel Item'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Item Modal */}
        {showReturnItemModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Request Return</h2>
                <button onClick={closeReturnItemModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <img
                    src={selectedItem.product_thumbnail_url || selectedItem.thumbnail_url}
                    alt={selectedItem.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.product_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedItem.size && `Size: ${selectedItem.size}`}
                      {selectedItem.color && ` • Color: ${selectedItem.color}`}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please provide a reason for returning this item and optionally upload an image.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for return *
                  </label>
                  <textarea
                    value={itemReturnReason}
                    onChange={(e) => setItemReturnReason(e.target.value)}
                    placeholder="Please describe the issue..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Image (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400">
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {returnImage ? returnImage.name : 'Choose file'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReturnImage(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {returnImage && (
                      <button
                        onClick={() => setReturnImage(null)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeReturnItemModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={processingItem}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnItem}
                  disabled={processingItem || !itemReturnReason}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {processingItem ? 'Submitting...' : 'Submit Return'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          Order cancelled successfully!
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="ml-2 text-white hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );      
};

export default OrderDetailsPage;
