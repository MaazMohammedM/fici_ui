import React, { useEffect, useMemo } from 'react';
import { useProductStore } from './store/productStore';
import ProductCard from './components/ProductCard';
import { categories } from './data/categories';

const ProductSection: React.FC = () => {
  const {
    products,
    loading,
    fetchProducts,
    categoryFilter,
    sortOption,
    setCategoryFilter,
    setSortOption
  } = useProductStore((state) => ({
    products: state.products,
    loading: state.loading,
    fetchProducts: state.fetchProducts,
    categoryFilter: state.categoryFilter,
    sortOption: state.sortOption,
    setCategoryFilter: state.setCategoryFilter,
    setSortOption: state.setSortOption
  }));

  useEffect(() => {
    // Fetch products on mount only once
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (sortOption === 'discountAsc') {
      filtered.sort((a, b) => a.discountPrice - b.discountPrice);
    }
    if (sortOption === 'discountDesc') {
      filtered.sort((a, b) => b.discountPrice - a.discountPrice);
    }

    return filtered;
  }, [products, categoryFilter, sortOption]);

  return (
    <div className="bg-gradient-light dark:bg-gradient-dark min-h-[70svh] w-full px-4 sm:px-16 py-8 flex flex-col gap-6">
      {/* Header & Filters */}
      <div className="flex flex-wrap gap-4 justify-between items-center w-full">
        <h2 className="text-xl font-bold font-secondary text-primary dark:text-secondary">
          Browse Products
        </h2>

        <div className="flex gap-4 items-center">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-primary/20 rounded px-3 py-1 text-sm dark:bg-primary/5 dark:text-secondary"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value as '' | 'discountAsc' | 'discountDesc')
            }
            className="border border-primary/20 rounded px-3 py-1 text-sm dark:bg-primary/5 dark:text-secondary"
          >
            <option value="">Default</option>
            <option value="discountAsc">Price: Low to High</option>
            <option value="discountDesc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <p className="text-center w-full">Loading products...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 w-full">
          {displayedProducts.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSection;