import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, SlidersHorizontal } from 'lucide-react';
import { getAllFilterSizes } from '../../utils/sizeUtils';
import { CATEGORY_CONFIG } from '../../features/admin/components/constants/productConfig';

// Constants
const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.label
}));

const GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
];

const SORT_OPTIONS = [
  { value: null, label: "Sort by" },
  { value: "price_low_to_high", label: "Price: Low to High" },
  { value: "price_high_to_low", label: "Price: High to Low" },
];

// Utility functions
const getAllSubCategoryOptions = () => {
  const allSubCategories: { value: string; label: string }[] = [];
  
  Object.values(CATEGORY_CONFIG).forEach(category => {
    if (category.subCategories) {
      category.subCategories.forEach(subCat => {
        if (typeof subCat === 'string') {
          allSubCategories.push({ value: subCat, label: subCat });
        } else {
          allSubCategories.push(subCat);
        }
      });
    }
  });
  
  const uniqueSubCategories = allSubCategories.filter((subCat, index, self) => 
    index === self.findIndex(s => s.value === subCat.value)
  ).sort((a, b) => a.label.localeCompare(b.label));
  
  return uniqueSubCategories;
};

const getEnabledSubCategoryOptions = (selectedCategories: string[]) => {
  const subCategories: { value: string; label: string }[] = [];
  
  selectedCategories.forEach(category => {
    const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
    if (categoryConfig?.subCategories) {
      categoryConfig.subCategories.forEach(subCat => {
        if (typeof subCat === 'string') {
          subCategories.push({ value: subCat, label: subCat });
        } else {
          subCategories.push(subCat);
        }
      });
    }
  });
  
  const uniqueSubCategories = subCategories.filter((subCat, index, self) => 
    index === self.findIndex(s => s.value === subCat.value)
  ).sort((a, b) => a.label.localeCompare(b.label));
  
  return uniqueSubCategories;
};

