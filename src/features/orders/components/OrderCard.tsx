import React from 'react';
import type { Order, OrderItem } from '../../../types/order';

interface OrderCardProps {
  order: Order;
  onOrderClick: (order: Order) => void;
  onReviewClick: (order: Order, item: OrderItem) => void;
  getStatusColor: (status: Order['status']) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onOrderClick, 
  onReviewClick, 
  getStatusColor 
}) => {
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'confirmed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'shipped':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'delivered':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show only first 2 items in card, rest in "view more"
  const displayItems = order.items.slice(0, 2);
  const remainingItems = order.items.length - 2;

  return (
    <div className="bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Order Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="text-sm font-medium capitalize">{order.status}</span>
            </div>
            <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
              Order #{order.order_id}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                Ordered on {formatDate(order.order_date)}
              </div>
              <div className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                Total: ₹{order.total_amount}
              </div>
            </div>
            
            <button
              onClick={() => onOrderClick(order)}
              className="bg-[color:var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[color:var(--color-accent)]/80 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-6">
        <div className="space-y-4">
          {displayItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] truncate">
                  {item.name}
                </h4>
                <p className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                  Color: {item.color} | Size: {item.size} | Qty: {item.quantity}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-semibold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                    ₹{item.price}
                  </span>
                  {item.mrp > item.price && (
                    <>
                      <span className="text-sm text-gray-500 line-through">₹{item.mrp}</span>
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">
                        {item.discount_percentage}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                {order.status === 'delivered' && !order.reviews_submitted.includes(item.product_id) && (
                  <button
                    onClick={() => onReviewClick(order, item)}
                    className="text-sm bg-[color:var(--color-accent)] text-white px-3 py-2 rounded-lg font-medium hover:bg-[color:var(--color-accent)]/80 transition-colors"
                  >
                    Write Review
                  </button>
                )}
                
                {order.status === 'delivered' && order.reviews_submitted.includes(item.product_id) && (
                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-3 py-2 rounded-lg text-center">
                    Reviewed
                  </span>
                )}

                {(order.status === 'shipped' || order.status === 'delivered') && order.tracking_number && (
                  <button className="text-xs text-[color:var(--color-accent)] font-medium hover:text-[color:var(--color-accent)]/80 transition-colors">
                    Track Package
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Show remaining items count */}
          {remainingItems > 0 && (
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onOrderClick(order)}
                className="text-sm text-[color:var(--color-accent)] font-medium hover:text-[color:var(--color-accent)]/80 transition-colors"
              >
                +{remainingItems} more item{remainingItems > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>

        {/* Order Progress */}
        {order.status !== 'cancelled' && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
                  {order.status === 'delivered' ? 'Delivered on' : 'Expected delivery'}:
                </span>
                <span className="ml-2 font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]">
                  {formatDate(order.estimated_delivery)}
                </span>
              </div>
              
              {order.tracking_number && (
                <div className="text-sm">
                  <span className="text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Tracking: </span>
                  <span className="font-medium text-[color:var(--color-accent)]">{order.tracking_number}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Confirmed</span>
                <span className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Shipped</span>
                <span className="text-xs text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">Delivered</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-[color:var(--color-accent)] h-2 rounded-full transition-all duration-500"
                  style={{
                    width: order.status === 'pending' ? '0%' :
                           order.status === 'confirmed' ? '33%' :
                           order.status === 'shipped' ? '66%' :
                           order.status === 'delivered' ? '100%' : '0%'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
