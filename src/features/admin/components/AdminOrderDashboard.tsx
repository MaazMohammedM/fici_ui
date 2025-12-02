import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { calculateAggregateOrderStatus } from '@store/orderStore';
import { CheckCircle, XCircle, Clock, Eye, Ban, Truck as TruckIcon, DollarSign, Package, Filter, RefreshCw, Search, X } from 'lucide-react';
import AlertModal from '@components/ui/AlertModal';
import { updateOrderItemStatus, type OrderAction } from '@/lib/orderActions';
import { useOrderItemActionStates, type OrderData, type OrderItem, getOrderActionStates, type PaymentMethod, type PaymentStatus, type ItemStatus } from '@/hooks/useOrderActionStates';
import { orderToast } from '@/lib/orderToast';
import OrderItemActions from '@/features/orders/components/OrderItemActions';
interface Order {
  order_id: string;
  order_date: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_delivered' | 'partially_cancelled' | 'partially_refunded' | 'partially_shipped';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method: 'cod' | 'razorpay';
  total_amount: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  cod_fee: number;
  shipping_address: any;
  order_type: 'guest' | 'registered';
  guest_email?: string;
  guest_phone?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipping_partner?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  user_id?: string;
  guest_session_id?: string;
  order_status?: string;
  comments?: string;
  razorpay_payment_id?: string;
  order_items: Array<{
    order_item_id: string;
    product_name: string;
    product_id: string;
    size: string;
    quantity: number;
    price_at_purchase: number;
    thumbnail_url: string;
    item_status?: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded';
    cancel_reason?: string;
    return_reason?: string;
    refund_amount?: number;
    refunded_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    return_requested_at?: string;
    return_approved_at?: string;
  }>;
}

