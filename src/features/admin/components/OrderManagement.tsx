import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Order {
  order_id: string;
  order_date: string;
  status: string;
  total_amount: number;
  payment_status: string;
  user_id: string;
  guest_email?: string;
  guest_phone?: string;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
  };
  order_items: Array<{
    order_item_id: string;
    product_name: string;
    size: string;
    quantity: number;
    price_at_purchase: number;
    thumbnail_url: string;
  }>;
}

interface OrderManagementProps {
  className?: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ className = '' }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for shipment details
  const [shipmentForm, setShipmentForm] = useState({
    shipping_partner: '',
    tracking_id: '',
    tracking_url: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('order_date', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term (order ID, customer email, phone)
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.guest_email && order.guest_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.guest_phone && order.guest_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.shipping_address?.name && order.shipping_address.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateShipment = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);

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

      if (error) {
        console.error('Error updating order:', error);
        return;
      }

      // Refresh orders
      await fetchOrders();
      setShowUpdateModal(false);
      setSelectedOrder(null);
      setShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' });
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delivered':
        return 'bg-green-600 text-white';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTotalOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      paid: orders.filter(o => o.status === 'paid').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const stats = getTotalOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Order Management
        </h2>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

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
            <Truck className="w-5 h-5 text-blue-500" />
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by order ID, customer name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #{order.order_id.split('-')[0]}
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
                      <p className="font-medium">₹{order.total_amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <p className="font-medium capitalize">{order.payment_status}</p>
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
                      <p>{order.shipping_address?.city || 'N/A'}, {order.shipping_address?.state || 'N/A'} - {order.shipping_address?.pincode || 'N/A'}</p>
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
                          <p className="font-medium">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</p>
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

                <div className="flex flex-col gap-2 ml-4">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowUpdateModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ship Order
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // View order details logic here
                      console.log('View order details for:', order.order_id);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Shipment Modal */}
      {showUpdateModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Shipment Details</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Order #{selectedOrder.order_id.split('-')[0]}
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
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateShipment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={updating || !shipmentForm.shipping_partner || !shipmentForm.tracking_id}
              >
                {updating ? 'Updating...' : 'Ship Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
