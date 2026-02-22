import type { ShippingAddress } from '../types/order-common';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import React from 'react';

export const isShippingAddress = (address: ShippingAddress | string): address is ShippingAddress => {
  return typeof address === 'object' && address !== null;
};

export const getStatusIcon = (status: string): React.ReactElement => {
  switch (status) {
    case 'pending':
      return React.createElement(Clock, { className: 'w-4 h-4 text-yellow-500' });
    case 'paid':
      return React.createElement(CheckCircle, { className: 'w-4 h-4 text-green-500' });
    case 'shipped':
    case 'partially_shipped':
      return React.createElement(Truck, { className: 'w-4 h-4 text-blue-500' });
    case 'delivered':
      return React.createElement(CheckCircle, { className: 'w-4 h-4 text-green-600' });
    case 'cancelled':
      return React.createElement(XCircle, { className: 'w-4 h-4 text-red-500' });
    default:
      return React.createElement(Clock, { className: 'w-4 h-4 text-gray-500' });
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'paid':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'shipped':
    case 'partially_shipped':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'delivered':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'cancelled':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'partially_delivered':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'partially_cancelled':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'partially_refunded':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getItemStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    case 'refunded': return 'Refunded';
    case 'replacement_requested': return 'Replacement Requested';
    case 'replacement_initiated': return 'Replacement Approved – Will Ship Soon';
    case 'replacement_shipped': return 'Replacement Shipped';
    case 'replacement_delivered': return 'Replacement Delivered';
    case 'replacement_rejected': return 'Replacement Rejected';
    case 'returned_to_warehouse': return 'Returned to Warehouse';
    default: return status;
  }
};

export const getItemStatusClass = (status: string): string => {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-blue-100 text-blue-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'replacement_requested': return 'bg-orange-100 text-orange-800';
    case 'replacement_initiated': return 'bg-purple-100 text-purple-800';
    case 'replacement_shipped': return 'bg-blue-100 text-blue-800';
    case 'replacement_delivered': return 'bg-green-100 text-green-800';
    case 'replacement_rejected': return 'bg-red-100 text-red-800';
    case 'returned_to_warehouse': return 'bg-gray-100 text-gray-800';
    case 'refunded': return 'bg-teal-100 text-teal-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

export const canCancelOrderItem = (item: { item_status?: string }): boolean => {
  const itemStatus = item.item_status || 'pending';
  return itemStatus === 'pending' && !['cancelled', 'returned', 'refunded'].includes(itemStatus);
};
