import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useProductStore } from "../../store/productStore";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "./components/ProductCard";
import UltraEmptyState from "./components/UltraEmptyState"; // Import the new component
import { Search, X, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { getAllFilterSizes } from "@utils/sizeUtils";
import { CATEGORY_CONFIG } from "../admin/components/constants/productConfig";
import FiciLoader from "../../components/ui/FiciLoader";
import SEOHead from "@lib/components/SEOHead";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.label
}));

const GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
];

// Function to get all subcategory options (for display)
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

// Function to get enabled subcategory options based on selected categories
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

const SORT_OPTIONS = [
  { value: null, label: "Sort by" },
  { value: "price_low_to_high", label: "Price: Low to High" },
  { value: "price_high_to_low", label: "Price: High to Low" },
];

const { men: menSizes, women: womenSizes, bags: bagSizes } = getAllFilterSizes();

// Debounce hook for search input
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ProductPage: React.FC = () => {
  const {
    filteredProducts,
    fetchProducts,
    currentPage,
    totalPages,
    clearFilters,
    loading,
    error,
    clearError,
    sortBy,
    setSortBy,
  } = useProductStore();

  const location = useLocation();
  const navigate = useNavigate();

  // Local UI state synced with URL
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const productGridRef = useRef<HTMLDivElement>(null);

  // Debounced search input
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Memoized active filter summary for display
  const activeFilterSummary = useMemo(() => {
    const summary: string[] = [];
    
    // Sizes first
    if (selectedSizes.length > 0) {
      const sizeLabels = selectedSizes.map(size => {
        const [, sizeValue] = size.split('-');
        return sizeValue;
      });
      summary.push(`Size ${sizeLabels.join(', ')}`);
    }
    
    // Categories
    if (selectedCategories.length > 0) {
      const categoryLabels = selectedCategories.map(cat => 
        CATEGORY_OPTIONS.find(c => c.value === cat)?.label || cat
      );
      summary.push(categoryLabels.join(', '));
    }
    
    // Genders
    if (selectedGenders.length > 0) {
      const genderLabels = selectedGenders.map(g => 
        GENDER_OPTIONS.find(opt => opt.value === g)?.label || g
      );
      summary.push(genderLabels.join(', '));
    }
    
    // Subcategories
    if (selectedSubCategories.length > 0) {
      summary.push(selectedSubCategories.join(', '));
    }
    
    // Sort by
    if (sortBy) {
      const sortLabel = sortBy === 'price_low_to_high' ? 'Price: Low to High' : 'Price: High to Low';
      summary.push(sortLabel);
    }
    
    // Search
    if (debouncedSearchInput.trim()) {
      summary.push(`"${debouncedSearchInput.trim()}"`);
    }
    
    return summary;
  }, [selectedCategories, selectedGenders, selectedSubCategories, selectedSizes, sortBy, debouncedSearchInput]);

  // Memoized filter counts
  const activeFilterCount = useMemo(() => {
    return selectedCategories.length + 
           selectedGenders.length + 
           selectedSubCategories.length + 
           selectedSizes.length + 
           (sortBy ? 1 : 0) + 
           (debouncedSearchInput.trim() ? 1 : 0);
  }, [selectedCategories, selectedGenders, selectedSubCategories, selectedSizes, sortBy, debouncedSearchInput]);

  // Use totalPages from store instead of calculating locally
  // The store now correctly calculates totalPages based on database count



  
  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      const params = new URLSearchParams(location.search);
      params.set("page", "1");
      navigate({ pathname: "/products", search: params.toString() }, { replace: true });
    }
  }, [currentPage, totalPages, location.search, navigate]);

  
  // Server-side pagination is now handled in the store
  // filteredProducts already contains the paginated results


  const hasActiveFilters = activeFilterCount > 0;
  const sizeOptions = useMemo(() => {
    return {
      men: menSizes.map(size => ({ value: `men-${size}`, label: size })),
      women: womenSizes.map(size => ({ value: `women-${size}`, label: size })),
      bags: bagSizes.map(size => ({ value: size, label: size }))
    };
  }, []);

  // Memoized subcategory options based on selected categories
  const subCategoryOptions = useMemo(() => {
    return getEnabledSubCategoryOptions(selectedCategories);
  }, [selectedCategories]);

  // All subcategory options for display
  const allSubCategoryOptions = useMemo(() => {
    return getAllSubCategoryOptions();
  }, []);

  // Clear invalid subcategories when categories change (only if categories are selected)
  useEffect(() => {
    if (selectedSubCategories.length > 0 && selectedCategories.length > 0) {
      const validSubCategories = getEnabledSubCategoryOptions(selectedCategories);
      const validSubCategoryValues = new Set(validSubCategories.map(sub => sub.value));
      
      const invalidSubCategories = selectedSubCategories.filter(sub => !validSubCategoryValues.has(sub));
      
      if (invalidSubCategories.length > 0) {
        const newSubCategories = selectedSubCategories.filter(sub => validSubCategoryValues.has(sub));
        setSelectedSubCategories(newSubCategories);
        
        const params = new URLSearchParams(location.search);
        params.delete("sub_category");
        newSubCategories.forEach(sub => params.append("sub_category", sub));
        params.delete("page");
        navigate({ pathname: "/products", search: params.toString() }, { replace: true });
      }
    }
  }, [selectedCategories]);

  // Track if this is the initial load to prevent race conditions
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const categoryParams = params.getAll("category");
    const genderParams = params.getAll("gender");
    const subCategoryParams = params.getAll("sub_category");
    const sizeParams = params.getAll("size");
    const sortParam = params.get("sort") as 'price_low_to_high' | 'price_high_to_low' | null;
    const q = params.get("q") || "";
    const pageStr = params.get("page");
    const page = pageStr ? Math.max(1, parseInt(pageStr, 10) || 1) : 1;

    let syncedGenderParams = [...genderParams];
    if (sizeParams.length > 0) {
      const gendersFromSizes = new Set<string>();
      
      sizeParams.forEach(size => {
        const [gender] = size.split('-');
        if (gender === 'men' || gender === 'women') {
          gendersFromSizes.add(gender);
        }
      });
      
      if (gendersFromSizes.size > 0) {
        syncedGenderParams = Array.from(gendersFromSizes);
        
        const newParams = new URLSearchParams(params);
        newParams.delete('gender');
        syncedGenderParams.forEach(gender => newParams.append('gender', gender));
        
        const newUrl = `${location.pathname}?${newParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }
    }

    const filters: any = {};
    if (categoryParams.length) filters.category = categoryParams;
    if (syncedGenderParams.length) filters.gender = syncedGenderParams;
    if (subCategoryParams.length) filters.sub_category = subCategoryParams;
    if (sizeParams.length) filters.size = sizeParams;
    if (sortParam) filters.sortBy = sortParam;
    if (q) filters.search = q;

    fetchProducts(page, filters);

    // Sync UI state
    setSelectedCategories(categoryParams);
    setSelectedGenders(syncedGenderParams);
    setSelectedSubCategories(subCategoryParams);
    setSelectedSizes(sizeParams);
    if (sortParam) setSortBy(sortParam);
    setSearchInput(q);
  }, [location.search, fetchProducts]);

  // Separate effect to handle initial load completion after debounced input syncs
  useEffect(() => {
    if (isInitialLoad && debouncedSearchInput !== "") {
      const currentSearchParam = new URLSearchParams(location.search).get("q") || "";
      if (debouncedSearchInput === currentSearchParam) {
        setIsInitialLoad(false);
      }
    }
  }, [debouncedSearchInput, location.search, isInitialLoad]);

  useEffect(() => {
    const { filteredProducts } = useProductStore.getState();
    const hasUrlParams = location.search !== '';
    
    if (filteredProducts.length === 0 && !hasUrlParams) {
      fetchProducts(1, {});
    }
  }, [fetchProducts, location.search]);

  // --- Handlers --------------------------------------------------

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const q = debouncedSearchInput.trim();

    if (q) params.set("q", q);
    else params.delete("q");

    params.delete("page");
    navigate({ pathname: "/products", search: params.toString() });
  }, [location.search, debouncedSearchInput, navigate]);

  useEffect(() => {
    const currentSearchParam = new URLSearchParams(location.search).get("q") || "";
    
    // Don't trigger search during initial load - let URL params take precedence
    if (isInitialLoad) {
      return;
    }
    
    // Only trigger search if user has actually typed something different from URL
    if (debouncedSearchInput !== currentSearchParam) {
      handleSearch();
    }
  }, [debouncedSearchInput, handleSearch, isInitialLoad]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  const handleClearAll = useCallback(() => {
    setSearchInput("");
    setSelectedCategories([]);
    setSelectedGenders([]);
    setSelectedSubCategories([]);
    setSelectedSizes([]);
    clearFilters();
    setSortBy(null);
    navigate("/products");
  }, [clearFilters, setSortBy, navigate]);

  const handleSizeSelection = useCallback((
    sizeValue: string,
    currentSizes: string[],
    setSizes: React.Dispatch<React.SetStateAction<string[]>>,
    currentGenders: string[],
    setGenders: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    // Extract gender from size value (e.g., "men-8" -> "men", "women-6" -> "women")
    const [gender] = sizeValue.split('-');
    
    // Update sizes
    const nextSizes = currentSizes.includes(sizeValue)
      ? currentSizes.filter((s) => s !== sizeValue)
      : [...currentSizes, sizeValue];
    
    // Update genders based on size selection
    let nextGenders = [...currentGenders];
    
    if (nextSizes.length > 0) {
      // Add the gender of the selected size
      if (!nextGenders.includes(gender)) {
        nextGenders.push(gender);
      }
      
      // Remove conflicting genders
      if (gender === 'men') {
        nextGenders = nextGenders.filter(g => g !== 'women');
      } else if (gender === 'women') {
        nextGenders = nextGenders.filter(g => g !== 'men');
      }
    } else if (nextSizes.length === 0) {
      // If no sizes selected, remove all gender filters
      nextGenders = [];
    }
    
    // Update states
    setSizes(nextSizes);
    setGenders(nextGenders);
    
    // Update URL params
    const params = new URLSearchParams(location.search);
    
    // Update size params
    params.delete('size');
    nextSizes.forEach((size) => params.append('size', size));
    
    // Update gender params
    params.delete('gender');
    nextGenders.forEach((g) => params.append('gender', g));
    
    params.delete('page');
    navigate({ pathname: "/products", search: params.toString() });
  }, [location.search, navigate]);

  const toggleFilterArrayParam = useCallback((
    key: string,
    value: string,
    current: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value === 'all' || (current.includes(value) && current.length === 1)) {
      setState([]);
      const params = new URLSearchParams(location.search);
      params.delete(key);
      params.delete("page");
      navigate({ pathname: "/products", search: params.toString() });
      return;
    }

    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    setState(next);

    const params = new URLSearchParams(location.search);
    params.delete(key);
    next.forEach((v) => params.append(key, v));
    params.delete("page");
    navigate({ pathname: "/products", search: params.toString() });
  }, [location.search, navigate]);

  const handleSortChange = useCallback((newSort: 'price_low_to_high' | 'price_high_to_low' | null) => {
    setSortBy(newSort);
    const params = new URLSearchParams(location.search);
    if (newSort) {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    navigate({ pathname: "/products", search: params.toString() });
  }, [location.search, navigate, setSortBy]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(location.search);
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    navigate({ pathname: "/products", search: params.toString() });
    
    if (productGridRef.current) {
      productGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.search, navigate]);

  const handleRefresh = useCallback(() => {
    clearError();
    fetchProducts(currentPage, {});
  }, [clearError, fetchProducts, currentPage]);

  const handleBrowseAll = useCallback(() => {
    handleClearAll();
  }, [handleClearAll]);

  // =================================================================
  // MAIN STATE-BASED RENDERING LOGIC
  // This section handles all UI states: loading, error, empty, success
  // =================================================================

  
  
  const renderProductsContent = useMemo(() => {
  // STATE 1: LOADING
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FiciLoader message="Loading products..." />
      </div>
    );
  }

  // STATE 2: ERROR
  if (error) {
    return (
      <UltraEmptyState
        variant="error"
        title="Error Loading Products"
        description={error}
        showRefreshButton={true}
        onRefresh={handleRefresh}
      />
    );
  }

  // STATE 3: EMPTY
  if (!filteredProducts || filteredProducts.length === 0) {
    if (hasActiveFilters) {
      return (
        <UltraEmptyState
          variant="noResults"
          title="No products match your current filters."
          description="Try removing one or more filters to see more results."
          showClearFiltersButton={true}
          showBrowseAllButton={true}
          onClearFilters={handleClearAll}
          onBrowseAll={handleBrowseAll}
        />
      );
    }

    return (
      <UltraEmptyState
        variant="comingSoon"
        title="New Products Coming Soon"
        description="We're constantly updating our collection with latest styles."
        showRefreshButton={true}
        onRefresh={handleRefresh}
      />
    );
  }

  // STATE 4: SUCCESS
  return (
    <>
      <div
        ref={productGridRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
      >
        {filteredProducts.map((product) => (
          <ProductCard 
            key={`${product.product_id}-${product.article_id}`} 
            product={product}
            activeSizes={selectedSizes}
            activeCategories={selectedCategories}
            activeGenders={selectedGenders}
            activeSubCategories={selectedSubCategories}
          />
        ))}
      </div>

      {/* Pagination */}
{/* Pagination */}
{totalPages > 1 && (
  <div className="flex justify-center mt-8 sm:mt-10 mb-6 sm:mb-8">
    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1 border border-gray-200 dark:border-gray-700">
      {Array.from({ length: totalPages }, (_, idx) => {
        const page = idx + 1;
        const isCurrent = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              isCurrent
                ? "bg-primary text-inverse dark:bg-inverse dark:text-primary"
                : "text-secondary hover:bg-gray-100 dark:hover:bg-dark3"
            }`}
          >
            {page}
          </button>
        );
      })}
    </div>
  </div>
)}
    </>
  );
}, [
  loading,
  error,
  filteredProducts,
  totalPages,     
  currentPage,
  hasActiveFilters,
  handleClearAll,
  handleBrowseAll,
  handleRefresh,
  handlePageChange,
  selectedSizes,
  selectedCategories,
  selectedGenders,
  selectedSubCategories,
]);

  const FilterButton = useCallback(({ count, onClick }: { count: number; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
      <span className="truncate text-sm">Filters</span>
      {count > 0 && (
        <span className="px-1.5 py-0.5 bg-primary text-white text-xs rounded-full flex-shrink-0 min-w-[20px]">
          {count}
        </span>
      )}
    </button>
  ), []);

  return (
    <>
      <SEOHead 
        title="All Products - FICI Shoes | Premium Leather Footwear Collection"
        description="Browse our complete collection of premium leather shoes, sandals, and accessories for men and women. Quality craftsmanship meets modern style."
        keywords="fici shoes products, leather footwear, men shoes, women shoes, sandals, bags, accessories"
        url="https://ficishoes.com/products"
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                All Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Browse our curated collection
              </p>
            </div>
            {filteredProducts && filteredProducts.length > 0 && !loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{filteredProducts.length}</span> items
                {hasActiveFilters && ' with filters applied'}
              </div>
            )}
          </div>
        </div>

        {/* Search and Sort Bar */}
        <div className="mb-6">
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Sort and Filters - Side by side on all screens */}
          <div className="flex items-center justify-between gap-2">
            {/* Sort Dropdown - Compact width */}
            <div className="flex-1 max-w-[45%] sm:max-w-[200px]">
              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={sortBy || ''}
                  onChange={(e) => handleSortChange(e.target.value as 'price_low_to_high' | 'price_high_to_low' | null)}
                  className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-0"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value || 'default'} value={option.value || ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Button - Compact width */}
            <div className="flex-1 max-w-[45%]">
              <FilterButton count={activeFilterCount} onClick={() => setIsMobileFiltersOpen(true)} />
            </div>

            {/* Desktop Clear Filters */}
            {hasActiveFilters && (
              <div className="hidden lg:block">
                <button
                  onClick={handleClearAll}
                  className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout: Sidebar + Main Content */}
        <div className="hidden lg:flex lg:gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Clear all
                  </button>
                )}
              </div>

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

              {/* Size Filter - Show for Footwear and Bags and Accessories categories */}
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
                    <div>
                      <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Bag Sizes</h5>
                      <div className="flex flex-wrap gap-1">
                        {sizeOptions.bags.map((size) => {
                          const active = selectedSizes.includes(size.value);
                          return (
                            <button
                              key={size.value}
                              onClick={() => {
                                // For bags, don't affect gender filters
                                const nextSizes = selectedSizes.includes(size.value)
                                  ? selectedSizes.filter((s) => s !== size.value)
                                  : [...selectedSizes, size.value];
                                
                                setSelectedSizes(nextSizes);
                                
                                // Update URL params
                                const params = new URLSearchParams(location.search);
                                params.delete('size');
                                nextSizes.forEach((s) => params.append('size', s));
                                params.delete('page');
                                navigate({ pathname: "/products", search: params.toString() });
                              }}
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

              {/* Show message when non-footwear and non-bags categories are selected */}
              {selectedCategories.length > 0 && !selectedCategories.includes('Footwear') && !selectedCategories.includes('Bags and Accessories') && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Size filters are available for Footwear and Bags and Accessories products.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Active Filters Summary Bar */}
            {hasActiveFilters && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Filters:</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">{activeFilterSummary.join(' · ')}</span>
                  </div>
                  <button
                    onClick={handleClearAll}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            
            {renderProductsContent}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Active Filters Summary Bar - Mobile */}
        {hasActiveFilters && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Filters:</span>
                <span className="text-sm text-blue-600 dark:text-blue-400">{activeFilterSummary.join(' · ')}</span>
              </div>
              <button
                onClick={handleClearAll}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
        {renderProductsContent}
      </div>

      {/* Mobile Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-gray-800 rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const active = selectedCategories.includes(cat.value);
                    return (
                      <button
                        key={cat.value}
                        onClick={() =>
                          toggleFilterArrayParam(
                            'category',
                            cat.value,
                            selectedCategories,
                            setSelectedCategories
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          active
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gender Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Gender</h4>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((g) => {
                    const active = selectedGenders.includes(g.value);
                    return (
                      <button
                        key={g.value}
                        onClick={() =>
                          toggleFilterArrayParam(
                            'gender',
                            g.value,
                            selectedGenders,
                            setSelectedGenders
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          active
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategory Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Subcategory</h4>
                <div className="flex flex-wrap gap-2">
                  {allSubCategoryOptions.map((sub) => {
                    const active = selectedSubCategories.includes(sub.value);
                    const isEnabled = selectedCategories.length === 0 || subCategoryOptions.some((enabled) => enabled.value === sub.value);
                    return (
                      <button
                        key={sub.value}
                        onClick={() => {
                          toggleFilterArrayParam(
                            'sub_category',
                            sub.value,
                            selectedSubCategories,
                            setSelectedSubCategories
                          );
                        }}
                        disabled={!isEnabled}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                          active && isEnabled
                            ? 'bg-primary text-white border-primary'
                            : isEnabled
                              ? 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Filter - Show for Footwear and Bags and Accessories categories */}
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
                    <div>
                      <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Bag Sizes</h5>
                      <div className="flex flex-wrap gap-1">
                        {sizeOptions.bags.map((size) => {
                          const active = selectedSizes.includes(size.value);
                          return (
                            <button
                              key={size.value}
                              onClick={() => {
                                // For bags, don't affect gender filters
                                const nextSizes = selectedSizes.includes(size.value)
                                  ? selectedSizes.filter((s) => s !== size.value)
                                  : [...selectedSizes, size.value];
                                
                                setSelectedSizes(nextSizes);
                                
                                // Update URL params
                                const params = new URLSearchParams(location.search);
                                params.delete('size');
                                nextSizes.forEach((s) => params.append('size', s));
                                params.delete('page');
                                navigate({ pathname: "/products", search: params.toString() });
                              }}
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

              {/* Show message when non-footwear and non-bags categories are selected */}
              {selectedCategories.length > 0 && !selectedCategories.includes('Footwear') && !selectedCategories.includes('Bags and Accessories') && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Size filters are available for Footwear and Bags and Accessories products.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {hasActiveFilters && (
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
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default ProductPage;