import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package } from 'lucide-react';
import { useAdminStore }  from '../../../features/admin/store/adminStore';
import { useAuthStore }   from '../../../store/authStore';
import { supabase }       from '../../../lib/supabase';
import ReturnsManagementTab from './ReturnsManagementTab';
import {
  downloadInvoicePdf,
  downloadPackagingLabelPdf,
  generateInvoiceFromAdminOrder,
  toNumber,
} from '../../../utils/invoiceUtils';
import AlertModal from '../../../components/ui/AlertModal';

// ── Image URL transformer ─────────────────────────────────────────────────────
const transformImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return url;
  return url.replace(
    /https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/ficishoesimages\//g,
    'https://supabase-proxy.furqhaanmohammed001.workers.dev/storage/v1/object/public/ficishoesimages/',
  );
};

import type { Order, OrderItem, OrderActionFlags } from '../../../types/order-common';
import type {
  OrderActionStateEntry,
  AlertModalState,
  ShipmentFormState,
  ConfirmActionState,
} from '../../../types/adminOrders';

import {
  AccessDenied,
  AdminHeader,
  OrderStatsSummary,
  OrderFilters,
  OrdersPagination,
  ConfirmActionModal,
} from '../../../components/admin/orders/AdminOrderUIComponents';

import { OrderCard }          from '../../../components/admin/orders/OrderCard';
import { OrderDetailsModal }  from '../../../components/admin/orders/OrderDetailsModal';
import { ShipmentModal, DeliverModal, EditShippingModal } from '../../../components/admin/orders/ShipmentDeliverModals';
import { CancelItemsModal }   from '../../../components/admin/orders/CancelItemsModal';
import { RefundModal }        from '../../../components/admin/orders/RefundModal';

import { canCancelOrderItem } from '../../../utils/adminOrderUtils';

/* =========================================================
   AdminOrderDashboard
   ========================================================= */