const { men: menSizes, women: womenSizes, bags: bagSizes } = getAllFilterSizes();

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface ProductFiltersProps {
  /** Callback function when filters change */
  onFiltersChange?: (filters: {
    categories: string[];
    genders: string[];
    subCategories: string[];
    sizes: string[];
    search: string;
    sortBy: 'price_low_to_high' | 'price_high_to_low' | null;
    stockStatus?: 'all' | 'inStock' | 'outOfStock';
    activeStatus?: 'all' | 'active' | 'inactive';
  }) => void;
  /** Initial filter values */
  initialFilters?: {
    categories: string[];
    genders: string[];
    subCategories: string[];
    sizes: string[];
    search: string;
    sortBy: 'price_low_to_high' | 'price_high_to_low' | null;
    stockStatus?: 'all' | 'inStock' | 'outOfStock';
    activeStatus?: 'all' | 'active' | 'inactive';
  };
  /** Show mobile filters button instead of sidebar */
  isMobile?: boolean;
  /** Custom class names */
  className?: string;
  /** Show admin-specific filters (stock status, active status) */
  isAdmin?: boolean;
  /** Show action buttons (Apply, Clear) in mobile modal */
  showActionButtons?: boolean;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  onFiltersChange,
  initialFilters = {
    categories: [],
    genders: [],
    subCategories: [],
    sizes: [],
    search: '',
    sortBy: null,
    stockStatus: 'all',
    activeStatus: 'all'
  },
  isMobile = false,
  className = '',
  isAdmin = false,
  showActionButtons = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Local state
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(initialFilters.genders);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(initialFilters.subCategories);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialFilters.sizes);
  const [sortBy, setSortBy] = useState<'price_low_to_high' | 'price_high_to_low' | null>(initialFilters.sortBy);
  const [stockStatus, setStockStatus] = useState<'all' | 'inStock' | 'outOfStock'>(initialFilters.stockStatus || 'all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'active' | 'inactive'>(initialFilters.activeStatus || 'all');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debounced search input
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Memoized values
  const activeFilterCount = useMemo(() => {
    let count = selectedCategories.length + 
           selectedGenders.length + 
           selectedSubCategories.length + 
           selectedSizes.length + 
           (sortBy ? 1 : 0) + 
           (debouncedSearchInput.trim() ? 1 : 0);
    
    // Add admin-specific filters
    if (isAdmin) {
      if (stockStatus !== 'all') count++;
      if (activeStatus !== 'all') count++;
    }
    
    return count;
  }, [selectedCategories, selectedGenders, selectedSubCategories, selectedSizes, sortBy, debouncedSearchInput, isAdmin, stockStatus, activeStatus]);

  const sizeOptions = useMemo(() => {
    return {
      men: menSizes.map(size => ({ value: `men-${size}`, label: size })),
      women: womenSizes.map(size => ({ value: `women-${size}`, label: size })),
      bags: bagSizes.map(size => ({ value: size, label: size }))
    };
  }, []);

  const subCategoryOptions = useMemo(() => {
    return getEnabledSubCategoryOptions(selectedCategories);
  }, [selectedCategories]);

  const allSubCategoryOptions = useMemo(() => {
    return getAllSubCategoryOptions();
  }, []);

  // Notify parent of filter changes
  React.useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        categories: selectedCategories,
        genders: selectedGenders,
        subCategories: selectedSubCategories,
        sizes: selectedSizes,
        search: debouncedSearchInput,
        sortBy,
        ...(isAdmin && { stockStatus, activeStatus })
      });
    }
  }, [selectedCategories, selectedGenders, selectedSubCategories, selectedSizes, debouncedSearchInput, sortBy, onFiltersChange, isAdmin, stockStatus, activeStatus]);

  // Handlers
  const handleClearAll = useCallback(() => {
    setSearchInput("");
    setSelectedCategories([]);
    setSelectedGenders([]);
    setSelectedSubCategories([]);
    setSelectedSizes([]);
    setSortBy(null);
    if (isAdmin) {
      setStockStatus('all');
      setActiveStatus('all');
    }
  }, [isAdmin]);

  const handleSizeSelection = useCallback((
    sizeValue: string,
    currentSizes: string[],
    setSizes: React.Dispatch<React.SetStateAction<string[]>>,
    currentGenders: string[],
    setGenders: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const [gender] = sizeValue.split('-');
    
    const nextSizes = currentSizes.includes(sizeValue)
      ? currentSizes.filter((s) => s !== sizeValue)
      : [...currentSizes, sizeValue];
    
    let nextGenders = [...currentGenders];
    
    if (nextSizes.length > 0) {
      if (!nextGenders.includes(gender)) {
        nextGenders.push(gender);
      }
      
      if (gender === 'men') {
        nextGenders = nextGenders.filter(g => g !== 'women');
      } else if (gender === 'women') {
        nextGenders = nextGenders.filter(g => g !== 'men');
      }
    } else if (nextSizes.length === 0) {
      nextGenders = [];
    }
    
    setSizes(nextSizes);
    setGenders(nextGenders);
  }, []);

  const toggleFilterArrayParam = useCallback((
    key: string,
    value: string,
    current: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value === 'all' || (current.includes(value) && current.length === 1)) {
      setState([]);
      return;
    }

    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    setState(next);
  }, []);

  const FilterButton = useCallback(({ count, onClick }: { count: number; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>Filters</span>
      {count > 0 && (
        <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
          {count}
        </span>
      )}
    </button>
  ), []);

  const FiltersContent = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Admin-specific Filters */}
      {isAdmin && (
        <>
          {/* Stock Status Filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Stock Status</h4>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Products' },
                { value: 'inStock', label: 'In Stock Only' },
                { value: 'outOfStock', label: 'Out of Stock Only' }
              ].map((option) => {
                const active = stockStatus === option.value;
                return (
                  <label key={option.value} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="stockStatus"
                      value={option.value}
                      checked={active}
                      onChange={() => setStockStatus(option.value as 'all' | 'inStock' | 'outOfStock')}
                      className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary/50"
                    />
                    <span className={`ml-2 text-sm transition-colors ${
                      active 
                        ? 'text-primary font-medium bg-primary/5 px-2 py-0.5 rounded border border-primary/20' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Active Status Filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Product Status</h4>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Products' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive Only' }
              ].map((option) => {
                const active = activeStatus === option.value;
                return (
                  <label key={option.value} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="activeStatus"
                      value={option.value}
                      checked={active}
                      onChange={() => setActiveStatus(option.value as 'all' | 'active' | 'inactive')}
                      className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary/50"
                    />
                    <span className={`ml-2 text-sm transition-colors ${
                      active 
                        ? 'text-primary font-medium bg-primary/5 px-2 py-0.5 rounded border border-primary/20' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Category Filter */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Category</h4>
        <div className="space-y-1">
          {CATEGORY_OPTIONS.map((cat) => {
            const active = selectedCategories.includes(cat.value);
            return (
              <label key={cat.value} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    toggleFilterArrayParam(
                      'category',
                      cat.value,
                      selectedCategories,
                      setSelectedCategories
                    )
                  }
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary/50"
                />
                <span className={`ml-2 text-sm transition-colors ${
                  active 
                    ? 'text-primary font-medium bg-primary/5 px-2 py-0.5 rounded border border-primary/20' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {cat.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Gender Filter */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Gender</h4>
        <div className="space-y-1">
          {GENDER_OPTIONS.map((g) => {
            const active = selectedGenders.includes(g.value);
            return (
              <label key={g.value} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    toggleFilterArrayParam(
                      'gender',
                      g.value,
                      selectedGenders,
                      setSelectedGenders
                    )
                  }
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary/50"
                />
                <span className={`ml-2 text-sm transition-colors ${
                  active 
                    ? 'text-primary font-medium bg-primary/5 px-2 py-0.5 rounded border border-primary/20' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {g.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Subcategory Filter */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Subcategory</h4>
        <div className="space-y-1">
          {allSubCategoryOptions.map((sub) => {
            const active = selectedSubCategories.includes(sub.value);
            const isEnabled = selectedCategories.length === 0 || subCategoryOptions.some((enabled) => enabled.value === sub.value);
            return (
              <label
                key={sub.value}
                className={`flex items-center cursor-pointer group ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {
                    toggleFilterArrayParam(
                      'sub_category',
                      sub.value,
                      selectedSubCategories,
                      setSelectedSubCategories
                    );
                  }}
                  disabled={!isEnabled}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`ml-2 text-sm transition-colors ${
                  active && isEnabled
                    ? 'text-primary font-medium bg-primary/5 px-2 py-0.5 rounded border border-primary/20' 
                    : isEnabled
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {sub.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Size Filter */}
      {(selectedCategories.includes('Footwear') || selectedCategories.includes('Bags and Accessories')) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Size</h4>

          {/* Men Sizes */}
          <div className="mb-3">
            <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Men</h5>
            <div className="flex flex-wrap gap-1">
              {sizeOptions.men.map((size) => {
                const active = selectedSizes.includes(size.value);
                return (
                  <button
                    key={size.value}
                    onClick={() =>
                      handleSizeSelection(
                        size.value,
                        selectedSizes,
                        setSelectedSizes,
                        selectedGenders,
                        setSelectedGenders
                      )
                    }
                    className={`px-2 py-1 text-sm border rounded transition-colors ${
                      active
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Women Sizes */}
          <div>
            <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Women</h5>
            <div className="flex flex-wrap gap-1">
              {sizeOptions.women.map((size) => {
                const active = selectedSizes.includes(size.value);
                return (
                  <button
                    key={size.value}
                    onClick={() =>
                      handleSizeSelection(
                        size.value,
                        selectedSizes,
                        setSelectedSizes,
                        selectedGenders,
                        setSelectedGenders
                      )
                    }
                    className={`px-2 py-1 text-sm border rounded transition-colors ${
                      active
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bag Sizes */}
          {selectedCategories.includes('Bags and Accessories') && (
            <div className="mt-3">
              <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Bag Sizes</h5>
              <div className="flex flex-wrap gap-1">
                {sizeOptions.bags.map((size) => {
                  const active = selectedSizes.includes(size.value);
                  return (
                    <button
                      key={size.value}
                      onClick={() =>
                        toggleFilterArrayParam(
                          'size',
                          size.value,
                          selectedSizes,
                          setSelectedSizes
                        )
                      }
                      className={`px-2 py-1 text-sm border rounded transition-colors ${
                        active
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Mobile version
  if (isMobile) {
    return (
      <>
        <FilterButton count={activeFilterCount} onClick={() => setIsMobileFiltersOpen(true)} />
        
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
            <div className="bg-white dark:bg-gray-800 w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <FiltersContent />
                
                {/* Action Buttons for Mobile */}
                {showActionButtons && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    {activeFilterCount > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Apply filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop version
  return (
    <div className={`w-64 flex-shrink-0 ${className}`}>
      <div className="sticky top-6">
        <FiltersContent />
      </div>
    </div>
  );
};

export default ProductFilters;
