import React, { useState, useEffect, useMemo } from 'react';
import { Package, XCircle, Clock, CheckCircle, Truck, Ban, RefreshCw, Filter, Search, Eye, X, Upload, MapPin, Phone, Mail, User, Calendar, DollarSign, TrendingUp, ShoppingBag, Users, AlertCircle, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { supabase } from '@lib/supabase';
import { getImageForUseCase } from '../../../lib/utils/imageOptimization';
import AlertModal from '../../../components/ui/AlertModal';
import type { Return } from '../store/adminStore';

interface ReturnsManagementTabProps {
  returns: Return[];
  onUpdateStatus: (returnId: string, action: string, orderItemId?: string, additionalData?: Record<string, any>) => void;
  processingAction: string | null;
  showAlert: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  user: any;
  fetchOrders: () => Promise<void>;
  fetchReturns: () => Promise<void>;
}

const ReturnsManagementTab: React.FC<ReturnsManagementTabProps> = ({
  returns,
  onUpdateStatus,
  processingAction,
  showAlert,
  user,
  fetchOrders,
  fetchReturns
}) => {
  const [selectedReturnItem, setSelectedReturnItem] = useState<Return | null>(null);
  const [showReplacementRejectionModal, setShowReplacementRejectionModal] = useState(false);
  const [showReplacementApprovalModal, setShowReplacementApprovalModal] = useState(false);
  const [showReplacementShippingModal, setShowReplacementShippingModal] = useState(false);
  const [showReplacementDeliveryModal, setShowReplacementDeliveryModal] = useState(false);
  const [replacementRejectionReason, setReplacementRejectionReason] = useState('');
  const [replacementShippingData, setReplacementShippingData] = useState({
    shippingPartner: '',
    trackingId: '',
    adminNotes: ''
  });
  const [showCustomPartnerInput, setShowCustomPartnerInput] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter returns based on status and search term
  const filteredReturns = useMemo(() => {
    let filtered = returns;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(returnItem => returnItem.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(returnItem => 
        returnItem.return_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.orders?.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [returns, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReturns.slice(startIndex, endIndex);
  }, [filteredReturns, currentPage, itemsPerPage]);

  // Helper function to validate shipping partner
  const isShippingPartnerValid = showCustomPartnerInput
    ? replacementShippingData.shippingPartner &&
      replacementShippingData.shippingPartner !== 'other' &&
      replacementShippingData.shippingPartner.trim() !== ''
    : replacementShippingData.shippingPartner && replacementShippingData.shippingPartner !== '';

  // Handle replacement rejection
  const handleRejectReplacement = async () => {

    if (!selectedReturnItem) {
      showAlert('Missing required data', 'error');
      return;
    }

    if (!replacementRejectionReason.trim()) {
      showAlert('Please provide a rejection reason', 'error');
      return;
    }


    try {
      await onUpdateStatus(
        selectedReturnItem.return_id, 
        'reject_replacement', 
        selectedReturnItem.order_item_id,
        { reason: replacementRejectionReason.trim() }
      );
      console.log('✅ Replacement rejected successfully');
      showAlert('Replacement rejected successfully', 'success');
      setShowReplacementRejectionModal(false);
      setReplacementRejectionReason('');
      setSelectedReturnItem(null);
      
      // Refresh returns to show updated status
      fetchReturns();
    } catch (error) {
      console.error('❌ Error rejecting replacement:', error);
      showAlert('Failed to reject replacement', 'error');
    }
  };

  // Handle replacement shipping
  const handleShipReplacement = async () => {
    console.log('🔍 handleShipReplacement called', {
      selectedReturnItem,
      replacementShippingData,
      user
    });

    if (!selectedReturnItem || !isShippingPartnerValid || !replacementShippingData.trackingId.trim()) {
      showAlert('Please provide shipping partner and tracking ID', 'error');
      return;
    }

    try {
      await onUpdateStatus(
        selectedReturnItem.return_id, 
        'ship_replacement', 
        selectedReturnItem.order_item_id,
        {
          shipping_partner: replacementShippingData.shippingPartner,
          tracking_id: replacementShippingData.trackingId,
          tracking_url: '' // Can be enhanced later to include tracking URL
        }
      );
      console.log('✅ Replacement shipped successfully');
      showAlert('Replacement shipped successfully', 'success');
      setShowReplacementShippingModal(false);
      setReplacementShippingData({ shippingPartner: '', trackingId: '', adminNotes: '' });
      setSelectedReturnItem(null);
      
      // Refresh returns to show updated status
      fetchReturns();
    } catch (error) {
      console.error('❌ Error shipping replacement:', error);
      showAlert('Failed to ship replacement', 'error');
    }
  };


  // Handle replacement approval
  const handleApproveReplacement = async () => {
    console.log('🔍 Approve Replacement button clicked', { selectedReturnItem });

    if (!selectedReturnItem) {
      showAlert('Missing required data', 'error');
      return;
    }

    console.log('✅ Validation passed, proceeding with approval...');

    try {
      await onUpdateStatus(
        selectedReturnItem.return_id, 
        'approve_replacement', 
        selectedReturnItem.order_item_id,
        { 
          approvedBy: user?.email || 'admin',
          reason: replacementRejectionReason.trim() 
        }
      );
      console.log('✅ Replacement approved successfully');
      showAlert('Replacement approved successfully', 'success');
      setShowReplacementApprovalModal(false);
      setReplacementRejectionReason('');
      setSelectedReturnItem(null);
      
      // Refresh returns to show updated status
      fetchReturns();
    } catch (error) {
      console.error('❌ Error approving replacement:', error);
      showAlert('Failed to approve replacement', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Returns</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="in_transit">In Transit</option>
            <option value="received">Received</option>
            <option value="replacement_shipped">Replacement Shipped</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by return ID, order ID, customer name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Showing {paginatedReturns.length} of {filteredReturns.length} returns
        {totalPages > 1 && (
          <span className="ml-2">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Returns List */}
      {paginatedReturns.map((returnRequest) => (
        <div key={returnRequest.return_id} className="bg-white dark:bg-dark2 rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {returnRequest.request_type === 'replacement' ? 'Replacement' : 'Return'} #{returnRequest.return_id.slice(-8)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Requested:{' '}
                  {new Date(returnRequest.requested_at).toLocaleDateString('en-IN')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Order #{returnRequest.order_id.slice(-8)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    returnRequest.status === 'approved' || returnRequest.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : returnRequest.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : returnRequest.request_type === 'replacement'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}
                >
                  {returnRequest.status === 'approved' 
                    ? 'Approved' 
                    : returnRequest.status === 'rejected'
                    ? 'Rejected'
                    : returnRequest.status === 'completed'
                    ? 'Completed'
                    : returnRequest.status === 'replacement_shipped'
                    ? 'Replacement Shipped'
                    : 'Requested'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <img
                  src={getImageForUseCase(returnRequest.order_items?.thumbnail_url || returnRequest.thumbnail_url || '/placeholder-image.jpg', 'THUMBNAIL')}
                  alt={returnRequest.order_items?.product_name || returnRequest.product_name || 'Product'}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {returnRequest.order_items?.product_name || returnRequest.product_name || 'Unknown Product'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Size: {returnRequest.order_items?.size || returnRequest.size || 'N/A'}</p>
                  <p>Quantity: {returnRequest.order_items?.quantity || returnRequest.quantity || 0}</p>
                  <p>Price: ₹{returnRequest.order_items?.price_at_purchase || returnRequest.price_at_purchase || '0'}</p>
                  {returnRequest.reason_description && (
                    <p className="mt-2">
                      <strong>Reason:</strong> {returnRequest.reason_description}
                    </p>
                  )}
                  {returnRequest.requested_size && (
                    <p className="mt-2">
                      <strong>Requested Size:</strong> {returnRequest.requested_size}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium">Customer: {returnRequest.orders?.guest_email || 'N/A'}</p>
                <p>Payment: {returnRequest.orders?.payment_method || 'N/A'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {returnRequest.request_type === 'replacement' && returnRequest.status === 'requested' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedReturnItem(returnRequest);
                        setShowReplacementApprovalModal(true);
                        setReplacementRejectionReason('');
                      }}
                      disabled={
                        processingAction ===
                        `return-${returnRequest.return_id}-approve_replacement`
                      }
                      className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {processingAction ===
                      `return-${returnRequest.return_id}-approve_replacement`
                        ? 'Processing...'
                        : 'Approve Replacement'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReturnItem(returnRequest);
                        setShowReplacementRejectionModal(true);
                        setReplacementRejectionReason('');
                      }}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject Replacement
                    </button>
                  </>
                )}
                {returnRequest.request_type === 'replacement' && returnRequest.status === 'approved' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedReturnItem(returnRequest);
                        setShowReplacementShippingModal(true);
                        setShowCustomPartnerInput(false);
                        setReplacementShippingData({ shippingPartner: '', trackingId: '', adminNotes: '' });
                      }}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Ship Replacement
                    </button>
                  </>
                )}
                {returnRequest.request_type === 'return' && returnRequest.status === 'approved' && !returnRequest.return_approved_at && (
                  <button
                    onClick={() => onUpdateStatus(returnRequest.return_id, 'refund')}
                    disabled={
                      processingAction === `return-${returnRequest.return_id}-refund`
                    }
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processingAction ===
                  `return-${returnRequest.return_id}-refund`
                    ? 'Processing...'
                    : 'Process Refund'}
                  </button>
                )}
                {returnRequest.request_type === 'replacement' && returnRequest.status === 'replacement_shipped' && (
                  <button
                    onClick={() => {
                      setSelectedReturnItem(returnRequest);
                      setShowReplacementDeliveryModal(true);
                    }}
                    disabled={
                      processingAction === `return-${returnRequest.return_id}-replacement_delivered`
                    }
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingAction ===
                  `return-${returnRequest.return_id}-replacement_delivered`
                    ? 'Processing...'
                    : 'Mark as Delivered'}
                  </button>
                )}
                {returnRequest.request_type === 'replacement' && returnRequest.status === 'completed' && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Replacement Completed</span>
                    </div>
                  </div>
                )}
                {returnRequest.replacement_tracking_id && (
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Tracking:</span> {returnRequest.replacement_tracking_id}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {returns.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No return requests found</p>
        </div>
      )}
      
      {/* Replacement Approval Modal */}
      {showReplacementApprovalModal && selectedReturnItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Approve Replacement</h2>
              <button
                onClick={() => {
                  setShowReplacementApprovalModal(false);
                  setSelectedReturnItem(null);
                  setReplacementRejectionReason('');
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedReturnItem.order_items?.product_name || selectedReturnItem.product_name || 'Unknown Product'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Size: {selectedReturnItem.order_items?.size || selectedReturnItem.size || 'N/A'} | 
                  Quantity: {selectedReturnItem.order_items?.quantity || selectedReturnItem.quantity || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Price: ₹{selectedReturnItem.order_items?.price_at_purchase || selectedReturnItem.price_at_purchase || '0'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Approval Reason</label>
              <textarea
                value={replacementRejectionReason}
                onChange={(e) => {
                  setReplacementRejectionReason(e.target.value);
                }}
                placeholder="Please describe reason for approving this replacement request..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReplacementApprovalModal(false);
                  setSelectedReturnItem(null);
                  setReplacementRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReplacement}
                disabled={!replacementRejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Approve Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Rejection Modal */}
      {showReplacementRejectionModal && selectedReturnItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Reject Replacement</h2>
              <button
                onClick={() => {
                  setShowReplacementRejectionModal(false);
                  setSelectedReturnItem(null);
                  setReplacementRejectionReason('');
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedReturnItem.order_items?.product_name || selectedReturnItem.product_name || 'Unknown Product'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Size: {selectedReturnItem.order_items?.size || selectedReturnItem.size || 'N/A'} | 
                  Quantity: {selectedReturnItem.order_items?.quantity || selectedReturnItem.quantity || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Price: ₹{selectedReturnItem.order_items?.price_at_purchase || selectedReturnItem.price_at_purchase || '0'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for rejection</label>
              <textarea
                value={replacementRejectionReason}
                onChange={(e) => {
                  console.log('🔍 Textarea changed:', {
                    value: `"${e.target.value}"`,
                    length: e.target.value.length
                  });
                  setReplacementRejectionReason(e.target.value);
                }}
                placeholder="Please describe the reason for rejecting the replacement request..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReplacementRejectionModal(false);
                  setSelectedReturnItem(null);
                  setReplacementRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectReplacement}
                disabled={!replacementRejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Reject Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Shipping Modal */}
      {showReplacementShippingModal && selectedReturnItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Ship Replacement</h2>
              <button
                onClick={() => {
                  setShowReplacementShippingModal(false);
                  setSelectedReturnItem(null);
                  setShowCustomPartnerInput(false);
                  setReplacementShippingData({ shippingPartner: '', trackingId: '', adminNotes: '' });
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedReturnItem.order_items?.product_name || selectedReturnItem.product_name || 'Unknown Product'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Size: {selectedReturnItem.order_items?.size || selectedReturnItem.size || 'N/A'} | 
                  Quantity: {selectedReturnItem.order_items?.quantity || selectedReturnItem.quantity || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Price: ₹{selectedReturnItem.order_items?.price_at_purchase || selectedReturnItem.price_at_purchase || '0'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping Partner</label>
                <select
                  value={replacementShippingData.shippingPartner}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReplacementShippingData(prev => ({ ...prev, shippingPartner: value }));
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Shipping Partner Name *
                  </label>
                  <input
                    type="text"
                    value={
                      replacementShippingData.shippingPartner === 'other'
                        ? ''
                        : replacementShippingData.shippingPartner
                    }
                    onChange={(e) =>
                      setReplacementShippingData(prev => ({ ...prev, shippingPartner: e.target.value }))
                    }
                    placeholder="Enter shipping partner name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tracking ID</label>
                <input
                  type="text"
                  value={replacementShippingData.trackingId}
                  onChange={(e) => setReplacementShippingData(prev => ({ ...prev, trackingId: e.target.value }))}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={replacementShippingData.adminNotes}
                  onChange={(e) => setReplacementShippingData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Additional notes for this shipment..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReplacementShippingModal(false);
                  setSelectedReturnItem(null);
                  setShowCustomPartnerInput(false);
                  setReplacementShippingData({ shippingPartner: '', trackingId: '', adminNotes: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleShipReplacement}
                disabled={!isShippingPartnerValid || !replacementShippingData.trackingId.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Ship Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Delivery Confirmation Modal */}
      {showReplacementDeliveryModal && selectedReturnItem && (
        <AlertModal
          isOpen={showReplacementDeliveryModal}
          onClose={() => {
            setShowReplacementDeliveryModal(false);
            setSelectedReturnItem(null);
          }}
          title="Confirm Replacement Delivery"
          message={`Are you sure you want to mark the replacement for "${selectedReturnItem?.product_name || 'this item'}" as delivered?`}
          type="warning"
          showCancel={true}
          onConfirm={async () => {
            try {
              await onUpdateStatus(
                selectedReturnItem.return_id,
                'deliver_replacement',
                selectedReturnItem.order_item_id
              );
              
              setShowReplacementDeliveryModal(false);
              setSelectedReturnItem(null);
              showAlert('Replacement marked as delivered successfully', 'success');
              fetchReturns();
            } catch (error) {
              console.error('Error marking replacement as delivered:', error);
              showAlert('Failed to mark replacement as delivered', 'error');
            }
          }}
          confirmText="Yes, Mark as Delivered"
          cancelText="Cancel"
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagementTab;
