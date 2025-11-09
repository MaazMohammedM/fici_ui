import React from 'react';

interface OrderFiltersProps {
  filters: {
    status: string;
    search: string;
  };
  onFiltersChange: (filters: { status: string; search: string }) => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange }) => {
  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  return (
    <div className="mb-8 bg-white dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
            Search Orders
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order ID or product name..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="lg:w-64">
          <label className="block text-sm font-medium text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-2">
            Filter by Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent bg-white dark:bg-[color:var(--color-dark1)] text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(filters.status !== 'all' || filters.search) && (
          <div className="lg:w-auto flex items-end">
            <button
              onClick={() => onFiltersChange({ status: 'all', search: '' })}
              className="px-6 py-3 text-[color:var(--color-accent)] border border-[color:var(--color-accent)] rounded-lg hover:bg-[color:var(--color-accent)] hover:text-white transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {(filters.status !== 'all' || filters.search) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] opacity-70">
              Active filters:
            </span>
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]">
                Status: {statusOptions.find(opt => opt.value === filters.status)?.label}
                <button
                  onClick={() => handleStatusChange('all')}
                  className="ml-2 hover:text-[color:var(--color-accent)]/80"
                >
                  ×
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]">
                Search: "{filters.search}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-2 hover:text-[color:var(--color-accent)]/80"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderFilters;
