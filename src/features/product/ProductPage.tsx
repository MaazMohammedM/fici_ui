import React, { useEffect, useRef, useState } from "react";
import { useProductStore } from "../../store/productStore";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "./components/ProductCard";
import { Search, X } from "lucide-react";

const ProductPage: React.FC = () => {
  const {
    filteredProducts,
    fetchProducts,
    currentPage,
    totalPages,
    clearFilters,
    loading,
    error
  } = useProductStore();

  const location = useLocation();
  const navigate = useNavigate();

  // Local UI state synced with URL
  const [searchInput, setSearchInput] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const productGridRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Load products based on URL query params (gender, sub_category, category, q, page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category') || undefined;
    const gender = params.get('gender') || undefined;
    const sub_category = params.get('sub_category') || undefined;
    const q = params.get('q') || undefined;
    const pageStr = params.get('page');
    const page = pageStr ? Math.max(1, parseInt(pageStr, 10) || 1) : 1;

    const filters: any = {};
    if (category) filters.category = category;
    if (gender) filters.gender = gender;
    if (sub_category) filters.sub_category = sub_category;
    if (q) filters.search = q;

    console.log('ProductPage: Fetching products with filters:', filters, 'page:', page);
    fetchProducts(page, filters);

    // Reflect URL params in UI controls
    setSelectedCategory(category || 'all');
    setSelectedGender(gender || 'all');
    setSelectedSubCategory(sub_category || 'all');
    setSearchInput(q || '');
  }, [location.search, fetchProducts]);

  // Initial load when component mounts (for direct URL access)
  useEffect(() => {
    // Always fetch products on mount if we don't have any in the store
    const { filteredProducts } = useProductStore.getState();
    if (filteredProducts.length === 0) {
      console.log('ProductPage: Initial load, no products in store');
      fetchProducts(1, {});
    }
  }, []); // Only run on mount

  // Handle search on click or enter
  const handleSearch = () => {
    const params = new URLSearchParams(location.search);
    const q = searchInput.trim();
    if (q) {
      params.set('q', q);
    } else {
      params.delete('q');
    }
    // Reset to first page when search changes
    params.delete('page');
    navigate({ pathname: '/products', search: params.toString() });
  };

  const handleClear = () => {
    setSearchInput("");
    setSelectedCategory('all');
    setSelectedGender('all');
    setSelectedSubCategory('all');
    clearFilters();
    navigate('/products');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex items-center w-full sm:w-1/2 border rounded-lg overflow-hidden">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 focus:outline-none text-sm sm:text-base"
          />
          {/* Search Icon */}
          <button
            onClick={handleSearch}
            className="px-2 sm:px-3 py-2 sm:py-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
          >
            <Search size={18} className="sm:w-5 sm:h-5" />
          </button>
          {/* Clear Icon */}
          {searchInput && (
            <button
              onClick={handleClear}
              className="px-2 sm:px-3 py-2 sm:py-3 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Filters (compact on mobile in a single row) */}
        <div
          ref={filtersRef}
          className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto md:overflow-visible items-center pb-1"
        >
          <select
            value={selectedCategory}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategory(value);
              const params = new URLSearchParams(location.search);
              if (value && value !== 'all') params.set('category', value); else params.delete('category');
              // Reset page on filter change
              params.delete('page');
              navigate({ pathname: '/products', search: params.toString() });
            }}
            className="px-2 py-2 sm:px-3 sm:py-2 border rounded-lg text-xs sm:text-sm min-w-[120px] sm:min-w-[130px] bg-white dark:bg-dark2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Categories</option>
            <option value="Footwear">Footwear</option>
            <option value="Bags and Accessories">Bags and Accessories</option>
          </select>

          <select
            value={selectedSubCategory}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSubCategory(value);
              const params = new URLSearchParams(location.search);
              if (value && value !== 'all') params.set('sub_category', value); else params.delete('sub_category');
              // Reset page on filter change
              params.delete('page');
              navigate({ pathname: '/products', search: params.toString() });
            }}
            className="px-2 py-2 sm:px-3 sm:py-2 border rounded-lg text-xs sm:text-sm min-w-[130px] sm:min-w-[140px] bg-white dark:bg-dark2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Subcategories</option>
            <option value="Shoes">Shoes</option>
            <option value="Sandals">Sandals</option>
            <option value="Bags">Bags</option>
            <option value="Accessories">Accessories</option>
          </select>

          <select
            value={selectedGender}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedGender(value);
              const params = new URLSearchParams(location.search);
              if (value && value !== 'all') params.set('gender', value); else params.delete('gender');
              // Reset page on filter change
              params.delete('page');
              navigate({ pathname: '/products', search: params.toString() });
            }}
            className="px-2 py-2 sm:px-3 sm:py-2 border rounded-lg text-xs sm:text-sm min-w-[100px] sm:min-w-[110px] bg-white dark:bg-dark2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </div>
      </div>

      {/* Empty state or Product Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-dark3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 sm:p-8 md:p-12 my-6 sm:my-8">
          <div className="mb-6">
            <img
              src="/src/assets/fici_transparent.png"
              alt="FICI Loading"
              className="w-16 h-16 mx-auto animate-pulse opacity-60"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 sm:p-8 md:p-12 my-6 sm:my-8">
          <div className="text-red-600 dark:text-red-400 mb-2">Error loading products</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchProducts(1, {})}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-dark3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 sm:p-8 md:p-12 my-6 sm:my-8">
          <div className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 text-gray-900 dark:text-white">No products found</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md text-sm sm:text-base">Try changing the filters to see other products. You can also clear all filters to view everything.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClear}
              className="px-4 sm:px-5 py-2 sm:py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={productGridRef}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 sm:mt-12 mb-6 sm:mb-8">
          <div className="flex items-center gap-1 bg-white dark:bg-dark2 rounded-lg shadow-sm p-1 border border-gray-200 dark:border-gray-700">
            {Array.from({ length: totalPages }, (_, idx) => {
              const page = idx + 1;
              const isCurrent = page === currentPage;
              const isNearCurrent =
                page === currentPage - 1 ||
                page === currentPage + 1 ||
                page === 1 ||
                page === totalPages;

              // Show first, last, current and adjacent pages
              if (isNearCurrent || isCurrent) {
                return (
                  <button
                    key={page}
                    onClick={() => {
                      const params = new URLSearchParams(location.search);
                      if (page > 1) params.set('page', String(page)); else params.delete('page');
                      navigate({ pathname: '/products', search: params.toString() });
                      if (productGridRef.current) {
                        productGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                      }
                    }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-md transition-colors text-sm sm:text-base ${
                      isCurrent
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              }

              // Show ellipsis for gaps
              if (page === 2 || page === totalPages - 1) {
                return <span key={page} className="px-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">...</span>;
              }

              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;