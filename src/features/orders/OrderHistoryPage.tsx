import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, Filter, ArrowRight, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { OtpFlow } from '@/components/otp';
import { Input, Button } from '../../auth/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

// Helper to hash OTP using SHA-256 (matches backend)
async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
import type { Order, OrderFilters } from '../../types/order';

// Guest order access schema
const GuestOrderAccessSchema = z.object({
  identifier: z.string().min(1, 'Please enter your email or mobile number'),
  otp: z.string().min(6, 'Please enter the 6-digit OTP').max(6, 'OTP must be 6 digits'),
}).refine((data) => {
  // Validate email or mobile format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return emailRegex.test(data.identifier) || phoneRegex.test(data.identifier);
}, {
  message: 'Please enter a valid email address or mobile number',
  path: ['identifier'],
});

type GuestOrderAccessFormData = z.infer<typeof GuestOrderAccessSchema>;

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OrderFilters['status']>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [guestOrderAccessMode, setGuestOrderAccessMode] = useState<'form' | 'verifying'>('form');
  const [guestOrderError, setGuestOrderError] = useState<string | null>(null);
  const [isVerifyingGuestOrder, setIsVerifyingGuestOrder] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const { user, isGuest, guestSession } = useAuthStore();
  const {
    orders,
    pagination,
    fetchOrders,
    fetchGuestOrders,
    loading: storeLoading,
    error: storeError,
  } = useOrderStore();

  // Guest order access form
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset
  } = useForm<GuestOrderAccessFormData>({
    resolver: zodResolver(GuestOrderAccessSchema),
    defaultValues: {
      identifier: '',
      otp: ''
    }
  });

  // Handle guest order access form submission
  const handleGuestOrderAccess = async (data: GuestOrderAccessFormData) => {
    setIsVerifyingGuestOrder(true);
    setGuestOrderError(null);

    try {
      const { identifier, otp } = data;
      const hashedOtp = await hashOtp(otp);

      const { data: order, error } = await supabase
        .from('orders')
        .select('order_id')
        .eq('order_type', 'guest')
        .eq('guest_pin_hash', hashedOtp)
        .or(`guest_email.eq.${identifier},guest_phone.eq.${identifier}`)
        .maybeSingle();

      if (error) throw error;

      if (!order) {
        setGuestOrderError('Invalid OTP or details. Please check and try again.');
        return;
      }

      navigate(`/orders/${order.order_id}`);
    } catch (err) {
      setGuestOrderError('Invalid OTP or details. Please check and try again.');
    } finally {
      setIsVerifyingGuestOrder(false);
    }
  };

  // Handle back to form
  const handleBackToGuestForm = () => {
    setGuestOrderAccessMode('form');
    setGuestOrderError(null);
    reset();
  };

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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'paid':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'replacement_requested':
        return <Package className="w-5 h-5 text-orange-600" />;
      case 'replacement_initiated':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'replacement_shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'replacement_delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'replacement_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'returned_to_warehouse':
        return <Package className="w-5 h-5 text-gray-600" />;
      case 'refunded':
        return <Package className="w-5 h-5 text-teal-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  // --- Status color mapping ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'replacement_requested':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'replacement_initiated':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'replacement_shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'replacement_delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'replacement_rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'returned_to_warehouse':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'refunded':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  // --- User-facing status mapping ---
  const getUserFriendlyStatus = (order: Order) => {
    // Check item statuses for more accurate status
    const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
    if (items.length > 0) {
      const statuses = items.map((item: any) => item.item_status || 'pending');
      
      // Priority order: cancelled > refunded > replacement_rejected > replacement_delivered > replacement_shipped > replacement_initiated > replacement_requested > returned_to_warehouse > shipped > delivered > pending
      const hasCancelled = statuses.some(s => s === 'cancelled');
      const hasRefunded = statuses.some(s => s === 'refunded');
      const hasReplacementRejected = statuses.some(s => s === 'replacement_rejected');
      const hasReplacementDelivered = statuses.some(s => s === 'replacement_delivered');
      const hasReplacementShipped = statuses.some(s => s === 'replacement_shipped');
      const hasReplacementInitiated = statuses.some(s => s === 'replacement_initiated');
      const hasReplacementRequested = statuses.some(s => s === 'replacement_requested');
      const hasReturnedToWarehouse = statuses.some(s => s === 'returned_to_warehouse');
      const hasShipped = statuses.some(s => s === 'shipped');
      const hasDelivered = statuses.some(s => s === 'delivered');
      
      const allCancelled = statuses.every(s => s === 'cancelled');
      const allDelivered = statuses.every(s => s === 'delivered');
      
      // Check for mixed states
      const uniqueStatuses = [...new Set(statuses)];
      const hasMixedStates = uniqueStatuses.length > 1;
      
      if (allCancelled) return 'Cancelled';
      if (allDelivered) return 'Delivered';
      
      // Priority-based status display
      if (hasCancelled) return hasMixedStates ? 'Partially Cancelled' : 'Cancelled';
      if (hasRefunded) return 'Refunded';
      if (hasReplacementRejected) return 'Replacement Rejected';
      if (hasReplacementDelivered) return 'Replacement Delivered';
      if (hasReplacementShipped) return 'Replacement Shipped';
      if (hasReplacementInitiated) return 'Replacement Approved – Will be Shipped Soon';
      if (hasReplacementRequested) return 'Replacement Requested';
      if (hasReturnedToWarehouse) return 'Returned to Warehouse';
      if (hasShipped) return hasMixedStates ? 'Partially Shipped' : 'Shipped';
      if (hasDelivered) return hasMixedStates ? 'Partially Delivered' : 'Delivered';
    }

    if (order.payment_method === 'cod' && order.status === 'pending') {
      return 'Cash On Delivery Order';
    }

    switch (order.status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Payment Confirmed';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
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
      const someReplacementRejected = itemStatuses.some((s: string) => s === 'replacement_rejected');
      const someReplacementRequested = itemStatuses.some((s: string) => s === 'replacement_requested');
      const someReplacementInitiated = itemStatuses.some((s: string) => s === 'replacement_initiated');
      const someReplacementShipped = itemStatuses.some((s: string) => s === 'replacement_shipped');
      
      if (allCancelled) return 'This order has been cancelled.';
      if (allDelivered) return 'All items have been delivered successfully.';
      if (someReplacementRejected) return 'Some replacement requests were rejected. Check individual items for details.';
      if (someReplacementRequested) return 'Replacement requests are being processed.';
      if (someReplacementInitiated) return 'Some replacements have been approved and will ship soon.';
      if (someReplacementShipped) return 'Some replacements have been shipped.';
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
    { value: 'partially_delivered', label: 'Partially Delivered' },
    { value: 'partially_cancelled', label: 'Partially Cancelled' },
    { value: 'partially_refunded', label: 'Partially Refunded' },
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

  // --- Guest order access flow ---
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              View Your Guest Order
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the email or mobile number used during checkout and the OTP sent to you.
            </p>
          </div>

          <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
            <form onSubmit={handleSubmit(handleGuestOrderAccess)} className="space-y-4">
              <Input
                type="text"
                label="Email or Mobile Number"
                placeholder="Enter your email or mobile number"
                leftIcon={Mail}
                error={errors.identifier?.message}
                {...register('identifier')}
              />

              <div className="relative">
                <Input
                  type={showOtp ? 'text' : 'password'}
                  label="OTP"
                  placeholder="Enter 6-digit OTP"
                  leftIcon={Phone}
                  error={errors.otp?.message}
                  {...register('otp')}
                />
                <button
                  type="button"
                  onClick={() => setShowOtp(!showOtp)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showOtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {guestOrderError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{guestOrderError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isVerifyingGuestOrder}
              >
                {isVerifyingGuestOrder ? 'Verifying...' : 'View Order'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Empty state for logged-in users with no orders ---
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFilters(prev => !prev);
              }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setStatusFilter(option.value);
                      setShowFilters(false);
                    }}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowFilters(prev => !prev);
            }}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setStatusFilter(option.value);
                    setShowFilters(false);
                  }}
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
          {orders
            .filter(order => {
              // Filter out pending Razorpay orders
              if (order.payment_method === 'razorpay' && order.payment_status !== 'paid') {
                return false;
              }
              return true;
            })
            .map((order) => (
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
                        ₹{order.effective_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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