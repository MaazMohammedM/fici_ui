import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package } from 'lucide-react';
import { useAdminStore } from '../../../features/admin/store/adminStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import ReturnsManagementTab from './ReturnsManagementTab';
import { printInvoice, generateInvoiceNumber, type InvoiceData, type InvoiceItem } from '../../../utils/invoiceUtils';
import AlertModal from '../../../components/ui/AlertModal';

import type {
  Order,
  OrderItem,
  OrderActionFlags,
} from '../../../types/order-common';
import type {
  OrderActionStateEntry,
  AlertModalState,
  ShipmentFormState,
  ConfirmActionState,
} from '../../../types/adminOrders';

// UI primitives
import {
  AccessDenied,
  AdminHeader,
  OrderStatsSummary,
  OrderFilters,
  OrdersPagination,
  ConfirmActionModal,
} from '../../../components/admin/orders/AdminOrderUIComponents';

// Feature components
import { OrderCard } from '../../../components/admin/orders/OrderCard';
import { OrderDetailsModal } from '../../../components/admin/orders/OrderDetailsModal';
import { ShipmentModal, DeliverModal } from '../../../components/admin/orders/ShipmentDeliverModals';
import { CancelItemsModal } from '../../../components/admin/orders/CancelItemsModal';
import { RefundModal } from '../../../components/admin/orders/RefundModal';

import { isShippingAddress, canCancelOrderItem } from '../../../utils/adminOrderUtils';

/* =========================================================
   Main AdminOrderDashboard
   ========================================================= */
