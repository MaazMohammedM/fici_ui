import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { CheckCircle, XCircle, Clock, Eye, Ban, Truck as TruckIcon, DollarSign, Package, Filter, RefreshCw, Search } from 'lucide-react';

interface Order {
  order_id: string;
  order_date: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
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
  order_items: Array<{
    order_item_id: string;
    product_name: string;
    product_id: string;
    size: string;
    quantity: number;
    price_at_purchase: number;
    thumbnail_url: string;
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
    case 'delivered': return 'text-green-700 bg-green-50 border-green-200';
    case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
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
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    shipping_partner: '',
    tracking_id: '',
    tracking_url: '',
  });

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

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
      console.log('Fetched orders:', data);
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
      alert(`Failed to fetch returns: ${err instanceof Error ? err.message : String(err)}`);
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
        alert('Order shipped successfully');
      }
      // Handle 'deliver' action with direct Supabase REST API
      else if (action === 'deliver') {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (error) throw error;

        await fetchOrders();
        setShowOrderModal(false);
        alert('Order delivered successfully');
      }
      // Handle other actions (cancel, etc.) with edge function for now
      else {
        const { error } = await supabase.functions.invoke('admin-order-management', {
          body: {
            order_id: orderId,
            action,
            ...data
          }
        });

        if (error) throw error;

        await fetchOrders();
        setShowOrderModal(false);
        alert(`Order ${action} successful`);
      }
    } catch (err: any) {
      alert(`Failed to ${action} order: ${err.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleUpdateShipment = async () => {
    if (!selectedOrder) return;

    try {
      setProcessingAction(`shipment-${selectedOrder.order_id}`);

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          shipping_partner: shipmentForm.shipping_partner,
          tracking_id: shipmentForm.tracking_id,
          tracking_url: shipmentForm.tracking_url,
          shipped_at: new Date().toISOString(),
        })
        .eq('order_id', selectedOrder.order_id);

      if (error) throw error;

      await fetchOrders();
      setShowShipmentModal(false);
      setSelectedOrder(null);
      setShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' });
      alert('Order shipped successfully');
    } catch (error) {
      console.error('Error updating shipment:', error);
      alert('Failed to ship order');
    } finally {
      setProcessingAction(null);
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
      case 'shipped':
        // Shipped orders
        return order.status === 'shipped';
      case 'pending':
        // All pending orders (both COD and Razorpay)
        return order.status === 'pending';
      case 'paid':
        // All paid orders (both COD and Razorpay)
        return order.status === 'paid';
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

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      if (activeTab === 'returns') {
        fetchReturns();
      }
    }
  }, [isAdmin, activeTab]);

  // Debug logging
  console.log('AdminOrderDashboard Debug:', {
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: user.user_metadata
    } : null,
    role,
    isAdmin,
    authType: useAuthStore((state) => state.authType),
    isAuthenticated: useAuthStore((state) => state.isAuthenticated)
  });

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
                                  <p className="text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
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

                        {((order.payment_method === 'cod' && order.status === 'pending') ||
                          (order.payment_method === 'razorpay' && order.status === 'paid')) && (
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

                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'deliver')}
                            disabled={processingAction === `${order.order_id}-deliver`}
                            className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-green-200 hover:border-green-300 disabled:border-gray-200 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4" />
                            <span className="inline sm:inline">Deliver</span>
                          </button>
                        )}

                        {order.payment_method === 'razorpay' && order.payment_status === 'paid' && (
                          <button
                            onClick={() => {/* TODO: Get payment ID and call processRefund */}}
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
        />
      )}

      {/* Shipment Modal */}
      {showShipmentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Shipment Details</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Order #{selectedOrder.order_id.slice(-8)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shipping Partner
                </label>
                <select
                  value={shipmentForm.shipping_partner}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, shipping_partner: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Partner</option>
                  <option value="delhivery">Delhivery</option>
                  <option value="bluedart">BlueDart</option>
                  <option value="dtdc">DTDC</option>
                  <option value="india_post">India Post</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking ID
                </label>
                <input
                  type="text"
                  value={shipmentForm.tracking_id}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, tracking_id: e.target.value }))}
                  placeholder="Enter tracking ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowShipmentModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={processingAction?.includes('shipment')}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateShipment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={processingAction?.includes('shipment') || !shipmentForm.shipping_partner || !shipmentForm.tracking_id}
              >
                {processingAction?.includes('shipment') ? 'Shipping...' : 'Ship Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
}> = ({ order, onClose, onUpdateStatus, onShipOrder, processingAction }) => {
  return (
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

            {((order.payment_method === 'cod' && order.status === 'pending' && order.payment_status === 'pending') ||
              (order.payment_method === 'razorpay' && order.status === 'paid')) && (
              <button
                onClick={() => onShipOrder(order)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Ship Order
              </button>
            )}

            {order.status === 'shipped' && (
              <button
                onClick={() => onUpdateStatus(order.order_id, 'deliver')}
                disabled={processingAction === `${order.order_id}-deliver`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {processingAction === `${order.order_id}-deliver` ? 'Processing...' : 'Mark as Delivered'}
              </button>
            )}

            {order.payment_method === 'razorpay' && order.payment_status === 'paid' && (
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
  );
};

export default AdminOrderDashboard;