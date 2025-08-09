import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '@store/orderStore';
import { useAuthStore } from '@store/authStore';
// import OrderCard from './components/OrderCard';
// import OrderFilters from './components/OrderFilters';
import ReviewModal from './components/ReviewModal';
import type { Order, OrderItem } from '../../types/order';

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loading, error, fetchOrders, clearError } = useOrderStore();
  const { user } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewItem, setReviewItem] = useState<{ order: Order; item: OrderItem } | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    
    // Fetch orders for the current user
    fetchOrders(user.id, filters);
  }, [user, fetchOrders, filters, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleReviewClick = (order: Order, item: OrderItem) => {
    setReviewItem({ order, item });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'shipped':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
      case 'delivered':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[color:var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header - Modern minimal design */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
              Your Orders
            </h1>
            <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-60 mt-1">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Simplified Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center bg-white dark:bg-[color:var(--color-dark2)] rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-transparent text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] border-none outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="flex items-center bg-white dark:bg-[color:var(--color-dark2)] rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <span className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-60 mr-2">
              Past 3 Month
            </span>
            <svg className="w-4 h-4 text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
              No orders found
            </h3>
            <p className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70 mb-6">
              {filters.status !== 'all' || filters.search ? 'Try adjusting your filters' : 'Start shopping to see your orders here'}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-[color:var(--color-accent)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[color:var(--color-accent)]/80 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white dark:bg-[color:var(--color-dark2)] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                        Order placed
                      </div>
                      <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                        Total
                      </div>
                      <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                        Ship to
                      </div>
                    </div>
                    <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                      Order # {order.order_id}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                        {new Date(order.order_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                        {order.shipping_address.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOrderClick(order)}
                        className="text-sm text-[color:var(--color-accent)] hover:underline"
                      >
                        View order details
                      </button>
                      <button className="text-sm text-[color:var(--color-accent)] hover:underline">
                        View invoice
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Banner */}
                {order.status === 'delivered' && order.items.some(item => !order.reviews_submitted.includes(item.product_id)) && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                          Please rate your experience with the seller
                        </span>
                      </div>
                      <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Status */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                      {order.status === 'delivered' ? `Delivered ${new Date(order.estimated_delivery).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric' 
                      })}` : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] text-sm mb-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70 mb-2">
                            Return or replace items: Eligible through {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                          <div className="flex items-center gap-3">
                            <button className="bg-[color:var(--color-accent)] text-white text-xs px-4 py-2 rounded hover:bg-[color:var(--color-accent)]/80 transition-colors flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Buy it again
                            </button>
                            <button className="text-[color:var(--color-accent)] text-xs hover:underline">
                              View your item
                            </button>
                            {order.tracking_number && (
                              <button className="text-[color:var(--color-accent)] text-xs hover:underline">
                                Track package
                              </button>
                            )}
                            {order.status === 'delivered' && !order.reviews_submitted.includes(item.product_id) && (
                              <button
                                onClick={() => handleReviewClick(order, item)}
                                className="text-[color:var(--color-accent)] text-xs hover:underline"
                              >
                                Write a product review
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Info */}
                  {order.tracking_number && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                        Your package was delivered. It was handed directly to a resident.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-[color:var(--color-dark2)] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  Order Details - {selectedOrder.order_id}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Status & Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3">
                      Order Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Order Date:</span>
                        <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                          {new Date(selectedOrder.order_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Payment Method:</span>
                        <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                          {selectedOrder.payment_method}
                        </span>
                      </div>
                      {selectedOrder.tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Tracking:</span>
                          <span className="text-[color:var(--color-accent)] font-medium">
                            {selectedOrder.tracking_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3">
                      Delivery Address
                    </h3>
                    <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70 space-y-1">
                      <p className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                        {selectedOrder.shipping_address.name}
                      </p>
                      <p>{selectedOrder.shipping_address.address}</p>
                      <p>
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}
                      </p>
                      <p>{selectedOrder.shipping_address.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-4">
                    Items Ordered ({selectedOrder.items.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-[color:var(--color-dark1)] rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                            {item.name}
                          </h4>
                          <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                            Color: {item.color} | Size: {item.size} | Qty: {item.quantity}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                              ₹{item.price}
                            </span>
                            {item.mrp > item.price && (
                              <span className="text-sm text-gray-500 line-through">₹{item.mrp}</span>
                            )}
                          </div>
                        </div>
                        {selectedOrder.status === 'delivered' && !selectedOrder.reviews_submitted.includes(item.product_id) && (
                          <button
                            onClick={() => handleReviewClick(selectedOrder, item)}
                            className="bg-[color:var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[color:var(--color-accent)]/80 transition-colors"
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Subtotal:</span>
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                        ₹{selectedOrder.total_amount - selectedOrder.tax_amount - selectedOrder.shipping_amount + selectedOrder.discount_amount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Discount:</span>
                      <span className="text-green-600">-₹{selectedOrder.discount_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Tax:</span>
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">₹{selectedOrder.tax_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Shipping:</span>
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                        {selectedOrder.shipping_amount === 0 ? 'Free' : `₹${selectedOrder.shipping_amount}`}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">Total:</span>
                      <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">₹{selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewItem && (
          <ReviewModal
            order={reviewItem.order}
            item={reviewItem.item}
            onClose={() => setReviewItem(null)}
          />
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
