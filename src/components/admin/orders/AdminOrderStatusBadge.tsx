import React from 'react';
import { Clock, CheckCircle, XCircle, TruckIcon, Ban } from 'lucide-react';

interface AdminOrderStatusBadgeProps {
  status: string;
  className?: string;
}

export const AdminOrderStatusBadge: React.FC<AdminOrderStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4 text-yellow-500" />,
          colorClass: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          label: 'Pending'
        };
      case 'paid':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          colorClass: 'text-green-600 bg-green-50 border-green-200',
          label: 'Paid'
        };
      case 'shipped':
      case 'partially_shipped':
        return {
          icon: <TruckIcon className="w-4 h-4 text-blue-500" />,
          colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
          label: status === 'partially_shipped' ? 'Partially Shipped' : 'Shipped'
        };
      case 'delivered':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          colorClass: 'text-green-700 bg-green-50 border-green-200',
          label: 'Delivered'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          colorClass: 'text-red-600 bg-red-50 border-red-200',
          label: 'Cancelled'
        };
      case 'partially_delivered':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          colorClass: 'text-green-600 bg-green-50 border-green-200',
          label: 'Partially Delivered'
        };
      case 'partially_cancelled':
        return {
          icon: <Ban className="w-4 h-4 text-orange-500" />,
          colorClass: 'text-orange-600 bg-orange-50 border-orange-200',
          label: 'Partially Cancelled'
        };
      case 'partially_refunded':
        return {
          icon: <CheckCircle className="w-4 h-4 text-purple-500" />,
          colorClass: 'text-purple-600 bg-purple-50 border-purple-200',
          label: 'Partially Refunded'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          colorClass: 'text-gray-600 bg-gray-50 border-gray-200',
          label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.colorClass} ${className}`}>
      {config.icon}
      <span className="ml-1 capitalize">{config.label}</span>
    </span>
  );
};
