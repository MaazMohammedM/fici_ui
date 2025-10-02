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

    fetchProducts(page, filters);

    // Reflect URL params in UI controls
    setSelectedCategory(category || 'all');
    setSelectedGender(gender || 'all');
    setSelectedSubCategory(sub_category || 'all');
    setSearchInput(q || '');
  }, [location.search, fetchProducts]);

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
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex items-center w-full md:w-1/2 border rounded-lg overflow-hidden">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 focus:outline-none"
          />
          {/* Search Icon */}
          <button
            onClick={handleSearch}
            className="px-3 py-2 text-gray-500 hover:text-black transition"
          >
            <Search size={20} />
          </button>
          {/* Clear Icon */}
          {searchInput && (
            <button
              onClick={handleClear}
              className="px-3 py-2 text-gray-500 hover:text-red-600 transition"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filters (compact on mobile in a single row) */}
        <div
          ref={filtersRef}
          className="flex gap-2 md:gap-4 overflow-x-auto md:overflow-visible items-center"
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
            className="px-2 py-1 md:px-3 md:py-2 border rounded-lg text-xs sm:text-sm min-w-[130px]"
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
            className="px-2 py-1 md:px-3 md:py-2 border rounded-lg text-xs sm:text-sm min-w-[140px]"
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
            className="px-2 py-1 md:px-3 md:py-2 border rounded-lg text-xs sm:text-sm min-w-[110px]"
          >
            <option value="all">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </div>
      </div>

      {/* Empty state or Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-gray-50 border border-dashed rounded-xl p-8 sm:p-12 my-8">
          <div className="text-xl sm:text-2xl font-semibold mb-2">No products found</div>
          <p className="text-gray-600 mb-4 max-w-md">Try changing the filters to see other products. You can also clear all filters to view everything.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClear}
              className="px-5 py-2 rounded-lg bg-black text-white hover:bg-black/90"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <div 
          ref={productGridRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 mb-8">
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
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
                    className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                      isCurrent 
                        ? 'bg-black text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              
              // Show ellipsis for gaps
              if (page === 2 || page === totalPages - 1) {
                return <span key={page} className="px-2">...</span>;
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