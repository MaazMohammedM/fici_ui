import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import { Package, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import ReturnRequest from './ReturnRequest';

interface OrderItem {
  order_item_id: string;
  product_name: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  mrp: number;
  thumbnail_url: string;
}

interface Order {
  order_id: string;
  order_date: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'cod' | 'razorpay';
  total_amount: number;
  subtotal: number;
  mrp_total?: number;
  discount: number;
  prepaid_discount?: number;
  delivery_charge: number;
  cod_fee: number;
  shipping_address: any;
  order_type: 'guest' | 'registered';
  guest_email?: string;
  guest_phone?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipping_partner?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  order_items: OrderItem[];
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestSession = useAuthStore((state) => state.guestSession);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user type
      if (user) {
        query = query.eq('user_id', user.id);
      } else if (isGuest && guestSession?.guest_session_id) {
        query = query.eq('guest_session_id', guestSession.guest_session_id);
      } else {
        setError('Please sign in to view your orders');
        return;
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        return;
      }

      setOrders(data || []);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancellingOrder(orderId);

      const { error } = await supabase.functions.invoke('cancel-order', 
        {
        body: {
          order_id: orderId,
          user_id: user?.id,
          guest_session_id: guestSession?.guest_session_id
        } 
      });

      if (error) throw error;

      // Refresh orders list
      await fetchOrders();
      alert('Order cancelled successfully');
    } catch (err: any) {
      alert(`Failed to cancel order: ${err.message}`);
    } finally {
      setCancellingOrder(null);
    }
  };

  const canReturnOrder = (order: Order) => {
    return order.status === 'delivered' &&
           order.delivered_at &&
           (new Date().getTime() - new Date(order.delivered_at).getTime()) <= (3 * 24 * 60 * 60 * 1000);
  };

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending' || order.status === 'paid';
  };

  const openReturnModal = (order: Order) => {
    setSelectedOrderForReturn(order);
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedOrderForReturn(null);
  };

  const handleReturnSuccess = () => {
    closeReturnModal();
    fetchOrders(); // Refresh the orders list
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'paid': return 'text-green-600 bg-green-50';
      case 'shipped': return 'text-blue-600 bg-blue-50';
      case 'delivered': return 'text-green-700 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, isGuest, guestSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-active"
        >
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
        <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
        <a href="/products" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-active inline-block">
          Start Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Orders</h2>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-primary hover:text-primary-active"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.order_id} className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
            {/* Order Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(order.status)}
                <div>
                  <p className="font-semibold">Order #{order.order_id.slice(-8)}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.order_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <p className="font-medium mb-2">Items:</p>
              <div className="space-y-2">
                {order.order_items.slice(0, 2).map((item) => {
                  const itemMrp = item.mrp || item.price_at_purchase * 1.1; // Fallback if MRP is not available
                  const itemSavings = itemMrp - item.price_at_purchase;
                  
                  return (
                    <div key={item.order_item_id} className="flex items-start gap-3">
                      <img
                        src={item.thumbnail_url}
                        alt={item.product_name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-600">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                        <div className="mt-1">
                          <span className="text-sm font-medium">₹{item.price_at_purchase.toFixed(2)}</span>
                          {itemSavings > 0 && (
                            <span className="ml-2 text-xs text-gray-500 line-through">
                              ₹{itemMrp.toFixed(2)}
                            </span>
                          )}
                          {itemSavings > 0 && (
                            <span className="ml-2 text-xs text-green-600">
                              Saved ₹{itemSavings.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {order.order_items.length > 2 && (
                  <p className="text-sm text-gray-600">+{order.order_items.length - 2} more items</p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 dark:bg-dark3 rounded-lg p-4 mb-4">
              {/* MRP and Savings */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total MRP</span>
                  <span className="text-sm">
                    ₹{order.mrp_total ? order.mrp_total.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 
                      (order.subtotal + (order.discount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {/* Discounts */}
                {(order.discount > 0 || order.prepaid_discount > 0) && (
                  <div className="space-y-1">
                    {order.discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Discount</span>
                        <span className="text-sm text-green-600">
                          -₹{order.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                                 <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm">₹{order.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>     
                    {order.prepaid_discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Prepaid Discount</span>
                        <span className="text-sm text-green-600">
                          -₹{order.prepaid_discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 space-y-2">

                  
                  {order.cod_fee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-600">COD Fee</span>
                      <span className="text-sm text-orange-600">
                        ₹{order.cod_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivery</span>
                    <span className="text-sm">
                      {order.delivery_charge > 0 
                        ? `₹${order.delivery_charge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                        : 'Free'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span>₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {(order.tracking_id || order.shipping_partner) && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Tracking Information</p>
                {order.shipping_partner && (
                  <p className="text-sm text-blue-600 dark:text-blue-300">Partner: {order.shipping_partner}</p>
                )}
                {order.tracking_id && (
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Tracking ID: {order.tracking_id}
                  </p>
                )}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary-active underline"
                  >
                    Track Package →
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {canCancelOrder(order) && (
                <button
                  onClick={() => cancelOrder(order.order_id)}
                  disabled={cancellingOrder === order.order_id}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {cancellingOrder === order.order_id ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}

              {canReturnOrder(order) && (
                <button
                  onClick={() => openReturnModal(order)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Request Return
                </button>
              )}

              {order.status === 'shipped' && order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  Track Package
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Return Request Modal */}
      {showReturnModal && selectedOrderForReturn && selectedOrderForReturn.delivered_at && (
        <ReturnRequest
          order={{
            order_id: selectedOrderForReturn.order_id,
            order_items: selectedOrderForReturn.order_items,
            delivered_at: selectedOrderForReturn.delivered_at,
            status: selectedOrderForReturn.status
          }}
          onClose={closeReturnModal}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
};

export default OrderList;
