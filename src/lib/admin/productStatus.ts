import type { AdminProduct } from '../../features/admin/store/adminStore';

/**
 * Check if a product has any stock available
 */
export const hasStock = (product: AdminProduct): boolean => {
  if (!product.sizes || typeof product.sizes !== 'object') {
    return false;
  }
  
  return Object.values(product.sizes).some((quantity: number) => 
    typeof quantity === 'number' && quantity > 0
  );
};

/**
 * Get stock status information
 */
export const getStockStatus = (product: AdminProduct) => {
  const hasAnyStock = hasStock(product);
  const totalStock = Object.values(product.sizes || {}).reduce((sum: number, qty: number) => 
    typeof qty === 'number' ? sum + qty : sum, 0
  );
  
  return {
    hasStock: hasAnyStock,
    totalStock,
    status: hasAnyStock ? 'In Stock' : 'Out of Stock',
    statusColor: hasAnyStock ? 'green' : 'red'
  };
};

/**
 * Get product active status information
 */
export const getActiveStatus = (product: AdminProduct) => {
  const isActive = product.is_active === true;
  
  return {
    isActive,
    status: isActive ? 'Active' : 'Inactive',
    statusColor: isActive ? 'green' : 'gray'
  };
};

/**
 * Get status badge component props
 */
export const getStatusBadgeProps = (status: string, color: string) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  
  return {
    className: `px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}`,
    text: status
  };
};
