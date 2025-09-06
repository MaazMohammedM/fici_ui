// src/features/product/ProductPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { Search, Filter, Grid, List } from 'lucide-react';
import ProductCard from './components/ProductCard';
import { useProductFilters } from '@lib/util/useProductFilters';

// Get base article_id for navigation (removes color variant suffix)
const getBaseArticleId = (articleId: string) => {
  return articleId.split('_')[0];
};

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'sandals', label: 'Sandals' },
  { value: 'chappals', label: 'Chappals' }
];

const genders = [
  { value: 'all', label: 'All Genders' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'unisex', label: 'Unisex' }
];

const priceRanges = [
  { value: 'all', label: 'All Prices' },
  { value: '0-1000', label: 'Under ₹1,000' },
  { value: '1000-2000', label: '₹1,000 - ₹2,000' },
  { value: '2000-5000', label: '₹2,000 - ₹5,000' },
  { value: '5000-', label: 'Above ₹5,000' }
];

const ProductPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    filteredProducts,
    loading,
    error,
    selectedCategory,
    selectedGender,
    selectedPriceRange,
    searchQuery,
    currentPage,
    totalPages,
    fetchProducts,
    setPage,
  } = useProductStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { handleFilterChange, handleSearch, clearFilters } = useProductFilters();

  useEffect(() => {
    const category = searchParams.get('category');
    const sub_category = searchParams.get('sub_category');
    const gender = searchParams.get('gender');
    
    const filters: any = {};
    if (category && category !== 'all') {
      filters.category = category;
    }
    if (sub_category && sub_category !== 'all') {
      filters.sub_category = sub_category;
    }
    if (gender && gender !== 'all') {
      filters.gender = gender;
    }
    
    fetchProducts(1, filters);
  }, [searchParams, fetchProducts]);

  const renderProducts = () => {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const baseArticleId = getBaseArticleId(product.article_id);
            return (
              <Link 
                key={product.article_id} 
                to={`/products/${baseArticleId}`}
                className="block"
              >
                <ProductCard 
                  product={product} 
                  viewMode={viewMode} 
                />
              </Link>
            );
          })}
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const baseArticleId = getBaseArticleId(product.article_id);
            return (
              <Link 
                key={product.article_id} 
                to={`/products/${baseArticleId}`}
                className="block"
              >
                <ProductCard 
                  product={product} 
                  viewMode={viewMode} 
                />
              </Link>
            );
          })}
        </div>
      );
    }
  };

  if (loading && filteredProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/src/assets/FICI Logo no background.jpg" 
            alt="FICI Logo" 
            className="h-24 w-24 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-secondary mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Our Products'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery 
              ? `Found ${filteredProducts.length} products matching your search`
              : 'Discover our collection of high-quality footwear'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 lg:px-4 py-3 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid className="w-4 lg:w-5 h-4 lg:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 lg:px-4 py-3 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="w-4 lg:w-5 h-4 lg:h-5" />
              </button>
            </div>
          </div>
          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory || 'all'}
                    onChange={e => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Gender
                  </label>
                  <select
                    value={selectedGender || 'all'}
                    onChange={e => handleFilterChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    {genders.map(gender => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Price Range
                  </label>
                  <select
                    value={selectedPriceRange || 'all'}
                    onChange={e => handleFilterChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      No products found
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Try adjusting your search or filter criteria
    </p>
  </div>
) : (
  renderProducts()
)}
{/* Pagination */}
{totalPages > 1 && (
  <div className="mt-8 flex justify-center">
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-primary text-white'
                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
)}

          </div>
        </div>
   
);
};

export default ProductPage;