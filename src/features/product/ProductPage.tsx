import React, { useEffect, useRef, useState } from "react";
import { useProductStore } from "../../store/productStore";
import ProductCard from "./components/ProductCard";
import { Search, X } from "lucide-react";

const ProductPage: React.FC = () => {
  const {
    filteredProducts,
    fetchProducts,
    filterProducts,
    setPage,
    currentPage,
    totalPages,
    searchProducts,
    clearFilters,
  } = useProductStore();

  const [searchInput, setSearchInput] = useState("");
  const productGridRef = useRef<HTMLDivElement>(null);

  // Load products initially
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Handle search on click or enter
  const handleSearch = () => {
    if (searchInput.trim()) {
      searchProducts(searchInput);
    }
  };

  const handleClear = () => {
    setSearchInput("");
    clearFilters();
    fetchProducts(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
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

        {/* Filters */}
        <div className="flex gap-4">
          <select
            onChange={(e) => filterProducts({ category: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="Footwear">Footwear</option>
            <option value="Bags and Accessories">Bags</option>
          </select>

          <select
            onChange={(e) => filterProducts({ gender: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div 
        ref={productGridRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {filteredProducts.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>

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
                      setPage(page);
                      // Scroll to product grid with smooth behavior
                      if (productGridRef.current) {
                        productGridRef.current.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                          inline: 'nearest'
                        });
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