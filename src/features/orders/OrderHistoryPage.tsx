import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { useOrderStore } from '@store/orderStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
// Using browser's built-in toast or fallback to console
const toast = {
  success: (message: string) => console.log(`Success: ${message}`),
  error: (message: string) => console.error(`Error: ${message}`)
};
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  Star, 
  Eye, 
  ShoppingBag,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  Edit3,
  X,
  UserCheck,
  Filter
} from 'lucide-react';
import ReviewModal from './components/ReviewModal';
import type { Order, OrderItem } from '../../types/order';

const ORDERS_PER_PAGE = 5;

const OrderHistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    orders, 
    loading, 
    error, 
    fetchOrders, 
    fetchGuestOrders, 
    userReviews, 
    fetchUserReviews 
  } = useOrderStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'user' | 'guest'>('all');
  const [isVerifyingGuest, setIsVerifyingGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [storedVerificationCode, setStoredVerificationCode] = useState('');

  useEffect(() => {
    // Check for guest verification in URL
    const guestEmailParam = searchParams.get('guest_email');
    const guestPhoneParam = searchParams.get('guest_phone');
    const verificationCode = searchParams.get('code');

    if (user?.id) {
      // Fetch orders for logged-in user
      fetchOrders(user.id);
      fetchUserReviews(user.id);
    } else if (guestEmailParam || guestPhoneParam) {
      // Handle guest order verification from email/link
      if (verificationCode) {
        verifyGuestCode(guestEmailParam || '', guestPhoneParam || '', verificationCode);
      } else {
        setGuestEmail(guestEmailParam || '');
        setGuestPhone(guestPhoneParam || '');
        setIsVerifyingGuest(true);
      }
    }
  }, [user?.id, searchParams, fetchOrders, fetchUserReviews]);

  const handleSendVerification = async () => {
    if (!guestEmail && !guestPhone) {
      toast.error('Please provide either email or phone number');
      return;
    }

    // In a real app, this would be an API call to send OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setStoredVerificationCode(code);
    console.log("Otp is",code);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Verification code sent to ${guestEmail || guestPhone}`);
    setVerificationSent(true);
  };

  const verifyGuestCode = async (email: string, phone: string, code: string) => {
    if (code !== storedVerificationCode) {
      toast.error('Invalid verification code');
      return;
    }

    try {
      await fetchGuestOrders(email, phone);
      setOrderFilter('guest');
      setIsVerifyingGuest(false);
      toast.success('Verification successful! Loading your orders...');
    } catch (error: any) {
      toast.error('Failed to fetch orders. Please try again.');
    }
  };

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'user') return !!order.user_id;
    if (orderFilter === 'guest') return !!order.guest_session_id || !!order.guest_contact_info;
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'paid':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'paid':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'shipped':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delivered':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getUserReviewForProduct = (productId: string) => {
    return userReviews?.find(review => review.product_id === productId);
  };

  const handleReviewClick = (order: Order, item: OrderItem) => {
    const existingReview = getUserReviewForProduct(item.product_id);
    setSelectedOrder(order);
    setSelectedItem(item);
    setEditingReview(existingReview || null);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedItem(null);
    setEditingReview(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedOrders(new Set()); // Collapse all orders when changing page
  };

  const renderOrderItems = (items: any) => {
    const itemsArray = Array.isArray(items) ? items : Object.values(items || {});
    return itemsArray;
  };

  const isGuestOrder = (order: Order) => {
    return !!order.guest_session_id || !!order.guest_contact_info;
  };

  const getOrderTypeStats = () => {
    const userOrders = orders.filter(order => !!order.user_id);
    const guestOrders = orders.filter(order => isGuestOrder(order));
    return { userOrders: userOrders.length, guestOrders: guestOrders.length };
  };

  if (!user && !isVerifyingGuest) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-8 border border-light2/20 dark:border-gray-700">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-4 font-primary">
              View Your Orders
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 font-primary">
              Sign in to view your order history or check your guest orders
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/auth/signin')}
                className="w-full bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold font-primary transform hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsVerifyingGuest(true)}
                className="w-full border border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg transition-all duration-200 font-semibold font-primary"
              >
                View Guest Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isVerifyingGuest) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-8 border border-light2/20 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-2 font-primary text-center">
              View Guest Orders
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center font-primary">
              Enter your email or phone number to verify your identity
            </p>
            
            {!verificationSent ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-primary">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark1 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                  <span className="flex-shrink mx-4 text-gray-500 text-sm font-primary">OR</span>
                  <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-primary">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark1 dark:text-white"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <button
                  onClick={handleSendVerification}
                  disabled={!guestEmail && !guestPhone}
                  className="w-full bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold font-primary transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Verification Code
                </button>
                <button
                  onClick={() => {
                    setIsVerifyingGuest(false);
                    setGuestEmail('');
                    setGuestPhone('');
                  }}
                  className="w-full text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-secondary mt-2 text-sm font-medium font-primary"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-primary">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark1 dark:text-white text-center text-xl tracking-widest"
                    placeholder="XXXXXX"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center font-primary">
                    We've sent a 6-digit code to {guestEmail || guestPhone}
                  </p>
                </div>
                <button
                  onClick={() => verifyGuestCode(guestEmail, guestPhone, verificationCode)}
                  disabled={verificationCode.length !== 6}
                  className="w-full bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold font-primary transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify & View Orders
                </button>
                <div className="text-center">
                  <button
                    onClick={() => setVerificationSent(false)}
                    className="text-sm text-primary hover:text-primary-active font-medium font-primary"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading && !isVerifyingGuest) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-primary">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && !isVerifyingGuest) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-8 border border-light2/20 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-primary dark:text-secondary mb-2 font-primary">
              Error Loading Orders
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4 font-primary">{error}</p>
            <button 
              onClick={() => fetchOrders(user.id)} 
              className="bg-primary hover:bg-primary-active text-white px-6 py-2 rounded-lg transition-all duration-200 font-primary transform hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-secondary mb-2 font-secondary">
                My Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-primary">
                Track your orders and manage your purchases
              </p>
            </div>
            
            {/* Order Filter */}
            {orders.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={orderFilter}
                  onChange={(e) => {
                    setOrderFilter(e.target.value as 'all' | 'user' | 'guest');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm font-primary focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Orders</option>
                  <option value="user">Account Orders</option>
                  <option value="guest">Guest Orders</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {orders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-primary dark:text-secondary font-primary">{orders.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-primary">Total Orders</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-primary dark:text-secondary font-primary">{getOrderTypeStats().userOrders}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-primary">Account Orders</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-primary dark:text-secondary font-primary">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-primary">Delivered</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-primary dark:text-secondary font-primary">
                    {orders.filter(o => o.status === 'shipped').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-primary">In Transit</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold text-primary dark:text-secondary font-primary">
                    ₹{orders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-primary">Total Spent</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-dark2 rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-light2/20 dark:border-gray-700">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary dark:text-secondary mb-2 font-primary">
                No orders yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 font-primary">
                Start shopping to see your order history here
              </p>
              <button
                onClick={() => navigate('/products')}
                className="bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold font-primary transform hover:scale-105"
              >
                Start Shopping
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="space-y-4">
              {currentOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);
                const orderItems = renderOrderItems(order.items);
                
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-dark2 rounded-2xl shadow-lg border border-light2/20 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-xl"
                  >
                    {/* Order Header - Always Visible */}
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(order.status)}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-primary dark:text-secondary text-lg font-primary">
                                  Order #{order.id}
                                </h3>
                                {isGuestOrder(order) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-full text-xs font-medium">
                                    <UserCheck className="w-3 h-3" />
                                    Guest Order
                                  </span>
                                )}
                                {order.merged_at && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
                                    Merged
                                  </span>
                                )}
                              </div>
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400 font-primary">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.created_at || order.order_date || Date.now()).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {orderItems.length} item(s)
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary dark:text-secondary font-primary">
                              ₹{(order.total_amount || 0).toLocaleString('en-IN')}
                            </div>
                            {order.discount && order.discount > 0 && (
                              <div className="text-sm text-green-600 dark:text-green-400 font-primary">
                                Saved ₹{order.discount.toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="p-2 text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label={isExpanded ? 'Collapse order details' : 'Expand order details'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Order Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark1">
                        <div className="p-4 sm:p-6 space-y-6">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold text-primary dark:text-secondary mb-4 font-primary">
                              Order Items
                            </h4>
                            <div className="space-y-3">
                              {orderItems.length > 0 ? (
                                orderItems.map((item: any, index) => {
                                  const existingReview = getUserReviewForProduct(item.product_id);
                                  
                                  return (
                                    <div
                                      key={index}
                                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white dark:bg-dark2 rounded-xl border border-light2/20 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                                    >
                                      <img
                                        src={item.thumbnail_url || '/placeholder-image.jpg'}
                                        alt={item.name || `Item ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder-image.jpg';
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-primary dark:text-secondary truncate font-primary">
                                          {item.name || `Product ID: ${item.product_id}`}
                                        </h5>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1 font-primary">
                                          <span>Size: {item.size || 'N/A'}</span>
                                          <span>Qty: {item.quantity}</span>
                                          <span>Color: {item.color || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-lg font-semibold text-primary dark:text-secondary font-primary">
                                            ₹{item.price_at_purchase?.toLocaleString('en-IN') || '0'}
                                          </span>
                                          {item.mrp && item.mrp > (item.price_at_purchase || 0) && (
                                            <span className="text-sm text-gray-500 line-through font-primary">
                                              ₹{item.mrp.toLocaleString('en-IN')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {order.status === 'delivered' && (
                                          <>
                                            {!existingReview ? (
                                              <button
                                                onClick={() => handleReviewClick(order, item)}
                                                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-all duration-200 text-sm font-primary transform hover:scale-105"
                                              >
                                                <Star className="w-4 h-4" />
                                                Write Review
                                              </button>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg text-sm font-primary">
                                                  <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                      <Star
                                                        key={star}
                                                        className={`w-3 h-3 ${
                                                          star <= existingReview.rating
                                                            ? 'text-accent fill-accent'
                                                            : 'text-gray-300'
                                                        }`}
                                                      />
                                                    ))}
                                                  </div>
                                                  <span className="ml-1">Reviewed</span>
                                                </div>
                                                <button
                                                  onClick={() => handleReviewClick(order, item)}
                                                  className="flex items-center gap-1 px-3 py-2 bg-primary hover:bg-primary-active text-white rounded-lg transition-all duration-200 text-sm font-primary"
                                                >
                                                  <Edit3 className="w-3 h-3" />
                                                  Edit
                                                </button>
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-primary">
                                  No items found for this order
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div>
                            <h4 className="font-semibold text-primary dark:text-secondary mb-3 font-primary">
                              Payment Information
                            </h4>
                            <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700">
                              <div className="flex items-center justify-between text-sm font-primary">
                                <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                                <span className="text-primary dark:text-secondary capitalize">
                                  {order.payment_method || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm font-primary mt-2">
                                <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.payment_status === 'paid' 
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                    : order.payment_status === 'failed'
                                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                                }`}>
                                  {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Pending'}
                                </span>
                              </div>
                              {isGuestOrder(order) && (
                                <div className="flex items-center justify-between text-sm font-primary mt-2">
                                  <span className="text-gray-600 dark:text-gray-400">Order Type:</span>
                                  <span className="text-amber-600 dark:text-amber-400">Guest Order</span>
                                </div>
                              )}
                              {order.merged_at && (
                                <div className="flex items-center justify-between text-sm font-primary mt-2">
                                  <span className="text-gray-600 dark:text-gray-400">Merged Date:</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {new Date(order.merged_at).toLocaleDateString('en-IN')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contact & Shipping Information */}
                          <div className="space-y-4">
                            {/* Guest Contact Info */}
                            {isGuestOrder(order) && order.guest_contact_info && (
                              <div>
                                <h4 className="font-semibold text-primary dark:text-secondary mb-3 font-primary">
                                  Guest Contact Information
                                </h4>
                                <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700">
                                  <div className="space-y-2 text-sm font-primary">
                                    {order.guest_contact_info.name && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                        <span className="text-gray-900 dark:text-white">{order.guest_contact_info.name}</span>
                                      </div>
                                    )}
                                    {order.guest_contact_info.email && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                        <span className="text-gray-900 dark:text-white">{order.guest_contact_info.email}</span>
                                      </div>
                                    )}
                                    {order.guest_contact_info.phone && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                                        <span className="text-gray-900 dark:text-white">{order.guest_contact_info.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Shipping Address */}
                            {order.shipping_address && (
                              <div>
                                <h4 className="font-semibold text-primary dark:text-secondary mb-3 font-primary">
                                  Shipping Address
                                </h4>
                                <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700">
                                  <p className="text-gray-800 dark:text-gray-200 font-primary">
                                    {typeof order.shipping_address === 'object' ? (
                                      <>
                                        {order.shipping_address.name && <><strong>{order.shipping_address.name}</strong><br /></>}
                                        {order.shipping_address.street && <>{order.shipping_address.street}<br /></>}
                                        {order.shipping_address.city && <>{order.shipping_address.city}, </>}
                                        {order.shipping_address.state && <>{order.shipping_address.state} </>}
                                        {order.shipping_address.pincode && <>{order.shipping_address.pincode}</>}
                                        {order.shipping_address.phone && <><br />Phone: {order.shipping_address.phone}</>}
                                      </>
                                    ) : (
                                      order.shipping_address
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Order Summary */}
                          <div className="bg-white dark:bg-dark2 rounded-xl p-4 border border-light2/20 dark:border-gray-700">
                            <h4 className="font-semibold text-primary dark:text-secondary mb-3 font-primary">
                              Order Summary
                            </h4>
                            <div className="space-y-2 text-sm font-primary">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                <span className="text-gray-900 dark:text-white">₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
                              </div>
                              {order.discount && order.discount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                                  <span className="text-green-600 dark:text-green-400">-₹{order.discount.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
                                <span className="text-gray-900 dark:text-white">
                                  {order.delivery_charge === 0 ? 'FREE' : `₹${order.delivery_charge?.toLocaleString('en-IN') || '0'}`}
                                </span>
                              </div>
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                <div className="flex justify-between font-semibold">
                                  <span className="text-primary dark:text-secondary">Total:</span>
                                  <span className="text-primary dark:text-secondary">₹{(order.total_amount || 0).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-primary">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} {orderFilter === 'all' ? '' : orderFilter} orders
                  {orderFilter !== 'all' && ` (${orders.length} total)`}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors font-primary ${
                            currentPage === page
                              ? 'bg-primary text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedOrder && selectedItem && (
        <ReviewModal
          order={selectedOrder}
          item={selectedItem}
          existingReview={editingReview}
          onClose={closeReviewModal}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;