import React from 'react';
import { Clock, CheckCircle, XCircle, TruckIcon } from 'lucide-react';
import type { ItemStatus } from '../../types/order-common';

interface OrderStatusBadgeProps {
  status: ItemStatus | string;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4 text-yellow-500" />,
          colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          label: 'Pending'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          label: 'Cancelled'
        };
      case 'shipped':
        return {
          icon: <TruckIcon className="w-4 h-4 text-blue-500" />,
          colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          label: 'Shipped'
        };
      case 'delivered':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          label: 'Delivered'
        };
      case 'replacement_requested':
        return {
          icon: <Clock className="w-4 h-4 text-orange-500" />,
          colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
          label: 'Replacement Requested'
        };
      case 'replacement_initiated':
        return {
          icon: <CheckCircle className="w-4 h-4 text-purple-500" />,
          colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
          label: 'Replacement Approved – Will be Shipped Soon'
        };
      case 'replacement_shipped':
        return {
          icon: <TruckIcon className="w-4 h-4 text-blue-500" />,
          colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          label: 'Replacement Shipped'
        };
      case 'replacement_delivered':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          label: 'Replacement Delivered'
        };
      case 'replacement_rejected':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          label: 'Replacement Rejected'
        };
      case 'returned_to_warehouse':
        return {
          icon: <CheckCircle className="w-4 h-4 text-gray-500" />,
          colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
          label: 'Returned to Warehouse'
        };
      case 'refunded':
        return {
          icon: <CheckCircle className="w-4 h-4 text-teal-500" />,
          colorClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
          label: 'Refunded'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
          label: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.colorClass} ${className}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};