const AdminOrderDashboard: React.FC = () => {
  // ── Tab / modal visibility state ──────────────────────────
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ── Cancel state ───────────────────────────────────────────
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [selectedItemsForCancel, setSelectedItemsForCancel] = useState<string[]>([]);

  // ── Refund state ───────────────────────────────────────────
  const [selectedItemForAction, setSelectedItemForAction] = useState<OrderItem | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');

  // ── Confirm dialog state ───────────────────────────────────
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);

  // ── Shipment form state ────────────────────────────────────
  const [shipmentForm, setShipmentForm] = useState<ShipmentFormState>({
    shipping_partner: '',
    tracking_id: '',
    tracking_url: '',
  });
  const [showCustomPartnerInput, setShowCustomPartnerInput] = useState(false);
  const [selectedItemsForShip, setSelectedItemsForShip] = useState<string[]>([]);
  const [selectedItemsForDeliver, setSelectedItemsForDeliver] = useState<string[]>([]);

  // ── Alert modal state ──────────────────────────────────────
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  // ── Auth ───────────────────────────────────────────────────
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const authType = useAuthStore((state) => state.authType);

  // ── Admin store ────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────
  const showAlert = useCallback(
    (message: string, type: AlertModalState['type'] = 'info') => {
      setAlertModal({ isOpen: true, message, type });
    },
    []
  );

  const isAdmin = role === 'admin' || user?.role === 'admin';

  // ── Action handlers ────────────────────────────────────────
  const handleUpdateShipmentWrapper = async () => {
    if (!selectedOrder?.order_id || selectedItemsForShip.length === 0) {
      showAlert('Please select at least one item to ship', 'warning');
      return;
    }
    const partnerInvalid = showCustomPartnerInput
      ? !shipmentForm.shipping_partner ||
        shipmentForm.shipping_partner === 'other' ||
        shipmentForm.shipping_partner.trim() === ''
      : !shipmentForm.shipping_partner;

    if (partnerInvalid || !shipmentForm.tracking_id) {
      showAlert('Please enter shipping partner and tracking ID', 'warning');
      return;
    }

    await handleUpdateShipment(selectedOrder.order_id, selectedItemsForShip, shipmentForm);
    setShowShipmentModal(false);
    setSelectedOrder(null);
    setShipmentForm({ shipping_partner: '', tracking_id: '', tracking_url: '' });
    setShowCustomPartnerInput(false);
    setSelectedItemsForShip([]);
  };

  const handleUpdateDeliverWrapper = async () => {
    if (!selectedOrder?.order_id || selectedItemsForDeliver.length === 0) {
      showAlert('Please select at least one item to mark as delivered', 'warning');
      return;
    }
    await handleUpdateDeliver(selectedOrder.order_id, selectedItemsForDeliver);
    setShowDeliverModal(false);
    setSelectedOrder(null);
    setSelectedItemsForDeliver([]);
  };

  const handleCancelSubmit = async () => {
    if (!selectedOrder || !cancelReason || selectedItemsForCancel.length === 0) return;
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      for (const itemId of selectedItemsForCancel) {
        await updateOrderItemStatus({
          action: 'cancel_item',
          orderItemId: itemId,
          reason: cancelReason,
          isAdmin: true,
          adminUserId: user?.id,
        });
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

  const handleConfirmRefund = async () => {
    if (!selectedOrder) return;
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      const useEffectiveAmount = selectedOrder.order_items?.length === 1 && selectedOrder.effective_amount;

      if (selectedItemForAction) {
        const calculatedAmount =
          refundType === 'partial'
            ? parseFloat(refundAmount)
            : useEffectiveAmount
            ? selectedOrder.effective_amount!
            : (selectedItemForAction.price_at_purchase || 0) * (selectedItemForAction.quantity || 1);

        await updateOrderItemStatus({
          action: 'refund_item',
          orderItemId: selectedItemForAction.order_item_id,
          reason: 'Admin initiated refund',
          refund_amount: refundType === 'partial' ? parseFloat(refundAmount) : calculatedAmount,
          refund_type: refundType,
          isAdmin: true,
          adminUserId: user?.id,
        });
      } else {
        const refundableItems = selectedOrder.order_items?.filter(
          (item) =>
            ['cancelled', 'delivered'].includes(item.item_status || '') &&
            item.item_status !== 'refunded'
        ) ?? [];

        for (const item of refundableItems) {
          const itemAmount =
            refundType === 'partial'
              ? parseFloat(refundAmount) / refundableItems.length
              : useEffectiveAmount
              ? selectedOrder.effective_amount!
              : (item.price_at_purchase || 0) * (item.quantity || 1);

          await updateOrderItemStatus({
            action: 'refund_item',
            orderItemId: item.order_item_id,
            reason: 'Admin initiated refund',
            refund_amount: itemAmount,
            refund_type: refundType,
            isAdmin: true,
            adminUserId: user?.id,
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('Razorpay refund failed')) {
        showAlert('Razorpay refund failed. Please check credentials and try again.', 'error');
      } else if (message.includes('Missing Razorpay payment ID')) {
        showAlert('Razorpay payment ID not found for this order. Cannot process refund.', 'error');
      } else if (message.includes('COD refund allowed only after delivery')) {
        showAlert('COD refunds are only allowed for delivered items.', 'error');
      } else if (message.includes('Refund not supported for this payment method')) {
        showAlert('Refunds are not supported for this payment method.', 'error');
      } else if (message.includes('Partial refund cannot exceed item price')) {
        showAlert('Partial refund amount cannot exceed the item price.', 'error');
      } else if (message.includes('refund_amount required for partial refund')) {
        showAlert('Refund amount is required for partial refunds.', 'error');
      } else {
        showAlert(`Failed to process refund: ${message}`, 'error');
      }
    }
  };

  const handleDeliverReplacement = async (item: OrderItem) => {
    try {
      const { updateOrderItemStatus } = await import('../../../lib/orderActions');
      await updateOrderItemStatus({
        action: 'deliver_replacement',
        orderItemId: item.order_item_id,
        isAdmin: true,
        adminUserId: user?.id,
      });
      showAlert('Replacement marked as delivered', 'success');
      fetchOrders();
    } catch {
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
        adminUserId: user?.id,
      });
      showAlert('Replacement completed successfully', 'success');
      fetchOrders();
    } catch {
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
    } catch {
      // silent
    }
  };

  // ── Invoice ────────────────────────────────────────────────
  const generateInvoiceFromOrder = (order: Order): InvoiceData => {
    const invoiceItems: InvoiceItem[] = order.order_items.map((item, index) => {
      const articleId = item.thumbnail_url
        ? item.thumbnail_url.split('/').slice(-2)[0]
        : item.product_id?.slice(0, 8) || 'N/A';
      return {
        id: item.order_item_id || index.toString(),
        name: item.product_name || 'Product',
        description: `Article ID: ${articleId}${item.size ? ` | Size: ${item.size}` : ''}`,
        quantity: item.quantity || 1,
        price: parseFloat(item.price_at_purchase?.toString() || '0'),
        total: parseFloat(item.price_at_purchase?.toString() || '0') * (item.quantity || 1),
      };
    });

    const subtotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);

    const getCustomerName = (): string => {
      if (!order.shipping_address) return order.guest_email?.split('@')[0] || 'Customer';
      if (typeof order.shipping_address === 'string') {
        try {
          const parsed = JSON.parse(order.shipping_address);
          if (parsed?.name) return parsed.name;
        } catch { /* ignore */ }
      } else if (isShippingAddress(order.shipping_address) && order.shipping_address.name) {
        return order.shipping_address.name;
      }
      return order.guest_email?.split('@')[0] || 'Customer';
    };

    return {
      id: order.order_id,
      invoiceNumber: generateInvoiceNumber(),
      date: order.order_date || '',
      customer: {
        name: getCustomerName(),
        email: order.guest_email || '',
        phone: order.guest_phone || '',
        address: (() => {
          if (!order.shipping_address) return '';
          if (typeof order.shipping_address === 'string') {
            try {
              const parsed = JSON.parse(order.shipping_address);
              if (parsed && typeof parsed === 'object') {
                return `${parsed.address || ''}, ${parsed.city || ''}, ${parsed.state || ''} - ${parsed.pincode || ''}`;
              }
            } catch { /* ignore */ }
            return order.shipping_address;
          }
          if (isShippingAddress(order.shipping_address)) {
            return `${order.shipping_address.address || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} - ${order.shipping_address.pincode || ''}`;
          }
          return '';
        })(),
      },
      items: invoiceItems,
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      status: order.payment_status === 'paid' ? 'paid' : 'pending',
      notes: `Order ID: ${order.order_id}\nPayment Method: ${order.payment_method}\nPayment Status: ${order.payment_status}`,
    };
  };

  const handlePrintInvoice = async (order: Order) => {
    try {
      const invoice = generateInvoiceFromOrder(order);
      const result = await printInvoice(invoice);
      const messages: Record<string, string> = {
        printed: 'Invoice printed successfully',
        cancelled: 'Print cancelled',
        downloaded: 'Invoice downloaded successfully',
        share_intent: 'Invoice shared successfully',
        failed: 'Failed to print invoice',
      };
      showAlert(messages[result.action] ?? 'Print operation completed', result.action === 'failed' ? 'error' : 'success');
    } catch {
      showAlert('Failed to print invoice', 'error');
    }
  };

  // ── Computed values ────────────────────────────────────────
  const getOrderStats = () => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  });

  const orderActionStates: OrderActionStateEntry[] = useMemo(() => {
    return orders.map((order) => {
      const orderItems = (order.order_items || []).map(
        (item) =>
          ({
            ...item,
            order_item_id: item.order_item_id || item.product_id || '',
            item_status: item.item_status || 'pending',
            product_name: item.product_name || item.name || 'Product',
            size: item.size || 'N/A',
            quantity: item.quantity || 1,
            price_at_purchase: item.price_at_purchase || 0,
            thumbnail_url: item.thumbnail_url || item.product_thumbnail_url || '',
          } as OrderItem)
      );

      const actionStates: OrderActionFlags = {
        canShip: orderItems.some((item) => item.item_status === 'pending'),
        canCancel: orderItems.some((item) => canCancelOrderItem(item)),
        canDeliver: orderItems.some((item) => item.item_status === 'shipped'),
      };

      return { orderId: order.order_id, actionStates, orderItems };
    });
  }, [orders]);

  // ── Side effects ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<'orders' | 'returns'>).detail;
      if (detail === 'orders' || detail === 'returns') setActiveTab(detail);
    };
    window.addEventListener('admin-tab-change', handler as EventListener);
    return () => window.removeEventListener('admin-tab-change', handler as EventListener);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders(currentPage, statusFilter, searchTerm);
      if (activeTab === 'returns') fetchReturns();
    }
  }, [isAdmin, activeTab, currentPage, statusFilter, searchTerm, fetchOrders, fetchReturns]);

  useEffect(() => {
    if (error) showAlert(error, 'error');
  }, [error, showAlert]);

  useEffect(() => {
    if (
      success &&
      !success.includes('marked as delivered') &&
      !success.includes('completed successfully') &&
      !success.includes('processed successfully')
    ) {
      showAlert(success, 'success');
    }
  }, [success, showAlert]);

  // ── Guard ──────────────────────────────────────────────────
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

  const openRefundModal = (order: Order, item?: OrderItem) => {
    setSelectedOrder(order);
    setSelectedItemForAction(item ?? null);
    setRefundType('full');
    setRefundAmount('');
    setShowRefundModal(true);
  };

  const stats = getOrderStats();
  const isLoadingCurrentTab =
    (ordersLoading && activeTab === 'orders') ||
    (returnsLoading && activeTab === 'returns');

  // ── Render ─────────────────────────────────────────────────
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
                        onView={(o) => { setSelectedOrder(o); setShowOrderModal(true); }}
                        onShip={(o) => { setSelectedOrder(o); setShowShipmentModal(true); }}
                        onCancel={(o) => {
                          setSelectedOrder(o);
                          setSelectedItemsForCancel([]);
                          setCancelReason('');
                          setShowCancelModal(true);
                        }}
                        onDeliver={(o) => { setSelectedOrder(o); setShowDeliverModal(true); }}
                        onRefundItem={(item) => openRefundModal(order as Order, item)}
                        onRefundOrder={(o) => openRefundModal(o)}
                        onDeliverReplacement={handleDeliverReplacement}
                        onMarkReturned={handleMarkReplacementReturned}
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
      </div>

      {/* ── Modals ── */}

      {showOrderModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onUpdateStatus={updateOrderStatus}
          onShipOrder={(order) => { setSelectedOrder(order); setShowShipmentModal(true); }}
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
          onOpenRefundModal={(order) => openRefundModal(order)}
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
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
          setCancelComments('');
          setSelectedItemsForCancel([]);
        }}
        onSubmit={handleCancelSubmit}
        setAlertModal={setAlertModal}
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
