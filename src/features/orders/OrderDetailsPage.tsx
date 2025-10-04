import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
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
}

interface OrderDetails {
  order_id: string;
  order_date: string;
  status: string;
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
  const { user, isGuest: isGuestUser, guestSession } = useAuthStore();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        // First, get the order details
        let orderQuery = supabase
          .from('orders')
          .select('*')
          .eq('order_id', orderId);

        if (isGuest) {
          const email = searchParams.get('email');
          const tpin = searchParams.get('tpin');
          if (!email && !tpin) {
            throw new Error('Email or TPIN verification required');
          }
          if (email) orderQuery = orderQuery.eq('guest_email', email);
          if (tpin) orderQuery = orderQuery.eq('guest_tpin', tpin);
        } else if (isGuestUser && guestSession?.guest_session_id) {
          orderQuery = orderQuery.eq('guest_session_id', guestSession.guest_session_id);
        } else if (user) {
          orderQuery = orderQuery.eq('user_id', user.id);
        } else {
          throw new Error('Authentication required');
        }

        const { data: orderData, error: orderError } = await orderQuery.single();

        if (orderError || !orderData) {
          throw new Error('Order not found or access denied');
        }

        // Then, get the order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsError) {
          console.warn('Error fetching order items:', itemsError);
        }

        // Combine the data
        const orderWithItems: OrderDetails = {
          ...orderData,
          items: itemsData || []
        };

        setOrder(orderWithItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
        console.error('Error fetching order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isGuest, isGuestUser, user, guestSession, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
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
              <p className="text-sm text-red-700">{error}</p>
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
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
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
              <div className="mt-4 sm:mt-0">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipment Tracking Section */}
          {(order.status === 'shipped' || order.status === 'delivered') && (order.tracking_id || order.shipping_partner) && (
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📦 Shipment Tracking</h2>
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
                    <p className="mt-1 text-sm text-gray-600">{order.tracking_id}</p>
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
                      Track Package
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
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
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                    {item.price_at_purchase > 0 && (
                      <p className="text-sm text-gray-500">₹{item.price_at_purchase.toFixed(2)} each</p>
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping & Billing</h2>
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
    </div>
  );
};

export default OrderDetailsPage;
