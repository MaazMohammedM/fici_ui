// src/pages/admin/AdminOrderDashboard.tsx (or wherever this lives)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, XCircle, Clock, CheckCircle, Truck, Ban, RefreshCw, Filter, Search, Eye, X, Upload, MapPin, Phone, Mail, User, Calendar, DollarSign, TrendingUp, ShoppingBag, Users, AlertCircle, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { useAdminStore } from '../../../features/admin/store/adminStore';
import { useAuthStore } from '../../../store/authStore';
import { useOrderStore } from '../../../store/orderStore';
import { supabase } from '../../../lib/supabase';
import { useOrderLevelActionStates } from '../../../hooks/useOrderActionStates';
import ReturnsManagementTab from './ReturnsManagementTab';
import { getThumbnailUrl } from '../../../lib/utils/imageOptimization';
import { printInvoice, generateInvoiceNumber, type InvoiceData, type InvoiceItem } from '../../../utils/invoiceUtils';

import { canRefundOrder } from '../../../types/order-common';
// These components are defined inline in this file
import { AdminOrderRow } from '../../../components/admin/orders/AdminOrderRow';
import { RefundActionPanel } from '../../../components/admin/orders/RefundActionPanel';
import { ReplacementApprovalButton } from '../../../components/admin/orders/ReplacementApprovalButton';
import { AdminOrderStatusBadge } from '../../../components/admin/orders/AdminOrderStatusBadge';
import AlertModal from '../../../components/ui/AlertModal';
import type { Order, OrderItem, OrderActionFlags, ShippingAddress, PaymentMethod, PaymentStatus, CancelOrderItemsParams } from '../../../types/order-common';

/* =========================================================
   Helper Functions
   ========================================================= */

const isShippingAddress = (address: ShippingAddress | string): address is ShippingAddress => {
  return typeof address === 'object' && address !== null;
};

/* =========================================================
   Type definitions
   ========================================================= */

interface Return {
  order_item_id: string;
  order_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: string;
  thumbnail_url: string;
  product_name: string;
  product_thumbnail_url: string | null;
  price_currency: string;
  color: string;
  mrp: string;
  item_status: string;
  cancel_reason: string | null;
  return_reason: string | null;
  refund_amount: string | null;
  refunded_at: string | null;
  return_requested_at: string;
  return_approved_at: string | null;
  shipped_at: string;
  delivered_at: string;
  shipping_partner: string;
  tracking_id: string;
  tracking_url: string | null;
  requested_size: string | null;
  orders: {
    order_id: string;
    order_date: string;
    user_id: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    shipping_address: ShippingAddress;
    payment_method: string;
    payment_status: string;
    total_amount: number;
    status: string;
  };
}


type OrderActionStateEntry = {
  orderId: string;
  actionStates: OrderActionFlags;
  orderItems: OrderItem[];
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'paid':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'shipped':
    case 'partially_shipped':
      return <Truck className="w-4 h-4 text-blue-500" />;
    case 'delivered':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'paid':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'shipped':
    case 'partially_shipped':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'delivered':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'cancelled':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'partially_delivered':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'partially_cancelled':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'partially_refunded':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

/* =========================================================
   Small components
   ========================================================= */

const AccessDenied: React.FC<{
  user: { email?: string | null; role?: string | null } | null;
  role: string | null;
  authType: string | null;
  refreshUserProfile: () => void;
}> = ({ user, role, authType, refreshUserProfile }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <Ban className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
      <p className="text-gray-600 mb-4">You don't have admin privileges to access this page.</p>
      <div className="bg-gray-50 p-4 rounded-lg text-left text-sm">
        <p className="font-medium mb-2">Debug Information:</p>
        <p>User: {user ? user.email : 'Not logged in'}</p>
        <p>Role: {role || user?.role || 'No role set'}</p>
        <p>Auth Type: {authType || 'None'}</p>
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

const AdminHeader: React.FC<{
  activeTab: 'orders' | 'returns';
  onRefresh: () => void;
}> = ({ activeTab, onRefresh }) => (
  <>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage orders, returns, and refunds</p>
      </div>
      <button
        onClick={onRefresh}
        className="mt-4 sm:mt-0 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
    </div>

    <div className="mb-4 sm:mb-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap sm:flex-nowrap space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'orders' }))} // used by parent
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'returns' }))} // used by parent
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'returns'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Replacement Requests
          </button>
        </nav>
      </div>
    </div>
  </>
);

const OrderStatsSummary: React.FC<{
  stats: { total: number; pending: number; paid: number; shipped: number; delivered: number; cancelled: number };
}> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
    <StatCard label="Total" value={stats.total} icon={<Package className="w-5 h-5 text-blue-500" />} />
    <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
    <StatCard label="Paid" value={stats.paid} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
    <StatCard label="Shipped" value={stats.shipped} icon={<Truck className="w-5 h-5 text-blue-500" />} />
    <StatCard label="Delivered" value={stats.delivered} icon={<CheckCircle className="w-5 h-5 text-green-600" />} />
    <StatCard label="Cancelled" value={stats.cancelled} icon={<XCircle className="w-5 h-5 text-red-500" />} />
  </div>
);

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="bg-white dark:bg-dark2 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

const OrderFilters: React.FC<{
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}> = ({ statusFilter, setStatusFilter, searchTerm, setSearchTerm }) => (
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
        <option value="paid-orders">Razorpay Orders (Paid)</option>
        <option value="cancelled">Cancelled Orders</option>
        <option value="delivered">Delivered Orders</option>
        <option value="shipped">Shipped Orders</option>
        <option value="partially_shipped">Partially Shipped</option>
        <option value="partially_delivered">Partially Delivered</option>
        <option value="partially_cancelled">Partially Cancelled</option>
        <option value="pending">COD Pending Only</option>
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
);

const OrdersPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  loading: boolean;
  setPage: (page: number) => void;
}> = ({ currentPage, totalPages, loading, setPage }) => {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        onClick={() => setPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || loading}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <div className="flex gap-1">
        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setPage(page)}
              disabled={loading}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || loading}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>

      <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

