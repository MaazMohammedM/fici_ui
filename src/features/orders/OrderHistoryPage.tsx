import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, Filter, ArrowRight } from 'lucide-react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import type { Order, OrderFilters } from '../../types/order';

const OrderHistoryPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<OrderFilters['status']>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { user, isGuest, guestSession } = useAuthStore();
  const {
    orders,
    pagination,
    fetchOrders,
    fetchGuestOrders,
    loading: storeLoading,
    error: storeError,
  } = useOrderStore();

  // --- Fetch orders ---
  useEffect(() => {
    fetchOrdersData();
  }, [user, isGuest, guestSession, statusFilter]);

  // --- Fetch orders based on user or guest ---
  const fetchOrdersData = async (page = 1) => {
    if (user) {
      // For authenticated users
      const filters: OrderFilters & { page?: number; limit?: number } = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 10,
        page: page
      };
      await fetchOrders(user.id, filters);
    } else if (isGuest && guestSession?.guest_session_id && guestSession.email && guestSession.phone) {
      // For guest users - fetchGuestOrders doesn't support status filtering, we'll filter client-side
      await fetchGuestOrders(guestSession.email, guestSession.phone);
    } else {
      // Clear orders if no valid user session
    }
  };

  // --- Status icon mapping ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'Delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'shipped':
      case 'Shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'paid':
      case 'Payment Confirmed':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'Cash On Delivery Order':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Partially Delivered':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'Partially Cancelled':
        return <XCircle className="w-5 h-5 text-orange-600" />;
      case 'Partially Refunded':
        return <Package className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  // --- Status color mapping ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'Delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'shipped':
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'paid':
      case 'Payment Confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Cash On Delivery Order':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Partially Delivered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Partially Cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Partially Refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  // --- User-facing status mapping ---
  const getUserFriendlyStatus = (order: Order) => {
    if (order.payment_method === 'cod' && order.status === 'pending') {
      return 'Cash On Delivery Order';
    }

    // Check item statuses for more accurate status
    const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
    if (items.length > 0) {
      const statuses = items.map((item: any) => item.item_status || 'pending');
      const allCancelled = statuses.every(s => s === 'cancelled');
      const allDelivered = statuses.every(s => s === 'delivered');

      if (allCancelled) return 'Cancelled';
      if (allDelivered) return 'Delivered';
    }

    switch (order.status) {
      case 'pending':
        return 'Awaiting Payment';
      case 'paid':
        return 'Payment Confirmed';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'partially_delivered':
        return 'Partially Delivered';
      case 'partially_cancelled':
        return 'Partially Cancelled';
      case 'partially_refunded':
        return 'Partially Refunded';
      default:
        return order.status;
    }
  };

  // --- Add descriptive message for clarity ---
  const getUserStatusMessage = (order: Order) => {
    // Check item-level statuses for aggregate message
    const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
    if (items.length > 0) {
      const itemStatuses = items.map((item: any) => item.item_status || 'pending');
      const allCancelled = itemStatuses.every((s: string) => s === 'cancelled');
      const allDelivered = itemStatuses.every((s: string) => s === 'delivered');
      const someCancelled = itemStatuses.some((s: string) => s === 'cancelled' || s === 'refunded');
      const someDelivered = itemStatuses.some((s: string) => s === 'delivered');
      const someProcessing = itemStatuses.some((s: string) => s === 'shipped' || s === 'pending');
      
      if (allCancelled) return 'This order has been cancelled.';
      if (allDelivered) return 'All items have been delivered successfully.';
      if (someCancelled && someProcessing) return 'Some items cancelled. Others are being processed.';
      if (someCancelled && someDelivered) return 'Partially fulfilled order.';
    }

    if (order.payment_method === 'cod' && order.status === 'pending') {
      return 'Your COD order has been placed successfully and will be shipped soon.';
    }
    if (order.status === 'pending' && order.payment_method !== 'cod') {
      return 'Your order is awaiting payment confirmation.';
    }
    if (order.status === 'paid') {
      return 'Payment received. Your order will be shipped soon.';
    }
    if (order.status === 'shipped') {
      return 'Your order is on the way.';
    }
    if (order.status === 'delivered') {
      return 'Your order has been delivered successfully.';
    }
    if (order.status === 'cancelled') {
      return 'This order was cancelled.';
    }
    return '';
  };

  const filterOptions: Array<{ value: OrderFilters['status']; label: string }> = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // --- Loading state ---
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg">
          {storeError}
        </div>
      </div>
    );
  }

  // --- Empty state ---
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Order History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and track your orders
              </p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
              No orders yet
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your order history will appear here once you place an order.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main UI ---
  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and track your orders
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === option.value
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid Layout - One card per row */}
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="group bg-white dark:bg-dark2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 block border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
            >
              {/* Card Header with Status Badge */}
              <div className="flex justify-between items-center p-3 sm:p-4 pb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Order #{order.id.slice(-8)}
                </div>
                <span
                  className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getUserFriendlyStatus(order)}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-3 sm:p-4 pt-2">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={
                        Array.isArray(order.items) && order.items.length > 0
                          ? order.items[0]?.thumbnail_url || '/placeholder-product.jpg'
                          : order.items && typeof order.items === 'object'
                          ? (Object.values(order.items)[0] as any)?.thumbnail_url || '/placeholder-product.jpg'
                          : '/placeholder-product.jpg'
                      }
                      alt={
                        Array.isArray(order.items) && order.items.length > 0
                          ? (order.items[0]?.product_name || order.items[0]?.name || 'Product')
                          : order.items && typeof order.items === 'object'
                          ? ((Object.values(order.items)[0] as any)?.product_name ||
                             (Object.values(order.items)[0] as any)?.name ||
                             'Product')
                          : 'Product'
                      }
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow duration-200"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="mb-2">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-tight truncate max-w-full"
                         title={(() => {
                           // Handle array format
                           if (Array.isArray(order.items) && order.items.length > 0) {
                             const productNames = order.items.map(item =>
                               item?.product_name || item?.name || 'Product'
                             );
                             return productNames.join(', ');
                           }

                           // Handle object format
                           if (order.items && typeof order.items === 'object') {
                             const itemsArray = Object.values(order.items);
                             if (itemsArray.length > 0) {
                               const productNames = itemsArray.map((item: any) =>
                                 item?.product_name || item?.name || 'Product'
                               );
                               return productNames.join(', ');
                             }
                           }

                           return 'Product';
                         })()}
                      >
                        {(() => {
                          // Handle array format
                          if (Array.isArray(order.items) && order.items.length > 0) {
                            const productNames = order.items.map(item =>
                              item?.product_name || item?.name || 'Product'
                            );
                            return productNames.join(', ');
                          }

                          // Handle object format
                          if (order.items && typeof order.items === 'object') {
                            const itemsArray = Object.values(order.items);
                            if (itemsArray.length > 0) {
                              const productNames = itemsArray.map((item: any) =>
                                item?.product_name || item?.name || 'Product'
                              );
                              return productNames.join(', ');
                            }
                          }

                          return 'Product';
                        })()}
                      </p>
                    </div>

                    {/* Order Summary */}
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {Array.isArray(order.items)
                            ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}`
                            : `${Object.keys(order.items || {}).length} item${Object.keys(order.items || {}).length > 1 ? 's' : ''}`}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(order.created_at || order.order_date || '').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                {getUserStatusMessage(order) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate"
                       title={getUserStatusMessage(order)}
                    >
                      {getUserStatusMessage(order)}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => {
                if (pagination.page > 1) {
                  fetchOrdersData(pagination.page - 1);
                }
              }}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => fetchOrdersData(pageNumber)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pagination.page === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (pagination.page < pagination.totalPages) {
                  fetchOrdersData(pagination.page + 1);
                }
              }}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Page Info */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Showing {orders.length} of {pagination.total} orders (Page {pagination.page} of {pagination.totalPages})
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;