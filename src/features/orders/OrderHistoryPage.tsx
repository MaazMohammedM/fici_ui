import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '@store/orderStore';
import { useAuthStore } from '@store/authStore';
import { Package, Truck, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import ReviewModal from './components/ReviewModal';
import type { Order, OrderItem, OrderFilters } from '../../types/order';

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders: storeOrders, loading, error, fetchOrders, clearError } = useOrderStore();
  const { user } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchOrders(user.id, filters);
    }
  }, [user, filters, fetchOrders]);

  useEffect(() => {
    if (location.state?.success) {
      // Show success message
      alert(location.state.message || 'Order placed successfully!');
      // Clear the state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    // Set the first item as default selected item
    if (order.items.length > 0) {
      setSelectedItem(order.items[0]);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setSelectedItem(null);
  };

  const openReviewModal = (item: OrderItem) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && storeOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = storeOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || order.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-secondary">
            Order History
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {storeOrders.length} {storeOrders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              onClick={clearError}
              className="ml-2 text-red-800 hover:text-red-900 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
              <Package className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.search || filters.status !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You haven\'t placed any orders yet'
              }
            </p>
            {!filters.search && filters.status === 'all' && (
              <button
                onClick={() => navigate('/products')}
                className="mt-4 bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/80 transition-colors"
              >
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-dark2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(order.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Order # {order.id}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="text-lg font-semibold text-primary dark:text-secondary">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOrderClick(order)}
                        className="text-accent hover:text-accent/80 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-primary dark:text-secondary">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.color} • Size {item.size} • Qty {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary dark:text-secondary">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
                        +{order.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark2 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-dark2 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary dark:text-secondary">
                Order Details - {selectedOrder.id}
              </h2>
              <button
                onClick={closeOrderDetails}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-primary dark:text-secondary mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                      <span className="text-primary dark:text-secondary">
                        {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.payment_status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-primary dark:text-secondary mb-3">Shipping Address</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-primary dark:text-secondary">{selectedOrder.shipping_address.name}</p>
                    <p>{selectedOrder.shipping_address.address}</p>
                    <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.pincode}</p>
                    <p>Phone: {selectedOrder.shipping_address.phone}</p>
                    <p>Email: {selectedOrder.shipping_address.email}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-primary dark:text-secondary mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-primary dark:text-secondary">{item.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.color} • Size {item.size} • Qty {item.quantity}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 line-through">₹{item.mrp}</span>
                          <span className="font-medium text-primary dark:text-secondary">₹{item.price}</span>
                          {item.discount_percentage > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {item.discount_percentage}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary dark:text-secondary">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                      {/* Add Review Button */}
                      <button
                        onClick={() => openReviewModal(item)}
                        className="px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent/80 transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-primary dark:text-secondary mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="text-green-600">-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
                    <span className={selectedOrder.delivery_charge === 0 ? 'text-green-600' : ''}>
                      {selectedOrder.delivery_charge === 0 ? 'Free' : `₹${selectedOrder.delivery_charge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedOrder && selectedItem && (
        <ReviewModal
          order={selectedOrder}
          item={selectedItem}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;
