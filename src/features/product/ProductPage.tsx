import React, { useEffect, useRef, useState } from "react";
import { useProductStore } from "../../store/productStore";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "./components/ProductCard";
import { Search, X, Filter } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "Footwear", label: "Footwear" },
  { value: "Bags and Accessories", label: "Bags & Accessories" },
];

const GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
];
const SUBCATEGORY_OPTIONS = [
  { value: "Shoes", label: "Shoes" },
  { value: "Sandals", label: "Sandals" },
  { value: "Bags", label: "Bags" },
  { value: "Accessories", label: "Accessories" },
];
// Use the predefined subcategory options
const useAvailableSubcategories = () => {
  return SUBCATEGORY_OPTIONS;
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
  } = useProductStore();

  const location = useLocation();
  const navigate = useNavigate();

  // Local UI state synced with URL
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  );
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);

  const productGridRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);

  const availableSubcategories = useAvailableSubcategories();
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [filteredSubcategories, setFilteredSubcategories] = useState<{value: string; label: string}[]>(availableSubcategories);

  // Filter subcategories based on search
  useEffect(() => {
    if (subcategorySearch) {
      const filtered = availableSubcategories.filter(sc => 
        sc.label.toLowerCase().includes(subcategorySearch.toLowerCase())
      );
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories(availableSubcategories);
    }
  }, [subcategorySearch, availableSubcategories]);

  // Parse URL params → fetch products + sync UI
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const categoryParams = params.getAll("category");
    const genderParams = params.getAll("gender");
    const subCategoryParams = params.getAll("sub_category");
    const q = params.get("q") || undefined;
    const pageStr = params.get("page");
    const page = pageStr ? Math.max(1, parseInt(pageStr, 10) || 1) : 1;

    const filters: any = {};
    if (categoryParams.length) filters.category = categoryParams;
    if (genderParams.length) filters.gender = genderParams;
    if (subCategoryParams.length) filters.sub_category = subCategoryParams;
    if (q) filters.search = q;

    fetchProducts(page, filters);

    // Sync UI state
    setSelectedCategories(categoryParams);
    setSelectedGenders(genderParams);
    setSelectedSubCategories(subCategoryParams);
    setSearchInput(q || "");
  }, [location.search, fetchProducts]);

  // Initial load when no products in store (direct access)
  useEffect(() => {
    const { filteredProducts } = useProductStore.getState();
    if (filteredProducts.length === 0) {
      fetchProducts(1, {});
    }
  }, []);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(event.target as Node)) {
        setIsSubcategoryOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSubcategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSubcategoryOpen]);

  // --- Handlers --------------------------------------------------

  const handleSearch = () => {
    const params = new URLSearchParams(location.search);
    const q = searchInput.trim();

    if (q) params.set("q", q);
    else params.delete("q");

    params.delete("page"); // reset page on search
    navigate({ pathname: "/products", search: params.toString() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearAll = () => {
    setSearchInput("");
    setSelectedCategories([]);
    setSelectedGenders([]);
    setSelectedSubCategories([]);
    clearFilters();
    navigate("/products");
  };

  const toggleFilterArrayParam = (
    key: string,
    value: string,
    current: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    // If value is 'all' or array is empty, set to empty array (show all)
    if (value === 'all' || (current.includes(value) && current.length === 1)) {
      setState([]);
      const params = new URLSearchParams(location.search);
      params.delete(key);
      params.delete("page");
      navigate({ pathname: "/products", search: params.toString() });
      return;
    }

    // Toggle the value in the array
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    setState(next);

    const params = new URLSearchParams(location.search);
    params.delete(key);
    next.forEach((v) => params.append(key, v));
    params.delete("page");
    navigate({ pathname: "/products", search: params.toString() });
  };

  const handleSubcategoryToggle = (value: string) => {
    let next: string[] = [];
    
    if (value === 'select-all') {
      // Select all filtered subcategories
      next = [...new Set([...selectedSubCategories, ...filteredSubcategories.map(sc => sc.value)])];
    } else if (value === 'clear-all') {
      // Clear all selected subcategories
      next = [];
    } else {
      // Toggle individual subcategory
      next = selectedSubCategories.includes(value)
        ? selectedSubCategories.filter((v) => v !== value)
        : [...selectedSubCategories, value];
    }

    setSelectedSubCategories(next);

    const params = new URLSearchParams(location.search);
    params.delete("sub_category");
    next.forEach((v) => params.append("sub_category", v));
    params.delete("page");
    navigate({ pathname: "/products", search: params.toString() });
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedGenders.length > 0 ||
    selectedSubCategories.length > 0 ||
    !!searchInput.trim();

  // --- UI --------------------------------------------------------

  return (
    <div className="min-h-screen bg-white dark:bg-dark1 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-inverse">
              All Products
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Browse our curated collection. Use filters to narrow down by
              category, style, and more.
            </p>
          </div>
          {filteredProducts.length > 0 && !loading && (
            <p className="text-xs sm:text-sm text-muted text-right">
              Showing{" "}
              <span className="font-semibold text-primary dark:text-inverse">
                {filteredProducts.length}
              </span>{" "}
              item{filteredProducts.length !== 1 ? "s" : ""}{" "}
              {hasActiveFilters && "with filters applied"}
            </p>
          )}
        </div>

        {/* Search + Filters Card */}
        <div className="bg-white dark:bg-dark2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8 p-3 sm:p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Bar */}
            <div className="w-full sm:w-1/2 flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark3 px-2 sm:px-3">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-1.5 sm:mr-2" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full py-2 sm:py-2.5 bg-transparent border-0 focus:outline-none text-sm sm:text-sm text-primary dark:text-inverse placeholder:text-gray-400"
              />
              {searchInput && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSearch}
                className="ml-1 sm:ml-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-primary text-inverse hover:bg-primary-hover transition-colors"
              >
                Search
              </button>
            </div>

            {/* Compact filter indicator on mobile */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm text-muted mt-1 sm:mt-0">
              <div className="hidden sm:flex items-center gap-1">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="text-xs sm:text-sm text-primary hover:text-primary-hover underline-offset-2 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mt-3 sm:mt-4 flex flex-col gap-3">
            {/* Category + Gender chips (multi-select) */}
            <div className="flex flex-wrap gap-2">
              {/* Categories */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] sm:text-xs text-muted mr-1">
                  Category:
                </span>
                {/* "All" chip */}
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    const params = new URLSearchParams(location.search);
                    params.delete("category");
                    params.delete("page");
                    navigate({
                      pathname: "/products",
                      search: params.toString(),
                    });
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs border transition ${
                    selectedCategories.length === 0
                      ? "bg-primary text-inverse border-primary"
                      : "bg-white dark:bg-dark3 text-secondary border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark2"
                  }`}
                >
                  All
                </button>
                {CATEGORY_OPTIONS.map((cat) => {
                  const active = selectedCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() =>
                        toggleFilterArrayParam(
                          "category",
                          cat.value,
                          selectedCategories,
                          setSelectedCategories
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs border transition ${
                        active
                          ? "bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:text-inverse"
                          : "bg-white dark:bg-dark3 text-secondary border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark2"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Genders */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] sm:text-xs text-muted mr-1">
                  Gender:
                </span>
                {/* All genders */}
                <button
                  onClick={() => {
                    setSelectedGenders([]);
                    const params = new URLSearchParams(location.search);
                    params.delete("gender");
                    params.delete("page");
                    navigate({
                      pathname: "/products",
                      search: params.toString(),
                    });
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs border transition ${
                    selectedGenders.length === 0
                      ? "bg-primary text-inverse border-primary"
                      : "bg-white dark:bg-dark3 text-secondary border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark2"
                  }`}
                >
                  All
                </button>
                {GENDER_OPTIONS.map((g) => {
                  const active = selectedGenders.includes(g.value);
                  return (
                    <button
                      key={g.value}
                      onClick={() =>
                        toggleFilterArrayParam(
                          "gender",
                          g.value,
                          selectedGenders,
                          setSelectedGenders
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs border transition ${
                        active
                          ? "bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:text-inverse"
                          : "bg-white dark:bg-dark3 text-secondary border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark2"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategories */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] sm:text-xs text-muted mr-1">
                Subcategory:
              </span>
              {/* All subcategories */}
              <button
                onClick={() => {
                  setSelectedSubCategories([]);
                  const params = new URLSearchParams(location.search);
                  params.delete("sub_category");
                  params.delete("page");
                  navigate({
                    pathname: "/products",
                    search: params.toString(),
                  });
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs border transition ${
                  selectedSubCategories.length === 0
                    ? "bg-primary text-inverse border-primary"
                    : "bg-white dark:bg-dark3 text-secondary border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark2"
                }`}
              >
                All
              </button>
              {SUBCATEGORY_OPTIONS.map((sub) => {
                const active = selectedSubCategories.includes(sub.value);
                return (
                  <button
                    key={sub.value}
                    onClick={() =>
                      toggleFilterArrayParam(
                        "sub_category",
                        sub.value,
                        selectedSubCategories,
                        setSelectedSubCategories
                      )
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs border transition ${
                      active
                        ? "bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:text-inverse"
                        : "bg-white dark:bg-dark3 text-secondary border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark2"
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content: loading / error / results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center bg-white/70 dark:bg-dark2/70 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 sm:p-8 md:p-10 my-6 sm:my-8">
            <div className="mb-6">
              <img
                src="/src/assets/fici_transparent.png"
                alt="FICI Loading"
                className="w-16 h-16 mx-auto animate-pulse opacity-70"
              />
            </div>
            <p className="text-sm sm:text-base text-secondary">
              Loading products…
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 sm:p-8 md:p-10 my-6 sm:my-8">
            <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
              Error loading products
            </div>
            <p className="text-sm sm:text-base text-red-600 dark:text-red-300 mb-4 max-w-md">
              {error}
            </p>
            <button
              onClick={() => {
                clearError();
                fetchProducts(1, {}, 0);
              }}
              className="btn-modern btn-primary px-5 py-2.5 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-white/80 dark:bg-dark2/80 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 sm:p-8 md:p-10 my-6 sm:my-8">
            <div className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 text-primary dark:text-inverse">
              No products found
            </div>
            <p className="text-sm sm:text-base text-secondary mb-4 max-w-md">
              Try adjusting the filters or clear all filters to view our full
              collection.
            </p>
            <button
              onClick={handleClearAll}
              className="btn-modern btn-secondary px-5 py-2.5 text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div
            ref={productGridRef}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 sm:mt-10 mb-6 sm:mb-8">
            <div className="flex items-center gap-1 bg-white dark:bg-dark2 rounded-xl shadow-sm p-1 border border-gray-200 dark:border-gray-700">
              {Array.from({ length: totalPages }, (_, idx) => {
                const page = idx + 1;
                const isCurrent = page === currentPage;
                const isNearCurrent =
                  page === currentPage - 1 ||
                  page === currentPage + 1 ||
                  page === 1 ||
                  page === totalPages;

                if (isNearCurrent || isCurrent) {
                  return (
                    <button
                      key={page}
                      onClick={() => {
                        const params = new URLSearchParams(location.search);
                        if (page > 1) params.set("page", String(page));
                        else params.delete("page");
                        navigate({
                          pathname: "/products",
                          search: params.toString(),
                        });
                        if (productGridRef.current) {
                          productGridRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }}
                      className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        isCurrent
                          ? "bg-primary text-inverse dark:bg-inverse dark:text-primary"
                          : "text-secondary hover:bg-gray-100 dark:hover:bg-dark3"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }

                if (page === 2 || page === totalPages - 1) {
                  return (
                    <span
                      key={page}
                      className="px-2 text-xs sm:text-sm text-muted"
                    >
                      …
                    </span>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;