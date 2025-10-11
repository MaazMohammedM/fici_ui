import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Truck, CheckCircle, XCircle, Clock, Package, ArrowLeft } from 'lucide-react';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';

interface OrderItem {
  order_item_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  thumbnail_url: string;
  product_name: string;
  product_thumbnail_url: string;
  mrp?: number;
  color?: string;
}

interface OrderDetails {
  order_id: string;
  order_date: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  payment_method: string;
  payment_status: string;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
  };
  items: OrderItem[];
  guest_email?: string;
  guest_phone?: string;
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
}

const OrderDetailsPage = ({ isGuest = false }: { isGuest?: boolean }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderDetails | null>(null);

  const { user, isGuest: isGuestUser, guestSession } = useAuthStore();
  const { fetchOrderById, updateOrderStatus, loading: storeLoading, error: storeError } = useOrderStore();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setIsLoading(true);

        // Use orderStore API to fetch order
        let email, phone, tpin;
        if (isGuest) {
          email = searchParams.get('email') || undefined;
          tpin = searchParams.get('tpin') || undefined;
        }

        const orderData = await fetchOrderById(orderId, email, phone, tpin);

        if (!orderData) {
          throw new Error('Order not found or access denied');
        }

        // Transform order data to match our interface
        const transformedOrder: OrderDetails = {
          order_id: orderData.id,
          order_date: orderData.order_date || orderData.created_at || '',
          status: orderData.status as OrderDetails['status'],
          total_amount: orderData.total_amount,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          delivery_charge: orderData.delivery_charge,
          payment_method: orderData.payment_method || '',
          payment_status: orderData.payment_status,
          shipping_address: orderData.shipping_address as OrderDetails['shipping_address'],
          items: Array.isArray(orderData.items) ? orderData.items as OrderItem[] : [],
          guest_email: orderData.guest_email,
          guest_phone: orderData.guest_phone,
          shipping_partner: orderData.tracking_number, // Map tracking_number to shipping_partner for display
          tracking_id: orderData.tracking_number,
          tracking_url: orderData.tracking_url,
          shipped_at: orderData.shipped_at,
          delivered_at: orderData.delivered_at,
        };

        setOrder(transformedOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
        console.error('Error fetching order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isGuest, searchParams, fetchOrderById]);

  const cancelOrder = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingOrder(true);

      // Use orderStore API to cancel order
      await updateOrderStatus(order.order_id, 'cancelled');

      // Update local state
      setOrder({ ...order, status: 'cancelled' });

      alert('Order cancelled successfully');
    } catch (err) {
      alert(`Failed to cancel order: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error cancelling order:', err);
    } finally {
      setCancellingOrder(false);
    }
  };

  const canCancelOrder = (order: OrderDetails) => {
    return order.status === 'pending' || order.status === 'paid';
  };

  const canReturnOrder = (order: OrderDetails) => {
    return order.status === 'delivered' &&
           order.delivered_at &&
           (new Date().getTime() - new Date(order.delivered_at).getTime()) <= (3 * 24 * 60 * 60 * 1000); // 3 days
  };

  const openReturnModal = (order: OrderDetails) => {
    setSelectedOrderForReturn(order);
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedOrderForReturn(null);
  };

  const handleReturnSuccess = () => {
    closeReturnModal();
    // Refresh order data
    window.location.reload();
  };

  if (isLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || storeError) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || storeError}</p>
              <div className="mt-4">
                <Link
                  to={isGuest ? '/guest/orders' : '/orders'}
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  &larr; Back to {isGuest ? 'Order Lookup' : 'Order History'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-gray-600 mb-4">We couldn't find an order with that ID.</p>
          <Link
            to={isGuest ? '/guest/orders' : '/orders'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to {isGuest ? 'Order Lookup' : 'Order History'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to={isGuest ? '/guest/orders' : '/orders'}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {isGuest ? 'Order Lookup' : 'Order History'}
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_id.split('-')[0]}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Placed on {new Date(order.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>

                {/* Action Buttons */}
                {!isGuest && !isGuestUser && (
                  <div className="flex gap-2">
                    {canCancelOrder(order) && (
                      <button
                        onClick={cancelOrder}
                        disabled={cancellingOrder}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    {canReturnOrder(order) && (
                      <button
                        onClick={() => openReturnModal(order)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Request Return
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Tracking Section */}
          {(order.status === 'shipped' || order.status === 'delivered') && (order.tracking_id || order.shipping_partner) && (
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Shipment Tracking
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {order.shipping_partner && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Shipping Partner</h3>
                    <p className="mt-1 text-sm text-gray-600">{order.shipping_partner}</p>
                  </div>
                )}
                {order.tracking_id && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Tracking ID</h3>
                    <p className="mt-1 text-sm text-gray-600 font-mono">{order.tracking_id}</p>
                  </div>
                )}
                {order.tracking_url && (
                  <div className="md:col-span-2">
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      Track Package
                    </a>
                  </div>
                )}
                {order.shipped_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Shipped On</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(order.shipped_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {order.delivered_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Delivered On</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(order.delivered_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Order Items
            </h2>
            <div className="space-y-6">
              {order.items.map((item) => (
                <div key={item.order_item_id} className="flex items-start border-b border-gray-100 pb-4">
                  <img
                    src={item.product_thumbnail_url || item.thumbnail_url}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                    <div className="mt-1 space-y-1">
                      {item.size && (
                        <p className="text-sm text-gray-500">Size: {item.size}</p>
                      )}
                      {item.color && (
                        <p className="text-sm text-gray-500">Color: {item.color}</p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-medium text-gray-900">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                      {item.mrp && item.mrp > item.price_at_purchase && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{(item.mrp * item.quantity).toFixed(2)}
                        </span>
                      )}
                      {item.mrp && item.mrp > item.price_at_purchase && (
                        <span className="text-xs text-green-600">
                          Saved ₹{((item.mrp - item.price_at_purchase) * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {item.mrp && item.mrp > item.price_at_purchase && (
                      <p className="text-xs text-gray-500 mt-1">
                        ₹{item.price_at_purchase.toFixed(2)} each (was ₹{item.mrp.toFixed(2)})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">Discount</span>
                    <span className="text-sm font-medium text-green-600">-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delivery</span>
                  <span className="text-sm font-medium text-gray-900">
                    {order.delivery_charge === 0 ? 'Free' : `₹${order.delivery_charge?.toFixed(2) || '0.00'}`}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-bold text-gray-900">₹{order.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping & Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
                <address className="mt-2 not-italic text-sm text-gray-600">
                  {order.shipping_address?.name || 'N/A'}<br />
                  {order.shipping_address?.address || 'N/A'}<br />
                  {order.shipping_address?.city || 'N/A'}, {order.shipping_address?.state || 'N/A'}<br />
                  {order.shipping_address?.pincode || 'N/A'}<br />
                  Phone: {order.shipping_address?.phone || 'N/A'}
                </address>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Payment Method</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="capitalize">{order.payment_method?.replace(/_/g, ' ') || 'N/A'}</p>
                  <p className="mt-1 text-sm text-gray-500 capitalize">
                    {order.payment_status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!isGuest && !isGuestUser && (
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Need Help?</h2>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about your order, please contact our customer service.
              </p>
              <a
                href="mailto:support@fici.com"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Contact Support
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Return Request Modal - Simple implementation for now */}
      {showReturnModal && selectedOrderForReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Request Return</h2>
            <p className="text-gray-600 mb-4">
              You can request a return within 3 days of delivery. Our customer service team will contact you to arrange the pickup.
            </p>
            <div className="space-y-3 mb-6">
              <p className="text-sm"><strong>Order ID:</strong> {selectedOrderForReturn.order_id}</p>
              <p className="text-sm"><strong>Items:</strong> {selectedOrderForReturn.items.length} item(s)</p>
              <p className="text-sm"><strong>Delivered:</strong> {selectedOrderForReturn.delivered_at ? new Date(selectedOrderForReturn.delivered_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeReturnModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSuccess}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Return Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