const AdminOrderDashboard: React.FC = () => {
  // ── UI state ──────────────────────────────────────────────
  const [activeTab,             setActiveTab]             = useState<'orders' | 'returns'>('orders');
  const [selectedOrder,         setSelectedOrder]         = useState<Order | null>(null);
  const [showOrderModal,        setShowOrderModal]        = useState(false);
  const [showShipmentModal,     setShowShipmentModal]     = useState(false);
  const [showDeliverModal,      setShowDeliverModal]      = useState(false);
  const [showRefundModal,       setShowRefundModal]       = useState(false);
  const [showCancelModal,       setShowCancelModal]       = useState(false);
  const [showEditShippingModal, setShowEditShippingModal] = useState(false);

  // ── Cancel state ──────────────────────────────────────────
  const [cancelReason,          setCancelReason]          = useState('');
  const [cancelComments,        setCancelComments]        = useState('');
  const [selectedItemsForCancel,setSelectedItemsForCancel]= useState<string[]>([]);

  // ── Refund state ──────────────────────────────────────────
  const [selectedItemForAction, setSelectedItemForAction] = useState<OrderItem | null>(null);
  const [refundType,            setRefundType]            = useState<'full' | 'partial'>('full');
  const [refundAmount,          setRefundAmount]          = useState('');

  // ── Edit shipping state ────────────────────────────────────
  const [selectedItemForEditShipping, setSelectedItemForEditShipping] = useState<OrderItem | null>(null);
  const [editShipmentForm,      setEditShipmentForm]      = useState<ShipmentFormState>({
    shipping_partner: '', tracking_id: '', tracking_url: '',
  });
  const [showCustomPartnerInputForEdit, setShowCustomPartnerInputForEdit] = useState(false);

  // ── Confirm state ─────────────────────────────────────────
  const [confirmAction,         setConfirmAction]         = useState<ConfirmActionState | null>(null);

  // ── Shipment state ────────────────────────────────────────
  const [shipmentForm,          setShipmentForm]          = useState<ShipmentFormState>({
    shipping_partner: '', tracking_id: '', tracking_url: '',
  });
  const [showCustomPartnerInput,setShowCustomPartnerInput]= useState(false);
  const [selectedItemsForShip,  setSelectedItemsForShip]  = useState<string[]>([]);
  const [selectedItemsForDeliver,setSelectedItemsForDeliver]=useState<string[]>([]);

  // ── Invoice download per-order loading state ──────────────
  const [downloadingInvoiceId,  setDownloadingInvoiceId]  = useState<string | null>(null);

  // ── Alert ─────────────────────────────────────────────────
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    isOpen: false, message: '', type: 'info',
  });

  // ── Auth ──────────────────────────────────────────────────
  const user     = useAuthStore((s) => s.user);
  const role     = useAuthStore((s) => s.role);
  const authType = useAuthStore((s) => s.authType);

  // ── Store ─────────────────────────────────────────────────
  const {
    orders, ordersLoading, currentPage, totalPages,
    statusFilter, searchTerm,
    fetchOrders, setOrdersPage, setStatusFilter, setSearchTerm,
    returns, returnsLoading, processingAction, fetchReturns,
    updateReturnStatus, updateOrderStatus,
    handleUpdateShipment, handleUpdateDeliver, handleUpdateItemShipment,
    error, success,
  } = useAdminStore();

  const showAlert = useCallback(
    (message: string, type: AlertModalState['type'] = 'info') =>
      setAlertModal({ isOpen: true, message, type }),
    [],
  );

  const isAdmin = role === 'admin' || user?.role === 'admin';

  // ── Shipment handler ──────────────────────────────────────
  const handleUpdateShipmentWrapper = async () => {
    if (!selectedOrder?.order_id || selectedItemsForShip.length === 0) {
      showAlert('Please select at least one item to ship', 'warning'); return;
    }
    const partnerInvalid = showCustomPartnerInput
      ? !shipmentForm.shipping_partner || shipmentForm.shipping_partner === 'other' || !shipmentForm.shipping_partner.trim()
      : !shipmentForm.shipping_partner;
    if (partnerInvalid || !shipmentForm.tracking_id) {
      showAlert('Please enter shipping partner and tracking ID', 'warning'); return;
    }
    await handleUpdateShipment(selectedOrder.order_id, selectedItemsForShip, shipmentForm);
    setShowShipmentModal(false);
    setSelectedOrder(null);
    setShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' });
    setShowCustomPartnerInput(false);
    setSelectedItemsForShip([]);
  };

  // ── Deliver handler ───────────────────────────────────────
  const handleUpdateDeliverWrapper = async () => {
    if (!selectedOrder?.order_id || selectedItemsForDeliver.length === 0) {
      showAlert('Please select at least one item to mark as delivered', 'warning'); return;
    }
    await handleUpdateDeliver(selectedOrder.order_id, selectedItemsForDeliver);
    setShowDeliverModal(false);
    setSelectedOrder(null);
    setSelectedItemsForDeliver([]);
  };

  // ── Cancel handler ────────────────────────────────────────
  const handleCancelSubmit = async () => {
    if (!selectedOrder || !cancelReason || selectedItemsForCancel.length === 0) return;
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      for (const itemId of selectedItemsForCancel) {
        await updateOrderItemStatus({ action: 'cancel_item', orderItemId: itemId, reason: cancelReason, isAdmin: true, adminUserId: user?.id });
      }
      showAlert('Order items cancelled successfully', 'success');
      setShowCancelModal(false);
      setCancelReason('');
      setCancelComments('');
      setSelectedItemsForCancel([]);
      await fetchOrders();
    } catch (err) {
      showAlert(`Failed to cancel order: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  // ── Refund handler ────────────────────────────────────────
  const handleConfirmRefund = async () => {
    if (!selectedOrder) return;
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      const useEff = selectedOrder.order_items?.length === 1 && selectedOrder.effective_amount;

      if (selectedItemForAction) {
        const amt = refundType === 'partial'
          ? parseFloat(refundAmount)
          : useEff ? selectedOrder.effective_amount!
          : toNumber(selectedItemForAction.price_at_purchase) * (selectedItemForAction.quantity || 1);
        await updateOrderItemStatus({
          action: 'refund_item', orderItemId: selectedItemForAction.order_item_id,
          reason: 'Admin initiated refund',
          refund_amount: refundType === 'partial' ? parseFloat(refundAmount) : amt,
          refund_type: refundType, isAdmin: true, adminUserId: user?.id,
        });
      } else {
        const refundable = (selectedOrder.order_items ?? []).filter(
          (i) => ['cancelled', 'delivered'].includes(i.item_status ?? '') && i.item_status !== 'refunded',
        );
        for (const item of refundable) {
          const amt = refundType === 'partial'
            ? parseFloat(refundAmount) / refundable.length
            : useEff ? selectedOrder.effective_amount!
            : toNumber(item.price_at_purchase) * (item.quantity || 1);
          await updateOrderItemStatus({
            action: 'refund_item', orderItemId: item.order_item_id,
            reason: 'Admin initiated refund', refund_amount: amt,
            refund_type: refundType, isAdmin: true, adminUserId: user?.id,
          });
        }
      }
      showAlert('Refund processed successfully', 'success');
      setShowRefundModal(false);
      setSelectedItemForAction(null);
      setRefundType('full');
      setRefundAmount('');
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const map: Record<string, string> = {
        'Razorpay refund failed': 'Razorpay refund failed. Please check credentials and try again.',
        'Missing Razorpay payment ID': 'Razorpay payment ID not found for this order.',
        'COD refund allowed only after delivery': 'COD refunds are only allowed for delivered items.',
        'Refund not supported for this payment method': 'Refunds are not supported for this payment method.',
        'Partial refund cannot exceed item price': 'Partial refund amount cannot exceed the item price.',
        'refund_amount required for partial refund': 'Refund amount is required for partial refunds.',
      };
      const friendly = Object.entries(map).find(([k]) => msg.includes(k))?.[1]
        ?? `Failed to process refund: ${msg}`;
      showAlert(friendly, 'error');
    }
  };

  // ── Replacement handlers ──────────────────────────────────
  const handleDeliverReplacement = async (item: OrderItem) => {
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      await updateOrderItemStatus({ action: 'deliver_replacement', orderItemId: item.order_item_id, isAdmin: true, adminUserId: user?.id });
      showAlert('Replacement marked as delivered', 'success');
      fetchOrders();
    } catch { showAlert('Failed to deliver replacement', 'error'); }
  };

  const handleMarkReplacementReturned = async (item: OrderItem) => {
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      await updateOrderItemStatus({ action: 'mark_replacement_returned', orderItemId: item.order_item_id, isAdmin: true, adminUserId: user?.id });
      showAlert('Replacement completed successfully', 'success');
      fetchOrders();
    } catch { showAlert('Failed to complete replacement', 'error'); }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('user_profiles').select('role, first_name').eq('user_id', user.id).single();
      if (profile) useAuthStore.getState().setRole(profile.role);
    } catch { /* silent */ }
  };

  // ── Invoice PDF download ──────────────────────────────────
  /**
   * Converts the admin Order to InvoiceData using generateInvoiceFromAdminOrder
   * (which correctly uses effective_amount as the GST base at 5 %), then calls
   * downloadInvoicePdf to produce a real .pdf file via html2canvas + jsPDF.
   *
   * Visible for ALL order statuses — admins can download at any time.
   */
  const handleDownloadInvoice = useCallback(async (order: Order) => {
    if (downloadingInvoiceId === order.order_id) return;
    setDownloadingInvoiceId(order.order_id);
    try {
      // Cast to AdminOrderForInvoice — the shapes are structurally compatible
      const invoice = generateInvoiceFromAdminOrder(order as Parameters<typeof generateInvoiceFromAdminOrder>[0]);
      await downloadInvoicePdf(invoice);
      // showSuccessAlert is called inside downloadInvoicePdf
    } catch {
      showAlert('Failed to generate invoice PDF. Please try again.', 'error');
    } finally {
      setDownloadingInvoiceId(null);
    }
  }, [downloadingInvoiceId, showAlert]);

  // ── Packaging Label PDF download ───────────────────────────
  /**
   * Converts the admin Order to InvoiceData using generateInvoiceFromAdminOrder,
   * then calls downloadPackagingLabelPdf to produce a packaging label PDF.
   *
   * Visible for ALL order statuses — admins can download at any time.
   */
  const handlePrintPackaging = useCallback(async (order: Order) => {
    try {
      // Cast to AdminOrderForInvoice — the shapes are structurally compatible
      const invoice = generateInvoiceFromAdminOrder(order as Parameters<typeof generateInvoiceFromAdminOrder>[0]);
      await downloadPackagingLabelPdf(invoice);
      showAlert('Packaging label generated successfully', 'success');
    } catch {
      showAlert('Failed to generate packaging label. Please try again.', 'error');
    }
  }, [showAlert]);

  // ── Stats ─────────────────────────────────────────────────
  const getOrderStats = () => ({
    total:     orders.length,
    pending:   orders.filter((o) => o.status === 'pending').length,
    paid:      orders.filter((o) => o.status === 'paid').length,
    shipped:   orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  });

  // ── Action states per order ───────────────────────────────
  const orderActionStates: OrderActionStateEntry[] = useMemo(() => orders.map((order) => {
    const orderItems = (order.order_items ?? []).map((item) => ({
      ...item,
      order_item_id:    item.order_item_id ?? item.product_id ?? '',
      item_status:      item.item_status   ?? 'pending',
      product_name:     item.product_name  ?? item.name ?? 'Product',
      size:             item.size          ?? 'N/A',
      quantity:         item.quantity      ?? 1,
      price_at_purchase: toNumber(item.price_at_purchase),
      thumbnail_url:    transformImageUrl(item.thumbnail_url ?? item.product_thumbnail_url ?? ''),
    } as OrderItem));

    const actionStates: OrderActionFlags = {
      canShip:    orderItems.some((i) => i.item_status === 'pending'),
      canCancel:  orderItems.some((i) => canCancelOrderItem(i)),
      canDeliver: orderItems.some((i) => i.item_status === 'shipped'),
    };
    return { orderId: order.order_id, actionStates, orderItems };
  }), [orders]);

  // ── Side effects ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<'orders' | 'returns'>).detail;
      if (detail === 'orders' || detail === 'returns') setActiveTab(detail);
    };
    window.addEventListener('admin-tab-change', handler as EventListener);
    return () => window.removeEventListener('admin-tab-change', handler as EventListener);
  }, []);

  useEffect(() => {
    if (isAdmin) { fetchOrders(currentPage, statusFilter, searchTerm); if (activeTab === 'returns') fetchReturns(); }
  }, [isAdmin, activeTab, currentPage, statusFilter, searchTerm, fetchOrders, fetchReturns]);

  useEffect(() => { if (error) showAlert(error, 'error'); }, [error, showAlert]);

  useEffect(() => {
    if (success && !success.includes('marked as delivered') && !success.includes('completed successfully') && !success.includes('processed successfully')) {
      showAlert(success, 'success');
    }
  }, [success, showAlert]);

  // ── Guard ─────────────────────────────────────────────────
  if (!isAdmin) {
    return <AccessDenied user={user} role={role} authType={authType} refreshUserProfile={refreshUserProfile} />;
  }

  const handleRefresh = () => {
    fetchOrders(currentPage, statusFilter, searchTerm);
    if (activeTab === 'returns') fetchReturns();
  };

  const openRefundModal = (order: Order, item?: OrderItem) => {
    setSelectedOrder(order);
    setSelectedItemForAction(item ?? null);
    setRefundType('full');
    setRefundAmount('');
    setShowRefundModal(true);
  };

  const openEditShippingModal = (item: OrderItem) => {
    setSelectedItemForEditShipping(item);
    setEditShipmentForm({
      shipping_partner: item.shipping_partner || '',
      tracking_id: item.tracking_id || '',
      tracking_url: item.tracking_url || '',
    });
    setShowCustomPartnerInputForEdit(
      item.shipping_partner && !['stcourier', 'professional', 'dtdc', 'india_post', 'shree_maruti'].includes(item.shipping_partner.toLowerCase())
    );
    setShowEditShippingModal(true);
  };

  const handleUpdateItemShipmentWrapper = async () => {
    if (!selectedItemForEditShipping?.order_item_id) {
      showAlert('Please select an item to update', 'warning');
      return;
    }
    const partnerInvalid = showCustomPartnerInputForEdit
      ? !editShipmentForm.shipping_partner || editShipmentForm.shipping_partner === 'other' || !editShipmentForm.shipping_partner.trim()
      : !editShipmentForm.shipping_partner;
    if (partnerInvalid || !editShipmentForm.tracking_id) {
      showAlert('Please enter shipping partner and tracking ID', 'warning');
      return;
    }
    await handleUpdateItemShipment(selectedItemForEditShipping.order_item_id, editShipmentForm);
    setShowEditShippingModal(false);
    setSelectedItemForEditShipping(null);
    setEditShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' });
    setShowCustomPartnerInputForEdit(false);
  };

  const stats = getOrderStats();
  const isLoadingCurrentTab = (ordersLoading && activeTab === 'orders') || (returnsLoading && activeTab === 'returns');

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-dark1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <AdminHeader activeTab={activeTab} onRefresh={handleRefresh} />

          {isLoadingCurrentTab ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading...</p>
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="space-y-6">
              <OrderStatsSummary stats={stats} />
              <OrderFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              <div className="text-sm text-gray-600 dark:text-gray-400">Showing {orders.length} orders</div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">No orders available.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => {
                    const actionState = orderActionStates.find((s) => s.orderId === order.order_id);
                    return (
                      <OrderCard
                        key={order.order_id}
                        order={order as Order}
                        actionStates={actionState?.actionStates}
                        downloadingInvoiceId={downloadingInvoiceId}
                        onView={(o)   => { setSelectedOrder(o); setShowOrderModal(true); }}
                        onShip={(o)   => { setSelectedOrder(o); setShowShipmentModal(true); }}
                        onCancel={(o) => { setSelectedOrder(o); setSelectedItemsForCancel([]); setCancelReason(''); setShowCancelModal(true); }}
                        onDeliver={(o)=> { setSelectedOrder(o); setShowDeliverModal(true); }}
                        onRefundItem={(item) => openRefundModal(order as Order, item)}
                        onRefundOrder={(o)   => openRefundModal(o)}
                        onDeliverReplacement={handleDeliverReplacement}
                        onMarkReturned={handleMarkReplacementReturned}
                        onDownloadInvoice={handleDownloadInvoice}
                        onPrintPackaging={handlePrintPackaging}
                        onEditShipping={openEditShippingModal}
                      />
                    );
                  })}
                </div>
              )}

              <OrdersPagination currentPage={currentPage} totalPages={totalPages} loading={ordersLoading} setPage={setOrdersPage} />
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
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}

      {showOrderModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onUpdateStatus={updateOrderStatus}
          onShipOrder={(o) => { setSelectedOrder(o); setShowShipmentModal(true); }}
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
          onOpenRefundModal={(o) => openRefundModal(o)}
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
        onClose={() => { setShowShipmentModal(false); setSelectedItemsForShip([]); }}
        onSubmit={handleUpdateShipmentWrapper}
        processingAction={processingAction}
      />

      <DeliverModal
        isOpen={showDeliverModal}
        order={selectedOrder}
        selectedItemsForDeliver={selectedItemsForDeliver}
        setSelectedItemsForDeliver={setSelectedItemsForDeliver}
        onClose={() => { setShowDeliverModal(false); setSelectedItemsForDeliver([]); }}
        onSubmit={handleUpdateDeliverWrapper}
        processingAction={processingAction}
      />

      <EditShippingModal
        isOpen={showEditShippingModal}
        item={selectedItemForEditShipping}
        shipmentForm={editShipmentForm}
        setShipmentForm={setEditShipmentForm}
        showCustomPartnerInput={showCustomPartnerInputForEdit}
        setShowCustomPartnerInput={setShowCustomPartnerInputForEdit}
        onClose={() => { setShowEditShippingModal(false); setSelectedItemForEditShipping(null); setEditShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' }); setShowCustomPartnerInputForEdit(false); }}
        onSubmit={handleUpdateItemShipmentWrapper}
        processingAction={processingAction}
      />

      <RefundModal
        isOpen={showRefundModal}
        order={selectedOrder}
        selectedItemForAction={selectedItemForAction}
        refundType={refundType}
        setRefundType={setRefundType}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        processingAction={processingAction}
        user={user}
        onClose={() => setShowRefundModal(false)}
        onConfirmRefund={handleConfirmRefund}
      />

      <CancelItemsModal
        isOpen={showCancelModal}
        order={selectedOrder}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        cancelComments={cancelComments}
        setCancelComments={setCancelComments}
        selectedItemsForCancel={selectedItemsForCancel}
        setSelectedItemsForCancel={setSelectedItemsForCancel}
        onClose={() => { setShowCancelModal(false); setCancelReason(''); setCancelComments(''); setSelectedItemsForCancel([]); }}
        onSubmit={handleCancelSubmit}
        setAlertModal={setAlertModal}
      />

      <ConfirmActionModal
        confirmAction={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => { if (confirmAction) { updateOrderStatus(confirmAction.orderId, confirmAction.action); setConfirmAction(null); } }}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
      />
    </>
  );
};

export default AdminOrderDashboard;