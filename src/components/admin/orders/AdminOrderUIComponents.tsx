import React from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, Ban, RefreshCw, Filter, Search } from 'lucide-react';

/* ─── AccessDenied ─────────────────────────────────────────────── */
interface AccessDeniedProps {
  user: { email?: string | null; role?: string | null } | null;
  role: string | null;
  authType: string | null;
  refreshUserProfile: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ user, role, authType, refreshUserProfile }) => (
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

/* ─── AdminHeader ──────────────────────────────────────────────── */
interface AdminHeaderProps {
  activeTab: 'orders' | 'returns';
  onRefresh: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onRefresh }) => (
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
            onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'orders' }))}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'returns' }))}
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

/* ─── StatCard ─────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
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

/* ─── OrderStatsSummary ────────────────────────────────────────── */
interface OrderStats {
  total: number;
  pending: number;
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export const OrderStatsSummary: React.FC<{ stats: OrderStats }> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
    <StatCard label="Total" value={stats.total} icon={<Package className="w-5 h-5 text-blue-500" />} />
    <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
    <StatCard label="Paid" value={stats.paid} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
    <StatCard label="Shipped" value={stats.shipped} icon={<Truck className="w-5 h-5 text-blue-500" />} />
    <StatCard label="Delivered" value={stats.delivered} icon={<CheckCircle className="w-5 h-5 text-green-600" />} />
    <StatCard label="Cancelled" value={stats.cancelled} icon={<XCircle className="w-5 h-5 text-red-500" />} />
  </div>
);

/* ─── OrderFilters ─────────────────────────────────────────────── */
interface OrderFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
}) => (
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

/* ─── OrdersPagination ─────────────────────────────────────────── */
interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  setPage: (page: number) => void;
}

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  currentPage,
  totalPages,
  loading,
  setPage,
}) => {
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
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-gray-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => setPage(page as number)}
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

/* ─── ConfirmActionModal ───────────────────────────────────────── */
interface ConfirmActionModalProps {
  confirmAction: { orderId: string; action: string; message: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  confirmAction,
  onCancel,
  onConfirm,
}) => {
  if (!confirmAction) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Action</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{confirmAction.message}</p>
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