interface Return {
  return_id: string;
  order_id: string;
  order_item_id?: string;
  user_id?: string;
  guest_session_id?: string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  resolved_at?: string;
  order_items?: Array<{
    product_name: string;
    thumbnail_url: string;
    quantity: number;
  }>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'shipped': return <TruckIcon className="w-4 h-4 text-blue-500" />;
    case 'partially_shipped': return <TruckIcon className="w-4 h-4 text-blue-500" />;
    case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
    default: return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'paid': return 'text-green-600 bg-green-50 border-green-200';
    case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'partially_shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'delivered': return 'text-green-700 bg-green-50 border-green-200';
    case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
    case 'partially_delivered': return 'text-green-600 bg-green-50 border-green-200';
    case 'partially_cancelled': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'partially_refunded': return 'text-purple-600 bg-purple-50 border-purple-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const AdminOrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    shipping_partner: '',
    tracking_id: '',
    tracking_url: '',
  });
  
  // State for custom shipping partner input
  const [showCustomPartnerInput, setShowCustomPartnerInput] = useState(false);

  // Refund form state
  const [refundForm, setRefundForm] = useState({
    amount: 0,
    reason: '',
    refund_reference: '',
    items: [] as string[], // order_item_ids to refund
  });

  // Selected items for ship/deliver actions
  const [selectedItemsForShip, setSelectedItemsForShip] = useState<string[]>([]);
  const [selectedItemsForDeliver, setSelectedItemsForDeliver] = useState<string[]>([]);

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  // Helper function to show alert modal
  const showAlert = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setAlertModal({
      isOpen: true,
      message,
      type
    });
  };

  // Check if user is admin - use role from store (more reliable)
  const isAdmin = role === 'admin' || user?.role === 'admin';

  // Force refresh user profile data
  const refreshUserProfile = async () => {
    if (user) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, first_name')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          useAuthStore.getState().setRole(profile.role);
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          order_items (
            product_name,
            thumbnail_url,
            quantity
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (err) {
      console.error('Error fetching returns:', err);
      showAlert(`Failed to fetch returns: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const updateReturnStatus = async (returnId: string, action: string) => {
    try {
      setProcessingAction(`return-${returnId}-${action}`);

      const { error } = await supabase.functions.invoke('manage-returns?action=update', {
        body: {
          return_id: returnId,
          action
        }
      });

      if (error) throw error;

      await fetchReturns();
      alert(`Return ${action}d successfully`);
    } catch (err: any) {
      alert(`Failed to ${action} return: ${err.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const updateOrderStatus = async (orderId: string, action: string, data?: any) => {
    try {
      setProcessingAction(`${orderId}-${action}`);

      // Handle 'ship' action with direct Supabase REST API (same as handleUpdateShipment)
      if (action === 'ship') {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'shipped',
            shipping_partner: data?.shipping_partner || '',
            tracking_id: data?.tracking_id || '',
            tracking_url: data?.tracking_url || '',
            shipped_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (error) throw error;

        await fetchOrders();
        setShowOrderModal(false);
        showAlert('Order shipped successfully', 'success');
      }
      // Handle 'deliver' action - show modal for item selection
      else if (action === 'deliver') {
        // Open deliver modal instead of directly updating
        setShowDeliverModal(true);
        return; // Don't close the order modal yet
      }
      // Handle 'update_status' action - recalculate and update order status
      else if (action === 'update_status') {
        await updateAggregateOrderStatus(orderId);
        await fetchOrders();
        return;
      }
      // Handle 'update_payment_status' action
      else if (action === 'update_payment_status') {
        await updatePaymentStatus(orderId);
        await fetchOrders();
        return;
      }
      // Handle other actions (cancel, etc.) with direct database updates
      else {
        const { error } = await supabase
          .from('orders')
          .update({
            status: action,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);

        if (error) throw error;

        await fetchOrders();
        setShowOrderModal(false);
        showAlert(`Order ${action} successful`, 'success');
      }
    } catch (err: any) {
      showAlert(`Failed to ${action} order: ${err.message}`, 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  // In the handleUpdateShipment function, update the order status correctly:
const handleUpdateShipment = async () => {
  if (!selectedOrder || selectedItemsForShip.length === 0) {
    showAlert('Please select at least one item to ship', 'warning');
    return;
  }

  // Validate shipping partner
  const isValidShippingPartner = showCustomPartnerInput 
    ? shipmentForm.shipping_partner && shipmentForm.shipping_partner !== 'other' && shipmentForm.shipping_partner.trim() !== ''
    : shipmentForm.shipping_partner && shipmentForm.shipping_partner !== '';

  if (!isValidShippingPartner || !shipmentForm.tracking_id) {
    showAlert('Please enter shipping partner and tracking ID', 'warning');
    return;
  }

  try {
    setProcessingAction(`shipment-${selectedOrder.order_id}`);

    // 1. First update all selected items with shipping info
    for (const itemId of selectedItemsForShip) {
      await updateOrderItemStatus({
        action: 'ship_item',
        orderItemId: itemId,
        isAdmin: true,
        adminUserId: user?.id,
        shipping_partner: shipmentForm.shipping_partner,
        tracking_id: shipmentForm.tracking_id,
        tracking_url: shipmentForm.tracking_url
      });
    }

    // 2. Then update the order with shipping details
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'shipped', // Make sure this is a valid status
        shipping_partner: shipmentForm.shipping_partner,
        tracking_id: shipmentForm.tracking_id,
        tracking_url: shipmentForm.tracking_url,
        shipped_at: new Date().toISOString(),
      })
      .eq('order_id', selectedOrder.order_id)
      .select('status'); // Add this to see what's being returned

    if (orderError) {
      console.error('Error updating order:', orderError);
      throw orderError;
    }

    // 3. Refresh the orders list
    await fetchOrders();
    setShowShipmentModal(false);
    setSelectedOrder(null);
    setShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' });
    setShowCustomPartnerInput(false);
    setSelectedItemsForShip([]);
    showAlert('Items shipped successfully', 'success');

  } catch (error: any) {
    console.error('Error in handleUpdateShipment:', {
      error,
      message: error.message,
      details: error.details
    });
    showAlert(`Failed to update shipment: ${error.message || 'Unknown error'}`, 'error');
  } finally {
    setProcessingAction(null);
  }
};

  const handleShipItem = async (orderItemId: string, orderId: string) => {
    try {
      // Validate shipping partner
      const isValidShippingPartner = showCustomPartnerInput 
        ? shipmentForm.shipping_partner && shipmentForm.shipping_partner !== 'other' && shipmentForm.shipping_partner.trim() !== ''
        : shipmentForm.shipping_partner && shipmentForm.shipping_partner !== '';

      if (!isValidShippingPartner || !shipmentForm.tracking_id) {
        showAlert('Please enter shipping partner and tracking ID', 'warning');
        return;
      }
      setProcessingAction(`ship-item-${orderItemId}`);

      // Use the Edge Function for shipping items
      await updateOrderItemStatus({
        action: 'ship_item',
        orderItemId,
        isAdmin: true,
        adminUserId: user?.id,
        shipping_partner: shipmentForm.shipping_partner,
        tracking_id: shipmentForm.tracking_id,
        tracking_url: shipmentForm.tracking_url
      });

      // Recalculate and update order status
      await updateAggregateOrderStatus(orderId);
      await fetchOrders();
      orderToast.itemShipped(`Item ${orderItemId}`);
    } catch (error) {
      console.error('Error shipping item:', error);
      showAlert(`Failed to ship item: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeliverItem = async (orderItemId: string, orderId: string) => {
    try {
      setProcessingAction(`deliver-item-${orderItemId}`);

      // Use the Edge Function for delivering items
      await updateOrderItemStatus({
        action: 'deliver_item',
        orderItemId,
        isAdmin: true,
        adminUserId: user?.id
      });

      await updateAggregateOrderStatus(orderId);
      await fetchOrders();
      orderToast.itemDelivered(`Item ${orderItemId}`);
    } catch (error) {
      console.error('Error delivering item:', error);
      orderToast.deliveryFailed(`Item ${orderItemId}`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCancelItem = async (orderItemId: string, orderId: string, reason: string) => {
    try {
      setProcessingAction(`cancel-item-${orderItemId}`);

      // Use the Edge Function for cancelling items
      await updateOrderItemStatus({
        action: 'cancel_item',
        orderItemId,
        reason,
        isAdmin: true,
        adminUserId: user?.id
      });

      await updateAggregateOrderStatus(orderId);
      await fetchOrders();
      orderToast.itemCancelled(`Item ${orderItemId}`);
    } catch (error) {
      console.error('Error cancelling item:', error);
      orderToast.cancellationFailed(`Item ${orderItemId}`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRefundItem = async (orderItemId: string, orderId: string, amount: number, reason: string, refReference: string) => {
    try {
      setProcessingAction(`refund-item-${orderItemId}`);

      // Use the Edge Function for refunding items
      await updateOrderItemStatus({
        action: 'refund_item',
        orderItemId,
        reason,
        isAdmin: true,
        adminUserId: user?.id
      });

      // Update payment status
      await updatePaymentStatus(orderId);
      await fetchOrders();

      setShowRefundModal(false);
      setRefundForm({ amount: 0, reason: '', refund_reference: '', items: [] });
      orderToast.itemRefunded(`Item ${orderItemId}`);
    } catch (error) {
      console.error('Error refunding item:', error);
      orderToast.refundFailed(`Item ${orderItemId}`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBulkShipItems = async (itemIds: string[], orderId: string) => {
    try {
      setProcessingAction(`bulk-ship-${orderId}`);

      // Ship each item individually using the Edge Function
      for (const itemId of itemIds) {
        await updateOrderItemStatus({
          action: 'ship_item',
          orderItemId: itemId,
          isAdmin: true,
          adminUserId: user?.id,
          shipping_partner: shipmentForm.shipping_partner,
          tracking_id: shipmentForm.tracking_id,
          tracking_url: shipmentForm.tracking_url
        });
      }

      await updateAggregateOrderStatus(orderId);
      await fetchOrders();
      setSelectedItemsForShip([]);
      orderToast.success(`${itemIds.length} items shipped successfully`);
    } catch (error) {
      console.error('Error bulk shipping items:', error);
      orderToast.error('Failed to ship items');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBulkRefundItems = async (itemIds: string[], orderId: string, totalAmount: number, reason: string) => {
    try {
      setProcessingAction(`bulk-refund-${orderId}`);

      // Refund each item individually using the Edge Function
      for (const itemId of itemIds) {
        await updateOrderItemStatus({
          action: 'refund_item',
          orderItemId: itemId,
          reason,
          isAdmin: true,
          adminUserId: user?.id
        });
      }

      await updateAggregateOrderStatus(orderId);
      await updatePaymentStatus(orderId);
      await fetchOrders();
      setShowRefundModal(false);
      orderToast.success(`${itemIds.length} items refunded successfully`);
    } catch (error) {
      console.error('Error bulk refunding items:', error);
      orderToast.error('Failed to refund items');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleUpdateDeliver = async () => {
    if (!selectedOrder || selectedItemsForDeliver.length === 0) {
      showAlert('Please select at least one item to mark as delivered', 'warning');
      return;
    }

    try {
      setProcessingAction(`deliver-${selectedOrder.order_id}`);

      // Deliver each selected item using the Edge Function
      for (const itemId of selectedItemsForDeliver) {
        await updateOrderItemStatus({
          action: 'deliver_item',
          orderItemId: itemId,
          isAdmin: true,
          adminUserId: user?.id
        });
      }

      // Update order delivered_at timestamp
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          delivered_at: new Date().toISOString(),
        })
        .eq('order_id', selectedOrder.order_id);

      if (orderError) {
        console.error('Error updating orders:', orderError);
        throw orderError;
      }

      // Update aggregate order status
      await updateAggregateOrderStatus(selectedOrder.order_id);
      await fetchOrders();

      setShowDeliverModal(false);
      setSelectedOrder(null);
      setSelectedItemsForDeliver([]);
      showAlert(`${selectedItemsForDeliver.length} item(s) marked as delivered successfully`, 'success');
    } catch (error: any) {
      console.error('Error marking items as delivered:', error);
      showAlert(`Failed to mark items as delivered: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setProcessingAction(null);
    }
  };


  const updateAggregateOrderStatus = async (orderId: string) => {
    try {
      // Get all items for this order to compute aggregate status
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('item_status')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        throw itemsError;
      }

      if (!items || items.length === 0) {
        return;
      }

      // Calculate aggregate status based on item statuses
      const statuses = items.map(item => item.item_status || 'pending');

      let newOrderStatus = 'pending';
      const allDelivered = statuses.every(s => s === 'delivered');
      const allShipped = statuses.every(s => s === 'shipped');
      const allCancelled = statuses.every(s => s === 'cancelled');
      const allRefunded = statuses.every(s => s === 'refunded');

      const someDelivered = statuses.some(s => s === 'delivered');
      const someShipped = statuses.some(s => s === 'shipped');
      const someCancelled = statuses.some(s => s === 'cancelled');
      const someRefunded = statuses.some(s => s === 'refunded');

      if (allCancelled || allRefunded) {
        newOrderStatus = 'cancelled';
      } else if (allDelivered) {
        newOrderStatus = 'delivered';
      } else if (allShipped && !someDelivered && !someCancelled) {
        newOrderStatus = 'shipped';
      } else if (someCancelled || someRefunded) {
        if (someDelivered) {
          newOrderStatus = 'partially_delivered';
        } else if (someShipped) {
          newOrderStatus = 'partially_cancelled';
        } else {
          newOrderStatus = 'partially_cancelled';
        }
      } else if (someDelivered && (someShipped || statuses.some(s => s === 'pending'))) {
        newOrderStatus = 'partially_delivered';
      } else if (someShipped && !allShipped) {
        newOrderStatus = 'partially_shipped';
      }

      // Update the order status directly
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newOrderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        throw updateError;
      }

    } catch (error) {
      console.error('Error updating aggregate status:', error);
      throw error; // Re-throw to let caller handle it
    }
  };

  const updatePaymentStatus = async (orderId: string) => {
    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('item_status')
        .eq('order_id', orderId);

      if (error) throw error;

      const statuses = items?.map(i => i.item_status) || [];
      const allRefunded = statuses.every(s => s === 'refunded');
      const someRefunded = statuses.some(s => s === 'refunded');

      let paymentStatus = 'paid';
      if (allRefunded) paymentStatus = 'refunded';
      else if (someRefunded) paymentStatus = 'partially_refunded';

      await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('order_id', orderId);
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    // Apply specific filter logic based on statusFilter
    switch (statusFilter) {
      case 'cod-pending':
        // COD orders: payment_method as cod and status as pending
        return order.payment_method === 'cod' && order.status === 'pending';
      case 'paid-orders':
        // Paid orders: payment_method as razorpay and status as paid
        return order.payment_method === 'razorpay' && order.status === 'paid';
      case 'cancelled':
        // Cancelled orders
        return order.status === 'cancelled';
      case 'delivered':
        // Delivered orders
        return order.status === 'delivered';
      case 'partially_shipped':
        // Orders with some items shipped but not all
        return order.status === 'partially_shipped';
      case 'partially_delivered':
        // Orders with some items delivered but not all
        return order.status === 'partially_delivered';
      case 'partially_cancelled':
        // Orders with some items cancelled but not all
        return order.status === 'partially_cancelled';
      case 'all':
      default:
        // All orders - no filtering
        break;
    }

    // Filter by search term (if provided)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.order_id.toLowerCase().includes(searchLower) ||
        order.shipping_address?.name?.toLowerCase().includes(searchLower) ||
        order.shipping_address?.email?.toLowerCase().includes(searchLower) ||
        order.shipping_address?.phone?.includes(searchTerm) ||
        (order.guest_email && order.guest_email.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Calculate order statistics
  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      paid: orders.filter(o => o.status === 'paid').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const stats = getOrderStats();

  // Use utility function directly instead of hook to avoid Rules of Hooks violation
  const orderActionStates = useMemo(() => {
    if (orders.length === 0) return [];

    return orders.map(order => {
      // Safely handle undefined order_items
      const orderItems = order.order_items || [];

      // Check if any items can perform each action
      const hasShippableItems = orderItems.some(item =>
        getOrderActionStates(order.payment_method, order.payment_status, item.item_status || 'pending', item.delivered_at).canShip
      );

      const hasDeliverableItems = orderItems.some(item =>
        getOrderActionStates(order.payment_method, order.payment_status, item.item_status || 'pending', item.delivered_at).canDeliver
      );

      const hasRefundableItems = orderItems.some(item =>
        getOrderActionStates(order.payment_method, order.payment_status, item.item_status || 'pending', item.delivered_at).canRefund
      );

      const hasCancellableItems = orderItems.some(item =>
        getOrderActionStates(order.payment_method, order.payment_status, item.item_status || 'pending', item.delivered_at).canCancel
      );

      const hasReturnableItems = orderItems.some(item =>
        getOrderActionStates(order.payment_method, order.payment_status, item.item_status || 'pending', item.delivered_at).canReturn
      );

      const actionStates = {
        canShip: hasShippableItems,
        canDeliver: hasDeliverableItems,
        canRefund: hasRefundableItems,
        canCancel: hasCancellableItems,
        canReturn: hasReturnableItems,
      };

      return {
        orderId: order.order_id,
        actionStates,
        orderItems
      };
    });
  }, [orders]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      if (activeTab === 'returns') {
        fetchReturns();
      }
    }
  }, [isAdmin, activeTab]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Ban className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have admin privileges to access this page.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Debug Information:</p>
            <p>User: {user ? user.email : 'Not logged in'}</p>
            <p>Role: {user?.role || 'No role set'}</p>
            <p>Auth Type: {useAuthStore((state) => state.authType) || 'None'}</p>
            <button
              onClick={refreshUserProfile}
              className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Refresh Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-dark1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage orders, returns, and refunds</p>
            </div>
            <button
              onClick={() => {
                fetchOrders();
                if (activeTab === 'returns') fetchReturns();
              }}
              className="mt-4 sm:mt-0 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex flex-wrap sm:flex-nowrap space-x-4 sm:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'orders'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Orders ({filteredOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('returns')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'returns'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Returns ({returns.length})
                </button>
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p>Loading...</p>
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-dark2 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-dark2 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-dark2 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.paid}</p>
                      <p className="text-xs text-gray-500">Paid</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-dark2 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.shipped}</p>
                      <p className="text-xs text-gray-500">Shipped</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-dark2 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
                      <p className="text-xs text-gray-500">Delivered</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-dark2 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
                      <p className="text-xs text-gray-500">Cancelled</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="cod-pending">COD Orders (Pending)</option>
                    <option value="paid-orders">Paid Orders (Razorpay)</option>
                    <option value="cancelled">Cancelled Orders</option>
                    <option value="delivered">Delivered Orders</option>
                    <option value="shipped">Shipped Orders</option>
                    <option value="partially_shipped">Partially Shipped</option>
                    <option value="partially_delivered">Partially Delivered</option>
                    <option value="partially_cancelled">Partially Cancelled</option>
                    <option value="pending">All Pending Orders</option>
                    <option value="paid">All Paid Orders</option>
                  </select>
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by order ID, customer name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {orders.length === 0 ? 'No orders available.' : 'Try adjusting your filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.order_id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Order #{order.order_id.slice(-8)}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Order Date</p>
                              <p className="font-medium">
                                {new Date(order.order_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total Amount</p>
                              <p className="font-medium">₹{order.total_amount?.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Payment Method</p>
                              <p className="font-medium capitalize">{order.payment_method}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Customer</p>
                            <p className="font-medium">
                              {order.user_id ? `User ID: ${order.user_id}` : `${order.guest_email || 'N/A'} (${order.guest_phone || 'N/A'})`}
                            </p>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Shipping Address</p>
                            <div className="text-sm">
                              <p>{order.shipping_address?.name || 'N/A'}</p>
                              <p>{order.shipping_address?.address || 'N/A'}</p>
                              <p>{order.shipping_address?.city || 'N/A'}, {(order.shipping_address as any)?.district ? `${(order.shipping_address as any).district}, ` : ''}{order.shipping_address?.state || 'N/A'} - {order.shipping_address?.pincode || 'N/A'}</p>
                              <p>Phone: {order.shipping_address?.phone || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Items ({order.order_items?.length || 0})</p>
                            <div className="space-y-2">
                              {order.order_items?.slice(0, 3).map((item) => (
                                <div key={item.order_item_id} className="flex items-center gap-3 text-sm">
                                  <img
                                    src={item.thumbnail_url || '/placeholder-image.jpg'}
                                    alt={item.product_name}
                                    className="w-8 h-8 object-cover rounded"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder-image.jpg';
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{item.product_name}</p>
                                    <p className="text-gray-500">
                                      Size: {item.size} | Qty: {item.quantity} |
                                      Status:
                                      <span className={`ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${item.item_status === 'delivered' ? 'bg-green-100 text-green-800' : item.item_status === 'shipped' ? 'bg-blue-100 text-blue-800' : item.item_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {(item.item_status || 'pending').toUpperCase()}
                                      </span>
                                    </p>
                                  </div>
                                  <p className="font-medium">₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}</p>
                                </div>
                              ))}
                              {(order.order_items?.length || 0) > 3 && (
                                <p className="text-sm text-gray-500">
                                  +{(order.order_items?.length || 0) - 3} more items
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="flex items-center justify-center gap-2 text-primary hover:text-primary-active text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-primary/20 hover:border-primary/40 bg-white dark:bg-gray-800 hover:bg-primary/5 transition-colors"
                          >
                            <Eye className="w-4 h-4 sm:w-4 sm:h-4" />
                            <span className="inline sm:inline">View</span>
                          </button>

                          {(() => {
                            const actionState = orderActionStates.find(state => state.orderId === order.order_id);
                            return actionState?.actionStates.canShip;
                          })() && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowShipmentModal(true);
                              }}
                              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-blue-200 hover:border-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <TruckIcon className="w-4 h-4 sm:w-4 sm:h-4" />
                              <span className="inline sm:inline">Ship</span>
                            </button>
                          )}

                          {(() => {
                            const actionState = orderActionStates.find(state => state.orderId === order.order_id);
                            return actionState?.actionStates.canDeliver;
                          })() && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDeliverModal(true);
                              }}
                              className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-green-200 hover:border-green-300 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4" />
                              <span className="inline sm:inline">Deliver</span>
                            </button>
                          )}

                          {(() => {
                            const actionState = orderActionStates.find(state => state.orderId === order.order_id);
                            return actionState?.actionStates.canRefund;
                          })() && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowRefundModal(true);
                              }}
                              className="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-orange-200 hover:border-orange-300 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                            >
                              <DollarSign className="w-4 h-4 sm:w-4 sm:h-4" />
                              <span className="inline sm:inline">Refund</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <ReturnsManagementTab
              returns={returns}
              onUpdateStatus={updateReturnStatus}
              processingAction={processingAction}
            />
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setShowOrderModal(false)}
            onUpdateStatus={updateOrderStatus}
            onShipOrder={(order) => {
              setSelectedOrder(order);
              setShowShipmentModal(true);
            }}
            processingAction={processingAction}
            alertModal={alertModal}
            setAlertModal={setAlertModal}
          />
        )}

        {/* Shipment Modal with Item Selection */}
        {showShipmentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ship Order Items</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Order #{selectedOrder.order_id.slice(-8)}
              </p>

              {/* Item Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Items to Ship
                  </label>
                  <button
                    onClick={() => {
                      const shippableItems = selectedOrder.order_items
                        .filter(item => item.item_status === 'pending')
                        .map(item => item.order_item_id);
                      setSelectedItemsForShip(shippableItems);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Select All Shippable
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {selectedOrder.order_items.map((item) => {
                    const isDisabled = item.item_status !== 'pending';
                    return (
                      <label
                        key={item.order_item_id}
                        className={`flex items-center gap-3 p-2 rounded ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemsForShip.includes(item.order_item_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsForShip(prev => [...prev, item.order_item_id]);
                            } else {
                              setSelectedItemsForShip(prev => prev.filter(id => id !== item.order_item_id));
                            }
                          }}
                          disabled={isDisabled}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <img
                          src={item.thumbnail_url}
                          alt={item.product_name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Size: {item.size} • Qty: {item.quantity} • Status: {item.item_status || 'pending'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedItemsForShip.length} item(s) selected
                </p>
              </div>

              {/* Shipping Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Shipping Partner *
                  </label>
                  <select
                    value={shipmentForm.shipping_partner}
                    onChange={(e) => {
                      const value = e.target.value;
                      setShipmentForm(prev => ({ ...prev, shipping_partner: value }));
                      setShowCustomPartnerInput(value === 'other');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Partner</option>
                    <option value="stcourier">ST Courier</option>
                    <option value="professional">Professional</option>
                    <option value="dtdc">DTDC</option>
                    <option value="india_post">India Post</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Custom shipping partner input field */}
                {showCustomPartnerInput && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Custom Shipping Partner Name *
                    </label>
                    <input
                      type="text"
                      value={shipmentForm.shipping_partner === 'other' ? '' : shipmentForm.shipping_partner}
                      onChange={(e) => setShipmentForm(prev => ({ ...prev, shipping_partner: e.target.value }))}
                      placeholder="Enter shipping partner name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tracking ID *
                  </label>
                  <input
                    type="text"
                    value={shipmentForm.tracking_id}
                    onChange={(e) => setShipmentForm(prev => ({ ...prev, tracking_id: e.target.value }))}
                    placeholder="Enter tracking ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tracking URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={shipmentForm.tracking_url}
                    onChange={(e) => setShipmentForm(prev => ({ ...prev, tracking_url: e.target.value }))}
                    placeholder="https://tracking.partner.com/track/..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowShipmentModal(false);
                    setSelectedItemsForShip([]);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  disabled={processingAction?.includes('shipment')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateShipment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={processingAction?.includes('shipment') || selectedItemsForShip.length === 0 || 
    (showCustomPartnerInput 
      ? (!shipmentForm.shipping_partner || shipmentForm.shipping_partner === 'other' || shipmentForm.shipping_partner.trim() === '')
      : !shipmentForm.shipping_partner) 
    || !shipmentForm.tracking_id}
                >
                  {processingAction?.includes('shipment') ? 'Shipping...' : `Ship ${selectedItemsForShip.length} Item(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deliver Modal with Item Selection */}
        {showDeliverModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Mark Items as Delivered</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Order #{selectedOrder.order_id.slice(-8)}
              </p>

              {/* Item Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Items to Mark as Delivered
                  </label>
                  <button
                    onClick={() => {
                      const deliverableItems = selectedOrder.order_items
                        .filter(item => item.item_status === 'shipped')
                        .map(item => item.order_item_id);
                      setSelectedItemsForDeliver(deliverableItems);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Select All Deliverable
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {selectedOrder.order_items.map((item) => {
                    const isDisabled = item.item_status !== 'shipped';
                    return (
                      <label
                        key={item.order_item_id}
                        className={`flex items-center gap-3 p-2 rounded ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemsForDeliver.includes(item.order_item_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsForDeliver(prev => [...prev, item.order_item_id]);
                            } else {
                              setSelectedItemsForDeliver(prev => prev.filter(id => id !== item.order_item_id));
                            }
                          }}
                          disabled={isDisabled}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <img
                          src={item.thumbnail_url}
                          alt={item.product_name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Size: {item.size} • Qty: {item.quantity} • Status: {item.item_status || 'pending'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedItemsForDeliver.length} item(s) selected
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeliverModal(false);
                    setSelectedItemsForDeliver([]);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  disabled={processingAction?.includes('deliver')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDeliver}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={processingAction?.includes('deliver') || selectedItemsForDeliver.length === 0}
                >
                  {processingAction?.includes('deliver') ? 'Processing...' : `Mark ${selectedItemsForDeliver.length} Item(s) as Delivered`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
      />
    </>
  );
};

// Returns Management Tab Component
const ReturnsManagementTab: React.FC<{
  returns: Return[];
  onUpdateStatus: (returnId: string, action: string) => void;
  processingAction: string | null;
}> = ({ returns, onUpdateStatus, processingAction }) => {
  return (
    <div className="space-y-4">
      {returns.map((returnRequest) => (
        <div key={returnRequest.return_id} className="bg-white dark:bg-dark2 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">Return #{returnRequest.return_id.slice(-8)}</p>
              <p className="text-sm text-gray-600">
                Requested: {new Date(returnRequest.requested_at).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                returnRequest.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                returnRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                returnRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm"><strong>Reason:</strong> {returnRequest.reason}</p>
            <p className="text-sm"><strong>Order:</strong> #{returnRequest.order_id.slice(-8)}</p>
          </div>

          {returnRequest.order_items && returnRequest.order_items.length > 0 && (
            <div className="mb-4">
              <p className="font-medium mb-2">Items:</p>
              <div className="flex gap-2">
                {returnRequest.order_items.map((item, index) => (
                  <div key={index} className="text-center">
                    <img
                      src={item.thumbnail_url}
                      alt={item.product_name}
                      className="w-12 h-12 rounded object-cover mx-auto mb-1"
                    />
                    <p className="text-xs">{item.product_name}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {returnRequest.status === 'requested' && (
              <>
                <button
                  onClick={() => onUpdateStatus(returnRequest.return_id, 'approve')}
                  disabled={processingAction === `return-${returnRequest.return_id}-approve`}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => onUpdateStatus(returnRequest.return_id, 'reject')}
                  disabled={processingAction === `return-${returnRequest.return_id}-reject`}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {returnRequest.status === 'approved' && (
              <button
                onClick={() => onUpdateStatus(returnRequest.return_id, 'complete')}
                disabled={processingAction === `return-${returnRequest.return_id}-complete`}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Mark Complete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal: React.FC<{
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, action: string, data?: any) => void;
  onShipOrder: (order: Order) => void;
  processingAction: string | null;
  alertModal: {
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  };
  setAlertModal: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>>;
}> = ({ order, onClose, onUpdateStatus, onShipOrder, processingAction, alertModal, setAlertModal }) => {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-dark2 rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6 p-6">
            <h3 className="text-lg sm:text-xl font-semibold">Order Details</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Order Info */}
              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Information</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <p><strong>Order ID:</strong> {order.order_id}</p>
                  <p><strong>Date:</strong> {new Date(order.order_date).toLocaleDateString('en-IN')}</p>
                  <p><strong>Type:</strong> {order.order_type}</p>
                  <p><strong>Payment Method:</strong> {order.payment_method}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Payment Status:</strong> {order.payment_status}</p>
                  <p><strong>Order Status:</strong> {order.order_status || 'N/A'}</p>
                  <p><strong>Comments:</strong> {order.order_status === 'delivery_too_slow' ? 'delivery late' : (order.comments || 'N/A')}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Customer Information</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  {order.user_id ? (
                    <p><strong>Customer:</strong> Registered User</p>
                  ) : (
                    <>
                      <p><strong>Email:</strong> {order.guest_email}</p>
                      <p><strong>Phone:</strong> {order.guest_phone}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Shipping Address</h4>
              <div className="bg-gray-50 dark:bg-dark3 p-4 rounded-lg">
                <div className="text-xs sm:text-sm">
                  <p className="font-medium">{order.shipping_address?.name || 'N/A'}</p>
                  <p>{order.shipping_address?.address || 'N/A'}</p>
                  <p>{order.shipping_address?.city || 'N/A'}, {(order.shipping_address as any)?.district ? `${(order.shipping_address as any).district}, ` : ''}{order.shipping_address?.state || 'N/A'} - {order.shipping_address?.pincode || 'N/A'}</p>
                  <p>Phone: {order.shipping_address?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Items</h4>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <img
                      src={item.thumbnail_url}
                      alt={item.product_name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{item.product_name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Size: {item.size} • Qty: {item.quantity} • ₹{item.price_at_purchase}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-sm sm:text-base">₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-gray-50 dark:bg-dark3 rounded-lg mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Summary</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings:</span>
                    <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {order.cod_fee > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>COD Fee:</span>
                    <span>₹{order.cod_fee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>₹{order.delivery_charge.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 text-sm sm:text-base"
              >
                Close
              </button>

              {(() => {
                // Calculate action states directly for this order
                const orderItems = order.order_items || [];
                const canShip = orderItems.some(item => item.item_status === 'pending');
                const canDeliver = orderItems.some(item => item.item_status === 'shipped');
                const canRefund = (order.payment_method === 'razorpay' && order.payment_status === 'paid' &&
                                 orderItems.some(item => ['cancelled', 'delivered', 'shipped'].includes(item.item_status || ''))) ||
                                (order.payment_method === 'cod' && orderItems.some(item => item.item_status === 'delivered'));

                return canShip;
              })() && (
                <button
                  onClick={() => onShipOrder(order)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Ship Order
                </button>
              )}

              {(() => {
                // Calculate action states directly for this order
                const orderItems = order.order_items || [];
                const canShip = orderItems.some(item => item.item_status === 'pending');
                const canDeliver = orderItems.some(item => item.item_status === 'shipped');
                const canRefund = (order.payment_method === 'razorpay' && order.payment_status === 'paid' &&
                                 orderItems.some(item => ['cancelled', 'delivered', 'shipped'].includes(item.item_status || ''))) ||
                                (order.payment_method === 'cod' && orderItems.some(item => item.item_status === 'delivered'));

                return canDeliver;
              })() && (
                <button
                  onClick={() => onUpdateStatus(order.order_id, 'deliver')}
                  disabled={processingAction === `${order.order_id}-deliver`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
                >
                  {processingAction === `${order.order_id}-deliver` ? 'Processing...' : 'Mark as Delivered'}
                </button>
              )}

              {(() => {
                // Calculate action states directly for this order
                const orderItems = order.order_items || [];
                const canShip = orderItems.some(item => item.item_status === 'pending');
                const canDeliver = orderItems.some(item => item.item_status === 'shipped');
                const canRefund = (order.payment_method === 'razorpay' && order.payment_status === 'paid' &&
                                 orderItems.some(item => ['cancelled', 'delivered', 'shipped'].includes(item.item_status || ''))) ||
                                (order.payment_method === 'cod' && orderItems.some(item => item.item_status === 'delivered'));

                return canRefund;
              })() && (
                <button
                  onClick={() => {/* TODO: Get payment ID for refund */}}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm sm:text-base"
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
      />
    </>
  );
};

export default AdminOrderDashboard;