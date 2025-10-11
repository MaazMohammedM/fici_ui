import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, RefreshCw, ArrowRight, Filter } from 'lucide-react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import type { Order, OrderFilters } from '../../types/order';

interface OrderItem {
  order_item_id: string;
  product_name: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  mrp: number;
  thumbnail_url: string;
  color?: string;
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderFilters['status']>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { user, isGuest, guestSession } = useAuthStore();
  const { fetchOrders, fetchGuestOrders, loading: storeLoading, error: storeError, orders: storeOrders } = useOrderStore();

  useEffect(() => {
    fetchOrdersData();
  }, [user, isGuest, guestSession, statusFilter]);

  useEffect(() => {
    if (storeOrders && storeOrders.length >= 0) {
      // Apply client-side filtering for guest orders since fetchGuestOrders doesn't support status filtering
      if (isGuest && statusFilter !== 'all') {
        const filteredOrders = storeOrders.filter(order => order.status === statusFilter);
        setOrders(filteredOrders);
      } else {
        setOrders(storeOrders);
      }
    }
  }, [storeOrders, statusFilter, isGuest]);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);

      if (user) {
        // For authenticated users
        const filters: OrderFilters & { page?: number; limit?: number } = {
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 50,
          page: 1
        };
        await fetchOrders(user.id, filters);
      } else if (isGuest && guestSession?.guest_session_id && guestSession.email && guestSession.phone) {
        // For guest users - fetchGuestOrders doesn't support status filtering, we'll filter client-side
        await fetchGuestOrders(guestSession.email, guestSession.phone);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'paid':
        return <Package className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const filterOptions: Array<{ value: OrderFilters['status']; label: string }> = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading || storeLoading) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error || storeError) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
            <p className="text-red-700 dark:text-red-400">{error || storeError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and track your orders</p>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {/* Filters */}
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

          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">No orders yet</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Your order history will appear here once you place an order.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View and track your orders</p>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filters */}
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

        {/* Responsive Grid - 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 block"
            >
              {/* Order Items Preview */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  {/* Left side - Image and additional items */}
                  <div className="flex flex-col items-center">
                    <img
                      src={(order.items && Array.isArray(order.items) && order.items[0]?.thumbnail_url) || '/placeholder-product.jpg'}
                      alt={(order.items && Array.isArray(order.items) && order.items[0]?.name) || 'Product'}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                    {(order.items && Array.isArray(order.items) && order.items.length > 1) && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                        + {order.items.length - 1} more item{(order.items.length > 2) ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Right side - Product name, amount, and status */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate mb-1">
                      {(order.items && Array.isArray(order.items) && order.items[0]?.name) || 'Product'}
                    </p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        Amount: ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