const OrderCard: React.FC<{
  order: Order;
  actionStates?: OrderActionFlags;
  onView: (order: Order) => void;
  onShip: (order: Order) => void;
  onCancel: (order: Order) => void;
  onDeliver: (order: Order) => void;
  onRefundItem: (item: OrderItem) => void;
  onRefundOrder: (order: Order) => void;
  onDeliverReplacement?: (item: OrderItem) => void;
  onApproveReplacement?: (item: OrderItem) => void;
  onRejectReplacement?: (item: OrderItem) => void;
  onShipReplacement?: (item: OrderItem) => void;
  onMarkReturned?: (item: OrderItem) => void;
  onPrintInvoice?: (order: Order) => void;
}> = ({ order, actionStates, onView, onShip, onCancel, onDeliver, onRefundItem, onRefundOrder, onDeliverReplacement, onApproveReplacement, onRejectReplacement, onShipReplacement, onMarkReturned, onPrintInvoice }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order #{order.order_id.slice(-8)}
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">{order.status}</span>
          </span>
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Order Date & Time</p>
            <p className="font-medium">
              {new Date(order.order_date).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="font-medium">
              ₹{order.effective_amount?.toLocaleString('en-IN') || order.total_amount?.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="font-medium capitalize">{order.payment_method}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Customer</p>
          <p className="font-medium">
            {order.user_id
              ? `User ID: ${order.user_id}`
              : `${order.guest_email || 'N/A'} (${order.guest_phone || 'N/A'})`}
          </p>
        </div>

        {/* Address */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Shipping Address</p>
          <div className="text-sm">
            {isShippingAddress(order.shipping_address) ? (
              <>
                <p>{order.shipping_address.name || 'N/A'}</p>
                <p>{order.shipping_address.address || 'N/A'}</p>
                <p>
                  {order.shipping_address.city || 'N/A'},{' '}
                  {order.shipping_address.district
                    ? `${order.shipping_address.district}, `
                    : ''}
                  {order.shipping_address.state || 'N/A'} -{' '}
                  {order.shipping_address.pincode || 'N/A'}
                </p>
                <p>{order.shipping_address.phone || 'N/A'}</p>
              </>
            ) : (
              <p>{order.shipping_address || 'N/A'}</p>
            )}
          </div>
        </div>

        {/* Items summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Items ({order.order_items?.length || 0})
          </p>
          <div className="space-y-2">
            {order.order_items?.slice(0, 3).map((item) => (
              <div key={item.order_item_id} className="flex items-center gap-3 text-sm">
                <img
                  src={getThumbnailUrl(item.thumbnail_url || '/placeholder-image.jpg')}
                  alt={item.product_name}
                  className="w-8 h-8 object-cover rounded"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.jpg';
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-gray-500">
                    Size: {item.size} | Qty: {item.quantity} | Status:
                    <span
                      className={`ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.item_status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : item.item_status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : item.item_status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : item.item_status === 'replacement_requested'
                          ? 'bg-orange-100 text-orange-800'
                          : item.item_status === 'replacement_initiated'
                          ? 'bg-purple-100 text-purple-800'
                          : item.item_status === 'replacement_shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : item.item_status === 'replacement_delivered'
                          ? 'bg-green-100 text-green-800'
                          : item.item_status === 'replacement_rejected'
                          ? 'bg-red-100 text-red-800'
                          : item.item_status === 'returned_to_warehouse'
                          ? 'bg-gray-100 text-gray-800'
                          : item.item_status === 'refunded'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {(() => {
                        switch (item.item_status) {
                          case 'pending': return 'Pending';
                          case 'shipped': return 'Shipped';
                          case 'delivered': return 'Delivered';
                          case 'cancelled': return 'Cancelled';
                          case 'refunded': return 'Refunded';
                          case 'replacement_requested': return 'Replacement Requested';
                          case 'replacement_initiated': return 'Replacement Approved – Will Ship Soon';
                          case 'replacement_shipped': return 'Replacement Shipped';
                          case 'replacement_delivered': return 'Replacement Delivered';
                          case 'replacement_rejected': return 'Replacement Rejected';
                          case 'returned_to_warehouse': return 'Returned to Warehouse';
                        }
                      })()}
                    </span>
                  </p>
                  {/* Item-level actions */}
                  <div className="flex gap-1 mt-1">
                    {order.payment_method === 'razorpay' && ['delivered', 'cancelled'].includes(item.item_status || '') && !['refunded'].includes(item.item_status || '') && (
                      <button
                        onClick={() => onRefundItem(item)}
                        className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
                      >
                        Refund
                      </button>
                    )}
                    {item.item_status === 'replacement_requested' && (
                      <div className="space-y-2">
                        {/* Show user's replacement reason */}
                        {item.replacement_reason && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                            <span className="font-medium">Reason:</span> {item.replacement_reason}
                          </div>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => onApproveReplacement?.(item)}
                            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Approve Replacement
                          </button>
                          <button
                            onClick={() => onRejectReplacement?.(item)}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject Replacement
                          </button>
                        </div>
                      </div>
                    )}
                    {item.item_status === 'cancelled' && (
                      <div className="space-y-2">
                        {/* Show user's cancel reason */}
                        {item.cancel_reason && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <span className="font-medium">Cancel Reason:</span> {item.cancel_reason}
                          </div>
                        )}
                      </div>
                    )}
                    {item.item_status === 'replacement_initiated' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Approved – Pending Shipment</span>
                          {item.replacement_reason && (
                            <>
                              <br />
                              <span className="font-medium">Original Request Reason:</span> {item.replacement_reason}
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onShipReplacement?.(item)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Ship Replacement
                          </button>
                        </div>
                      </div>
                    )}
                    {item.item_status === 'replacement_shipped' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Courier:</span> {item.shipping_partner || 'N/A'}
                          <br />
                          <span className="font-medium">Tracking:</span> {item.tracking_id || 'N/A'}
                        </div>
                        <div className="flex gap-1">
                          {onDeliverReplacement && (
                          <button
                            onClick={() => onDeliverReplacement(item)}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        </div>
                      </div>
                    )}
                    {item.item_status === 'replacement_delivered' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Replacement Delivered</span>
                        </div>
                      </div>
                    )}
                    {item.item_status === 'replacement_rejected' && (
                      <div className="space-y-2">
                        <div className="text-xs text-red-600 dark:text-red-300">
                          <span className="font-medium">Replacement Rejected</span>
                          {item.replacement_reason && (
                            <>
                              <br />
                              <span className="font-medium">Reason:</span> {item.replacement_reason}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-medium">
                  ₹{(item.price_at_purchase * item.quantity).toLocaleString('en-IN')}
                </p>
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
        <button
          onClick={() => onView(order)}
          className="flex items-center justify-center gap-2 text-primary hover:text-primary-active text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-primary/20 hover:border-primary/40 bg-white dark:bg-gray-800 hover:bg-primary/5 transition-colors"
        >
          <Eye className="w-4 h-4 sm:w-4 sm:h-4" />
          <span>View</span>
        </button>

        {canRefundOrder(order) && (
          <button
            onClick={() => onRefundOrder(order)}
            className="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-orange-200 hover:border-orange-300 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <DollarSign className="w-4 h-4 sm:w-4 sm:h-4" />
            <span>Refund</span>
          </button>
        )}

        {actionStates?.canShip && (
          <button
            onClick={() => onShip(order)}
            className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-blue-200 hover:border-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Truck className="w-4 h-4 sm:w-4 sm:h-4" />
            <span>Ship</span>
          </button>
        )}

        {actionStates?.canCancel && (
          <button
            onClick={() => onCancel(order)}
            className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-red-200 hover:border-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Ban className="w-4 h-4 sm:w-4 sm:h-4" />
            <span>Cancel</span>
          </button>
        )}

        {actionStates?.canDeliver && (
          <button
            onClick={() => onDeliver(order)}
            className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-green-200 hover:border-green-300 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4" />
            <span>Deliver</span>
          </button>
        )}

        {/* Show Print Invoice for delivered orders */}
        {order.status === 'delivered' && onPrintInvoice && (
          <button
            onClick={() => onPrintInvoice(order)}
            className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-indigo-200 hover:border-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            title="Print Invoice"
          >
            <Upload className="w-4 h-4 sm:w-4 sm:h-4" />
            <span>Print Invoice</span>
          </button>
        )}
      </div>
    </div>
  </div>
);


/* =========================================================
   Shipment & Deliver Modals
   ========================================================= */

const ShipmentModal: React.FC<{
  isOpen: boolean;
  order: Order | null;
  shipmentForm: { shipping_partner: string; tracking_id: string; tracking_url: string };
  setShipmentForm: React.Dispatch<
    React.SetStateAction<{
      shipping_partner: string;
      tracking_id: string;
      tracking_url: string;
    }>
  >;
  showCustomPartnerInput: boolean;
  setShowCustomPartnerInput: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItemsForShip: string[];
  setSelectedItemsForShip: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  processingAction: string | null;
}> = ({
  isOpen,
  order,
  shipmentForm,
  setShipmentForm,
  showCustomPartnerInput,
  setShowCustomPartnerInput,
  selectedItemsForShip,
  setSelectedItemsForShip,
  onClose,
  onSubmit,
  processingAction,
}) => {
  if (!isOpen || !order) return null;

  const isSubmitting = processingAction?.includes('shipment');

  const isShippingPartnerValid = showCustomPartnerInput
    ? shipmentForm.shipping_partner &&
      shipmentForm.shipping_partner !== 'other' &&
      shipmentForm.shipping_partner.trim() !== ''
    : shipmentForm.shipping_partner && shipmentForm.shipping_partner !== '';

  const submitDisabled =
    isSubmitting ||
    selectedItemsForShip.length === 0 ||
    !isShippingPartnerValid ||
    !shipmentForm.tracking_id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Ship Order Items
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Order #{order.order_id.slice(-8)}
        </p>

        {/* Item Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Items to Ship
            </label>
            <button
              onClick={() => {
                const shippableItems = order.order_items
                  .filter((item) => item.item_status === 'pending')
                  .map((item) => item.order_item_id);
                setSelectedItemsForShip(shippableItems);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Select All Shippable
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
            {order.order_items.map((item) => {
              const isDisabled = item.item_status !== 'pending';
              const checked = selectedItemsForShip.includes(item.order_item_id);
              return (
                <label
                  key={item.order_item_id}
                  className={`flex items-center gap-3 p-2 sm:p-3 ${checked ? 'bg-primary/10' : 'hover:bg-gray-50'} rounded-lg cursor-pointer transition-colors`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) {
                        setSelectedItemsForShip((prev) => prev.filter((id) => id !== item.order_item_id));
                      } else {
                        setSelectedItemsForShip((prev) => [...prev, item.order_item_id]);
                      }
                    }}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Size: {item.size} • Qty: {item.quantity} • Status:{' '}
                      {item.item_status || 'pending'}
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
                setShipmentForm((prev) => ({ ...prev, shipping_partner: value }));
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

          {showCustomPartnerInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Shipping Partner Name *
              </label>
              <input
                type="text"
                value={
                  shipmentForm.shipping_partner === 'other'
                    ? ''
                    : shipmentForm.shipping_partner
                }
                onChange={(e) =>
                  setShipmentForm((prev) => ({ ...prev, shipping_partner: e.target.value }))
                }
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
              onChange={(e) =>
                setShipmentForm((prev) => ({ ...prev, tracking_id: e.target.value }))
              }
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
              onChange={(e) =>
                setShipmentForm((prev) => ({ ...prev, tracking_url: e.target.value }))
              }
              placeholder="https://tracking.partner.com/track/..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={submitDisabled}
          >
            {isSubmitting
              ? 'Shipping...'
              : `Ship ${selectedItemsForShip.length} Item(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeliverModal: React.FC<{
  isOpen: boolean;
  order: Order | null;
  selectedItemsForDeliver: string[];
  setSelectedItemsForDeliver: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  processingAction: string | null;
}> = ({
  isOpen,
  order,
  selectedItemsForDeliver,
  setSelectedItemsForDeliver,
  onClose,
  onSubmit,
  processingAction,
}) => {
  if (!isOpen || !order) return null;

  const isSubmitting = processingAction?.includes('deliver');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Mark Items as Delivered
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Order #{order.order_id.slice(-8)}
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Items to Mark as Delivered
            </label>
            <button
              onClick={() => {
                const deliverableItems = order.order_items
                  .filter((item) => item.item_status === 'shipped')
                  .map((item) => item.order_item_id);
                setSelectedItemsForDeliver(deliverableItems);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Select All Deliverable
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            {order.order_items.map((item) => {
              const isDisabled = item.item_status !== 'shipped';
              const checked = selectedItemsForDeliver.includes(item.order_item_id);
              return (
                <label
                  key={item.order_item_id}
                  className={`flex items-center gap-3 p-2 rounded ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemsForDeliver((prev) => [...prev, item.order_item_id]);
                      } else {
                        setSelectedItemsForDeliver((prev) =>
                          prev.filter((id) => id !== item.order_item_id)
                        );
                      }
                    }}
                    disabled={isDisabled}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <img
                    src={getThumbnailUrl(item.thumbnail_url)}
                    alt={item.product_name}
                    className="w-10 h-10 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Size: {item.size} • Qty: {item.quantity} • Status:{' '}
                      {item.item_status || 'pending'}
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
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={isSubmitting || selectedItemsForDeliver.length === 0}
          >
            {isSubmitting
              ? 'Processing...'
              : `Mark ${selectedItemsForDeliver.length} Item(s) as Delivered`}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmActionModal: React.FC<{
  confirmAction: { orderId: string; action: string; message: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ confirmAction, onCancel, onConfirm }) => {
  if (!confirmAction) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Confirm Action
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {confirmAction.message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   OrderDetailsModal 
   ========================================================= */

const OrderDetailsModal: React.FC<{
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, action: string, data?: Record<string, unknown>) => void;
  onShipOrder: (order: Order) => void;
  setConfirmAction: React.Dispatch<
    React.SetStateAction<{ orderId: string; action: string; message: string } | null>
  >;
  confirmAction: { orderId: string; action: string; message: string } | null;
  showCancelModal: boolean;
  setShowCancelModal: React.Dispatch<React.SetStateAction<boolean>>;
  cancelReason: string;
  setCancelReason: React.Dispatch<React.SetStateAction<string>>;
  cancelComments: string;
  setCancelComments: React.Dispatch<React.SetStateAction<string>>;
  selectedItemsForCancel: string[];
  setSelectedItemsForCancel: React.Dispatch<React.SetStateAction<string[]>>;
  processingAction: string | null;
  alertModal: {
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  };
  setAlertModal: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      message: string;
      type?: 'info' | 'warning' | 'error' | 'success';
    }>
  >;
  user: any;
  fetchOrders: () => Promise<void>;
  onOpenRefundModal: (order: Order) => void;
}> = ({
  order,
  onClose,
  onUpdateStatus,
  onShipOrder,
  setConfirmAction,
  confirmAction,
  showCancelModal,
  setShowCancelModal,
  cancelReason,
  setCancelReason,
  cancelComments,
  setCancelComments,
  selectedItemsForCancel,
  setSelectedItemsForCancel,
  processingAction,
  alertModal,
  setAlertModal,
  user,
  fetchOrders,
  onOpenRefundModal,
}) => {
  
  const orderItems = (order.order_items || []).map(item => ({
    ...item,
    order_item_id: item.order_item_id || '',
    item_status: item.item_status || 'pending',
  }));

  // Local calculation for canCancel to ensure it works properly (same logic as OrderDetailsPage)
  const canCancelItem = (item: OrderItem) => {
    const itemStatus = item.item_status || 'pending';
    return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
  };
  
  const { canShip, canDeliver } = useOrderLevelActionStates(
    order.payment_method as PaymentMethod,
    order.payment_status as PaymentStatus,
    orderItems.map(item => ({
      item_status: item.item_status,
      delivered_at: item.delivered_at,
      order_item_id: item.order_item_id,
    }))
  );

  // Use canRefundOrder for refund logic
  const canRefund = canRefundOrder(order);

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
            {/* Order & Customer info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">
                  Order Information
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <p>
                    <strong>Order ID:</strong> {order.order_id}
                  </p>
                  <p>
                    <strong>Date & Time:</strong>{' '}
                    {new Date(order.order_date).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p>
                    <strong>Type:</strong> {order.order_type}
                  </p>
                  <p>
                    <strong>Payment Method:</strong> {order.payment_method}
                  </p>
                  <p>
                    <strong>Status:</strong> {order.status}
                  </p>
                  <p>
                    <strong>Payment Status:</strong> {order.payment_status}
                  </p>
                  <p>
                    <strong>Order Status:</strong> {order.order_status || 'N/A'}
                  </p>
                  <p>
                    <strong>Comments:</strong>{' '}
                    {order.order_status === 'delivery_too_slow'
                      ? 'delivery late'
                      : order.comments || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm sm:text-base">
                  Customer Information
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  {order.user_id ? (
                    <p>
                      <strong>Customer:</strong> Registered User
                    </p>
                  ) : (
                    <>
                      <p>
                        <strong>Email:</strong> {order.guest_email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {order.guest_phone}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">
                Shipping Address
              </h4>
              <div className="bg-gray-50 dark:bg-dark3 p-4 rounded-lg">
                <div className="text-xs sm:text-sm">
                  {isShippingAddress(order.shipping_address) ? (
                    <>
                      <p className="font-medium">
                        {order.shipping_address.name || 'N/A'}
                      </p>
                      <p>{order.shipping_address.address || 'N/A'}</p>
                      <p>
                        {order.shipping_address.city || 'N/A'},{' '}
                        {order.shipping_address.district
                          ? `${order.shipping_address.district}, `
                          : ''}
                        {order.shipping_address.state || 'N/A'} -{' '}
                        {order.shipping_address.pincode || 'N/A'}
                      </p>
                      <p>Phone: {order.shipping_address.phone || 'N/A'}</p>
                    </>
                  ) : (
                    <p>{order.shipping_address || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Items</h4>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div
                    key={item.order_item_id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <img
                      src={getThumbnailUrl(item.thumbnail_url)}
                      alt={item.product_name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Size: {item.size} • Qty: {item.quantity} • ₹
                        {item.price_at_purchase}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-sm sm:text-base">
                        ₹
                        {(
                          item.price_at_purchase * item.quantity
                        ).toLocaleString('en-IN')}
                      </p>
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

              {canShip && (
                <button
                  onClick={() => onShipOrder(order)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Ship Order
                </button>
              )}

              
              {canDeliver && (
                <button
                  onClick={() => onUpdateStatus(order.order_id, 'deliver')}
                  disabled={processingAction === `${order.order_id}-deliver`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
                >
                  {processingAction === `${order.order_id}-deliver`
                    ? 'Processing...'
                    : 'Mark as Delivered'}
                </button>
              )}

              {canRefund && (
                <button
                  onClick={() => onOpenRefundModal(order)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm sm:text-base"
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* (Inner) ConfirmAction & AlertModal for this modal */}
      <ConfirmActionModal
        confirmAction={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            onUpdateStatus(confirmAction.orderId, confirmAction.action);
            setConfirmAction(null);
          }
        }}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() =>
          setAlertModal({ isOpen: false, message: '', type: 'info' })
        }
      />
    </>
  );
};

/* =========================================================
   Main AdminOrderDashboard
   ========================================================= */

const AdminOrderDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [cancellingOrder] = useState(false);
  const [selectedItemsForCancel, setSelectedItemsForCancel] = useState<string[]>([]);
  const [selectedItemForAction, setSelectedItemForAction] = useState<OrderItem | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; action: string; message: string } | null>(null);

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const authType = useAuthStore((state) => state.authType);

  const {
    orders,
    ordersLoading,
    currentPage,
    totalPages,
    statusFilter,
    searchTerm,
    fetchOrders,
    setOrdersPage,
    setStatusFilter,
    setSearchTerm,
    returns,
    returnsLoading,
    processingAction,
    fetchReturns,
    updateReturnStatus,
    updateOrderStatus,
    handleUpdateShipment,
    handleUpdateDeliver,
    error,
    success,
  } = useAdminStore();

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const [shipmentForm, setShipmentForm] = useState({
    shipping_partner: '',
    tracking_id: '',
    tracking_url: '',
  });
  const [showCustomPartnerInput, setShowCustomPartnerInput] = useState(false);
  const [selectedItemsForShip, setSelectedItemsForShip] = useState<string[]>([]);
  const [selectedItemsForDeliver, setSelectedItemsForDeliver] = useState<string[]>([]);

  const showAlert = useCallback(
    (
      message: string,
      type: 'info' | 'warning' | 'error' | 'success' = 'info'
    ) => {
      setAlertModal({
        isOpen: true,
        message,
        type,
      });
    },
    []
  );

  const isAdmin = role === 'admin' || user?.role === 'admin';

  // Wrapper functions to handle local state and call store functions
  const handleUpdateShipmentWrapper = async () => {
    if (
      !selectedOrder ||
      !selectedOrder.order_id ||
      selectedItemsForShip.length === 0
    ) {
      showAlert('Please select at least one item to ship', 'warning');
      return;
    }

    if (
      !shipmentForm.tracking_id ||
      (showCustomPartnerInput
        ? !shipmentForm.shipping_partner ||
          shipmentForm.shipping_partner === 'other' ||
          shipmentForm.shipping_partner.trim() === ''
        : !shipmentForm.shipping_partner)
    ) {
      showAlert('Please enter shipping partner and tracking ID', 'warning');
      return;
    }

    await handleUpdateShipment(selectedOrder.order_id, selectedItemsForShip, shipmentForm);
    
    // Reset local state
    setShowShipmentModal(false);
    setSelectedOrder(null);
    setShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' });
    setShowCustomPartnerInput(false);
    setSelectedItemsForShip([]);
  };

  const handleUpdateDeliverWrapper = async () => {
    if (
      !selectedOrder ||
      !selectedOrder.order_id ||
      selectedItemsForDeliver.length === 0
    ) {
      showAlert('Please select at least one item to mark as delivered', 'warning');
      return;
    }

    await handleUpdateDeliver(selectedOrder.order_id, selectedItemsForDeliver);
    
    // Reset local state
    setShowDeliverModal(false);
    setSelectedOrder(null);
    setSelectedItemsForDeliver([]);
  };

  const handleRefundItem = async () => {
    if (!selectedOrder) return;

    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      
      // If a specific item is selected, refund that item
      if (selectedItemForAction) {
        await updateOrderItemStatus({
          action: 'refund_item',
          orderItemId: selectedItemForAction.order_item_id,
          reason: 'Admin initiated refund',
          refund_amount: refundType === 'partial' ? parseFloat(refundAmount) : undefined,
          refund_type: refundType,
          isAdmin: true,
          adminUserId: user?.id
        });
      } else {
        // Find refundable items (cancelled or delivered items that haven't been refunded)
        const refundableItems = selectedOrder.order_items?.filter(item => 
          ['cancelled', 'delivered'].includes(item.item_status || '') && 
          item.item_status !== 'refunded'
        ) || [];

        // Refund each refundable item
        for (const item of refundableItems) {
          await updateOrderItemStatus({
            action: 'refund_item',
            orderItemId: item.order_item_id,
            reason: 'Admin initiated refund',
            refund_amount: refundType === 'partial' ? parseFloat(refundAmount) : undefined,
            refund_type: refundType,
            isAdmin: true,
            adminUserId: user?.id
          });
        }
      }

      showAlert('Refund processed successfully', 'success');
      setShowRefundModal(false);
      setSelectedItemForAction(null);
      setRefundType('full');
      setRefundAmount('');
      
      // Refresh orders
      fetchOrders();
    } catch (error) {
      showAlert('Failed to process refund', 'error');
    }
  };


  const handleDeliverReplacement = async (item: OrderItem) => {
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      await updateOrderItemStatus({
        action: 'deliver_replacement',
        orderItemId: item.order_item_id,
        isAdmin: true,
        adminUserId: user?.id
      });

      showAlert('Replacement marked as delivered', 'success');
      
      // Refresh orders to show updated status
      fetchOrders();
    } catch (error) {
      console.error('Error delivering replacement:', error);
      showAlert('Failed to deliver replacement', 'error');
    }
  };

  const handleMarkReplacementReturned = async (item: OrderItem) => {
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      await updateOrderItemStatus({
        action: 'mark_replacement_returned',
        orderItemId: item.order_item_id,
        isAdmin: true,
        adminUserId: user?.id
      });

      showAlert('Replacement completed successfully', 'success');
      
      // Refresh orders to show updated status
      fetchOrders();
    } catch (error) {
      console.error('Error completing replacement:', error);
      showAlert('Failed to complete replacement', 'error');
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
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
  };

  const getOrderStats = () => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  });

  const stats = getOrderStats();

  const orderActionStates: OrderActionStateEntry[] = useMemo(() => {
    if (orders.length === 0) return [];

    return orders.map((order) => {
      const orderItems = (order.order_items || []).map(item => ({
        ...item,
        order_item_id: item.order_item_id || item.product_id || '', // Ensure order_item_id is always defined
        item_status: item.item_status || 'pending', // Ensure item_status is always defined
        product_name: item.product_name || item.name || 'Product', // Ensure product_name is always defined
        size: item.size || 'N/A', // Ensure size is always defined
        quantity: item.quantity || 1, // Ensure quantity is always defined
        price_at_purchase: item.price_at_purchase || 0, // Ensure price is always defined
        thumbnail_url: item.thumbnail_url || item.product_thumbnail_url || '', // Ensure thumbnail_url is always defined
      } as OrderItem));

      // Calculate action states for each order
      const actionStates = (() => {
        // Use the same logic as OrderDetailsPage for consistency
        const canCancelItem = (item: OrderItem) => {
          const itemStatus = item.item_status || 'pending';
          return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
        };
        
        return {
          canShip: orderItems.some(item => item.item_status === 'pending'),
          canCancel: orderItems.some(item => canCancelItem(item)),
          canDeliver: orderItems.some(item => item.item_status === 'shipped'),
        } as OrderActionFlags;
      })();

      return {
        orderId: order.order_id,
        actionStates,
        orderItems,
      };
    });
  }, [orders]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<'orders' | 'returns'>).detail;
      if (detail === 'orders' || detail === 'returns') {
        setActiveTab(detail);
      }
    };

    window.addEventListener('admin-tab-change', handler as EventListener);
    return () =>
      window.removeEventListener('admin-tab-change', handler as EventListener);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders(currentPage, statusFilter, searchTerm);
      if (activeTab === 'returns') {
        fetchReturns();
      }
    }
  }, [
    isAdmin,
    activeTab,
    currentPage,
    statusFilter,
    searchTerm,
    fetchOrders,
    fetchReturns,
  ]);

  // Show alerts for store error/success messages
  useEffect(() => {
    if (error) {
      showAlert(error, 'error');
    }
  }, [error, showAlert]);

  // Show global success messages only for actions that don't have local success handling
  useEffect(() => {
    if (success && !success.includes('marked as delivered') && !success.includes('completed successfully') && !success.includes('processed successfully')) {
      showAlert(success, 'success');
    }
  }, [success, showAlert]);

  if (!isAdmin) {
    return (
      <AccessDenied
        user={user}
        role={role}
        authType={authType}
        refreshUserProfile={refreshUserProfile}
      />
    );
  }

  const handleRefresh = () => {
    fetchOrders(currentPage, statusFilter, searchTerm);
    if (activeTab === 'returns') fetchReturns();
  };

  // Generate invoice data from order
  const generateInvoiceFromOrder = (order: Order): InvoiceData => {
    const invoiceItems: InvoiceItem[] = order.order_items.map((item, index) => {
      // Extract article ID from thumbnail URL or use a fallback
      const articleId = item.thumbnail_url ? 
        item.thumbnail_url.split('/').slice(-2)[0] : 
        item.product_id?.slice(0, 8) || 'N/A';
      
      return {
        id: item.order_item_id || index.toString(),
        name: item.product_name || 'Product',
        description: `Article ID: ${articleId}${item.size ? ` | Size: ${item.size}` : ''}${(item as any).color ? ` | Color: ${(item as any).color}` : ''}`,
        quantity: item.quantity || 1,
        price: parseFloat(item.price_at_purchase?.toString() || '0'),
        total: (parseFloat(item.price_at_purchase?.toString() || '0') * (item.quantity || 1))
      };
    });

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    
    return {
      id: order.order_id,
      invoiceNumber: generateInvoiceNumber(),
      date: order.order_date || '',
      customer: {
        name: (() => {
          // Try to get name from shipping address first
          if (order.shipping_address) {
            // If it's a string, parse it as JSON
            if (typeof order.shipping_address === 'string') {
              try {
                const address = JSON.parse(order.shipping_address);
                if (address && address.name) {
                  return address.name;
                }
              } catch (e) {
                console.warn('Failed to parse shipping address:', e);
              }
            } 
            // If it's already an object (ShippingAddress type)
            else if (typeof order.shipping_address === 'object' && order.shipping_address.name) {
              return order.shipping_address.name;
            }
          }
          // Fallback to email-based name
          return order.guest_email?.split('@')[0] || 'Customer';
        })(),
        email: order.guest_email || '',
        phone: order.guest_phone || '',
        address: order.shipping_address ? 
          (isShippingAddress(order.shipping_address) ? 
            `${order.shipping_address.address || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} - ${order.shipping_address.pincode || ''}` :
            order.shipping_address) : 
          ''
      },
      items: invoiceItems,
      subtotal,
      tax: 0, // No tax for now
      discount: 0, // No discount for now
      total: subtotal,
      status: order.payment_status === 'paid' ? 'paid' : 'pending',
      notes: `Order ID: ${order.order_id}\nPayment Method: ${order.payment_method}\nPayment Status: ${order.payment_status}`
    };
  };

  // Handle print invoice for delivered orders
  const handlePrintInvoice = (order: Order) => {
    try {
      const invoice = generateInvoiceFromOrder(order);
      printInvoice(invoice);
    } catch (error) {
      console.error('Error printing invoice:', error);
      showAlert('Failed to print invoice', 'error');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-dark1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:px-8">
          <AdminHeader activeTab={activeTab} onRefresh={handleRefresh} />

          {(ordersLoading && activeTab === 'orders') || (returnsLoading && activeTab === 'returns') ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading...</p>
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="space-y-6">
              <OrderStatsSummary stats={stats} />

              <OrderFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {orders.length} orders
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No orders found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {orders.length === 0
                      ? 'No orders available.'
                      : 'Try adjusting your filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => {
                    const actionState = orderActionStates.find(
                      (state) => state.orderId === order.order_id
                    );
                    return (
                      <OrderCard
                        key={order.order_id}
                        order={order as Order}
                        actionStates={actionState?.actionStates}
                        onView={(o) => {
                          setSelectedOrder(o as Order);
                          setShowOrderModal(true);
                        }}
                        onShip={(o) => {
                          setSelectedOrder(o as Order);
                          setShowShipmentModal(true);
                        }}
                        onCancel={(o) => {
                          setSelectedOrder(o as Order);
                          setSelectedItemsForCancel([]);
                          setCancelReason('');
                          setShowCancelModal(true);
                        }}
                        onDeliver={(o) => {
                          setSelectedOrder(o as Order);
                          setShowDeliverModal(true);
                        }}
                        onRefundItem={handleRefundItem}
                        onRefundOrder={(o) => {
                          setSelectedOrder(o as Order);
                          setSelectedItemForAction(null);
                          setRefundType('full');
                          setRefundAmount('');
                          setShowRefundModal(true);
                        }}
                        onDeliverReplacement={handleDeliverReplacement}
                        onPrintInvoice={handlePrintInvoice}
                      />
                    );
                  })}
                </div>
              )}

              <OrdersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                loading={ordersLoading}
                setPage={setOrdersPage}
              />
            </div>
          ) : (
            <ReturnsManagementTab
              returns={returns}
              onUpdateStatus={updateReturnStatus}
              processingAction={processingAction}
              showAlert={showAlert}
              user={user}
              fetchOrders={fetchOrders}
              fetchReturns={fetchReturns}
            />
          )}
        </div>

        {showOrderModal && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setShowOrderModal(false)}
            onUpdateStatus={updateOrderStatus}
            onShipOrder={(order) => {
              setSelectedOrder(order);
              setShowShipmentModal(true);
            }}
            setConfirmAction={setConfirmAction}
            confirmAction={confirmAction}
            showCancelModal={showCancelModal}
            setShowCancelModal={setShowCancelModal}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            cancelComments={cancelComments}
            setCancelComments={setCancelComments}
            selectedItemsForCancel={selectedItemsForCancel}
            setSelectedItemsForCancel={setSelectedItemsForCancel}
            processingAction={processingAction}
            alertModal={alertModal}
            setAlertModal={setAlertModal}
            user={user}
            fetchOrders={fetchOrders}
            onOpenRefundModal={(order) => {
              setSelectedOrder(order);
              setSelectedItemForAction(null);
              setRefundType('full');
              setRefundAmount('');
              setShowRefundModal(true);
            }}
          />
        )}

        <ShipmentModal
          isOpen={showShipmentModal}
          order={selectedOrder}
          shipmentForm={shipmentForm}
          setShipmentForm={setShipmentForm}
          showCustomPartnerInput={showCustomPartnerInput}
          setShowCustomPartnerInput={setShowCustomPartnerInput}
          selectedItemsForShip={selectedItemsForShip}
          setSelectedItemsForShip={setSelectedItemsForShip}
          onClose={() => {
            setShowShipmentModal(false);
            setSelectedItemsForShip([]);
          }}
          onSubmit={handleUpdateShipmentWrapper}
          processingAction={processingAction}
        />

        {showRefundModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Process Refund</h3>
                </div>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Order Info */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Order ID:</strong> #{selectedOrder.order_id.slice(-8)}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-100 mt-1">
                    <strong>Items to refund:</strong> {
                      selectedItemForAction ? 1 : 
                      selectedOrder.order_items?.filter(item => 
                        ['cancelled', 'delivered'].includes(item.item_status || '') && 
                        item.item_status !== 'refunded'
                      ).length || 0
                    }
                  </p>
                </div>

                {/* Items List */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Items</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(selectedItemForAction ? [selectedItemForAction] : 
                      selectedOrder.order_items?.filter(item => 
                        ['cancelled', 'delivered'].includes(item.item_status || '') && 
                        item.item_status !== 'refunded'
                      ) || []).map((item) => (
                      <div
                        key={item.order_item_id}
                        className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <img
                          src={getThumbnailUrl(item.thumbnail_url || item.product_thumbnail_url || '')}
                          alt={item.product_name}
                          className="w-12 h-12 rounded object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{item.product_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity || 1}</p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ₹{((item.price_at_purchase || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <RefundActionPanel
                  refundType={refundType}
                  setRefundType={setRefundType}
                  refundAmount={refundAmount}
                  setRefundAmount={setRefundAmount}
                  totalAmount={selectedItemForAction ? 
                    // For single item orders, use effective_amount if available, otherwise fall back to item price
                    (selectedOrder.order_items?.length === 1 && selectedOrder.effective_amount) 
                      ? selectedOrder.effective_amount 
                      : (selectedItemForAction.price_at_purchase || 0) * (selectedItemForAction.quantity || 1) :
                    // For multiple items, use effective_amount if all items are being refunded and it's a single item order
                    (selectedOrder.order_items?.length === 1 && selectedOrder.effective_amount) 
                      ? selectedOrder.effective_amount 
                      : selectedOrder.order_items?.filter(item => 
                        ['cancelled', 'delivered'].includes(item.item_status || '') && 
                        item.item_status !== 'refunded'
                      ).reduce((sum, item) => sum + ((item.price_at_purchase || 0) * (item.quantity || 1)), 0) || 0
                  }
                  processing={processingAction === 'refund'}
                  orderId={selectedOrder.order_id}
                  paymentMethod={selectedOrder.payment_method}
                  razorpayPaymentId={selectedOrder.razorpay_payment_id}
                  onConfirmRefund={async () => {
                    try {
                      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
                      const currentRefundAmount = refundAmount; // Capture current state value
                      const currentRefundType = refundType;   // Capture current state value
                      
                      if (selectedItemForAction) {
                        // Refund single item
                        const calculatedRefundAmount = currentRefundType === 'partial' ? parseFloat(currentRefundAmount) : 
                          // For single item orders, use effective_amount if available
                          (selectedOrder.order_items?.length === 1 && selectedOrder.effective_amount) 
                            ? selectedOrder.effective_amount 
                            : (selectedItemForAction.price_at_purchase || 0) * (selectedItemForAction.quantity || 1);
                        
                        const result = await updateOrderItemStatus({
                          action: 'refund_item',
                          orderItemId: selectedItemForAction.order_item_id,
                          reason: 'Admin initiated refund',
                          refund_amount: currentRefundType === 'partial' ? parseFloat(currentRefundAmount) : calculatedRefundAmount,
                          refund_type: currentRefundType,
                          isAdmin: true,
                          adminUserId: user?.id
                        });

                        if (!result) {
                          throw new Error('Refund processing failed - no response from server');
                        }
                      } else {
                        // Refund all refundable items
                        const refundableItems = selectedOrder.order_items?.filter(item => 
                          ['cancelled', 'delivered'].includes(item.item_status || '') && 
                          item.item_status !== 'refunded'
                        ) || [];
                        
                        // For single item orders, use effective_amount if available
                        const useEffectiveAmount = selectedOrder.order_items?.length === 1 && selectedOrder.effective_amount;
                        
                        for (const item of refundableItems) {
                          const itemRefundAmount = currentRefundType === 'partial' ? parseFloat(currentRefundAmount) / refundableItems.length : 
                            (useEffectiveAmount ? selectedOrder.effective_amount : (item.price_at_purchase || 0) * (item.quantity || 1));
                          
                          const result = await updateOrderItemStatus({
                            action: 'refund_item',
                            orderItemId: item.order_item_id,
                            reason: 'Admin initiated refund',
                            refund_amount: itemRefundAmount,
                            refund_type: currentRefundType,
                            isAdmin: true,
                            adminUserId: user?.id
                          });

                          if (!result) {
                            throw new Error(`Refund processing failed for item ${item.order_item_id}`);
                          }
                        }
                      }
                      
                      showAlert('Refund processed successfully', 'success');
                      setShowRefundModal(false);
                      setSelectedItemForAction(null);
                      setRefundType('full');
                      setRefundAmount('');
                      fetchOrders();
                    } catch (error: any) {
                      console.error('Refund processing error:', error);
                      
                      // Handle specific error scenarios
                      if (error.message?.includes('Razorpay refund failed')) {
                        showAlert('Razorpay refund failed. Please check your Razorpay credentials and try again.', 'error');
                      } else if (error.message?.includes('Missing Razorpay payment ID')) {
                        showAlert('Razorpay payment ID not found for this order. Cannot process refund.', 'error');
                      } else if (error.message?.includes('COD refund allowed only after delivery')) {
                        showAlert('COD refunds are only allowed for delivered items.', 'error');
                      } else if (error.message?.includes('Refund not supported for this payment method')) {
                        showAlert('Refunds are not supported for this payment method.', 'error');
                      } else if (error.message?.includes('Partial refund cannot exceed item price')) {
                        showAlert('Partial refund amount cannot exceed the item price.', 'error');
                      } else if (error.message?.includes('refund_amount required for partial refund')) {
                        showAlert('Refund amount is required for partial refunds.', 'error');
                      } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
                        showAlert('Server error occurred while processing refund. Please try again later.', 'error');
                      } else {
                        showAlert('Failed to process refund: ' + (error.message || 'Unknown error'), 'error');
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <DeliverModal
          isOpen={showDeliverModal}
          order={selectedOrder}
          selectedItemsForDeliver={selectedItemsForDeliver}
          setSelectedItemsForDeliver={setSelectedItemsForDeliver}
          onClose={() => {
            setShowDeliverModal(false);
            setSelectedItemsForDeliver([]);
          }}
          onSubmit={handleUpdateDeliverWrapper}
          processingAction={processingAction}
        />

        <ConfirmActionModal
          confirmAction={confirmAction}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction) {
              updateOrderStatus(confirmAction.orderId, confirmAction.action);
              setConfirmAction(null);
            }
          }}
        />
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() =>
          setAlertModal({ isOpen: false, message: '', type: 'info' })
        }
      />

      {/* Cancel Items Modal - Main Component */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Cancel Order Items</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelComments('');
                  setSelectedItemsForCancel([]);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Select the items you want to cancel and provide a reason.
            </p>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Items to Cancel</label>
                <button
                  onClick={() => {
                    const orderItems = (selectedOrder.order_items || []).map(item => ({
                      ...item,
                      order_item_id: item.order_item_id || '',
                      item_status: item.item_status || 'pending',
                    }));
                    const canCancelItem = (item: OrderItem) => {
                      const itemStatus = item.item_status || 'pending';
                      return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
                    };
                    setSelectedItemsForCancel(orderItems.filter(canCancelItem).map(i => i.order_item_id));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Select All
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                {(selectedOrder.order_items || []).map((item: OrderItem) => {
                  const canCancelItem = (item: OrderItem) => {
                    const itemStatus = item.item_status || 'pending';
                    return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
                  };
                  const isDisabled = !canCancelItem(item);
                  return (
                    <label
                      key={item.order_item_id}
                      className={`flex items-center gap-3 p-2 rounded ${isDisabled ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemsForCancel.includes(item.order_item_id)}
                        onChange={(e) => {
                          if (isDisabled) return;
                          setSelectedItemsForCancel(prev => 
                            e.target.checked ? [...prev, item.order_item_id] : prev.filter(id => id !== item.order_item_id)
                          );
                        }}
                        disabled={isDisabled}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <img src={getThumbnailUrl(item.thumbnail_url || item.product_thumbnail_url || '')} alt={item.product_name || item.name || 'Product'} className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-600" loading="lazy" decoding="async" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name || item.name || 'Product'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Size: {item.size || 'N/A'} | Qty: {item.quantity} | ₹{item.price_at_purchase || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Status: <span className={`px-2 py-1 rounded text-xs ${
                            item.item_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            item.item_status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            item.item_status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            item.item_status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {item.item_status || 'pending'}
                          </span>
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select a reason</option>
                <option value="customer_request">Customer Request</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="shipping_delay">Shipping Delay</option>
                <option value="wrong_item">Wrong Item</option>
                <option value="damaged">Damaged Product</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Comments
              </label>
              <textarea
                value={cancelComments}
                onChange={(e) => setCancelComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any additional information about the cancellation..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelComments('');
                  setSelectedItemsForCancel([]);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!cancelReason || selectedItemsForCancel.length === 0) {
                    setAlertModal({
                      isOpen: true,
                      message: 'Please select items and provide a reason for cancellation',
                      type: 'error',
                    });
                    return;
                  }

                  try {
                    // Use edge function for each item cancellation
                    const { updateOrderItemStatus } = await import('../../../lib/orderActions');
                    
                    for (const itemId of selectedItemsForCancel) {
                      await updateOrderItemStatus({
                        action: 'cancel_item',
                        orderItemId: itemId,
                        reason: cancelReason,
                        isAdmin: true,
                        adminUserId: user?.id
                      });
                    }

                    setAlertModal({
                      isOpen: true,
                      message: 'Order items cancelled successfully',
                      type: 'success',
                    });
                    setShowCancelModal(false);
                    setCancelReason('');
                    setCancelComments('');
                    setSelectedItemsForCancel([]);
                    // Refresh orders to get updated status
                    await fetchOrders();
                  } catch (error) {
                    console.error('Cancel error:', error);
                    setAlertModal({
                      isOpen: true,
                      message: `Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      type: 'error',
                    });
                  }
                }}
                disabled={selectedItemsForCancel.length === 0 || !cancelReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel {selectedItemsForCancel.length} Item{selectedItemsForCancel.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AdminOrderDashboard;