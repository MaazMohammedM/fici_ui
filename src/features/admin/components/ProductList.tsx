// ✅ ProductList.tsx — List, update sizes, delete products
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import EditProductForm from './EditProductForm';
import ProductFilters from '../../../components/shared/ProductFilters';
import fallbackImage from '../../../assets/Fici_logo.png';
import CachedImage from '../../../components/ui/CachedImage';
import { getStockStatus, getActiveStatus, getStatusBadgeProps } from '../../../lib/admin/productStatus';

const ProductList: React.FC = () => {
  const { 
    products, 
    deleteProduct, 
    editingProduct, 
    setEditingProduct,
    success,
    clearSuccess 
  } = useAdminStore();
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Filter state
  const [filters, setFilters] = useState({
    categories: [],
    genders: [],
    subCategories: [],
    sizes: [],
    search: '',
    sortBy: null as 'price_low_to_high' | 'price_high_to_low' | null,
    stockStatus: 'all' as 'all' | 'inStock' | 'outOfStock',
    activeStatus: 'all' as 'all' | 'active' | 'inactive'
  });

  // Handle filters change with proper type compatibility
  const handleFiltersChange = useCallback((newFilters: {
    categories: string[];
    genders: string[];
    subCategories: string[];
    sizes: string[];
    search: string;
    sortBy: 'price_low_to_high' | 'price_high_to_low' | null;
    stockStatus?: 'all' | 'inStock' | 'outOfStock';
    activeStatus?: 'all' | 'active' | 'inactive';
  }) => {
    setFilters({
      categories: newFilters.categories,
      genders: newFilters.genders,
      subCategories: newFilters.subCategories,
      sizes: newFilters.sizes,
      search: newFilters.search,
      sortBy: newFilters.sortBy,
      stockStatus: newFilters.stockStatus || 'all',
      activeStatus: newFilters.activeStatus || 'all'
    });
  }, []);

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
      );
    }

    // Gender filter
    if (filters.genders.length > 0) {
      filtered = filtered.filter(product => 
        filters.genders.includes(product.gender)
      );
    }

    // Subcategory filter
    if (filters.subCategories.length > 0) {
      filtered = filtered.filter(product => 
        product.sub_category && filters.subCategories.includes(product.sub_category)
      );
    }

    // Search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.article_id.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );
    }

    // Admin-specific stock status filter
    if (filters.stockStatus === 'inStock') {
      filtered = filtered.filter(product => {
        const sizes = product.sizes || {};
        return Object.values(sizes).some((stock: any) => stock > 0);
      });
    } else if (filters.stockStatus === 'outOfStock') {
      filtered = filtered.filter(product => {
        const sizes = product.sizes || {};
        return Object.values(sizes).every((stock: any) => stock === 0);
      });
    }

    // Admin-specific active status filter
    if (filters.activeStatus === 'active') {
      filtered = filtered.filter(product => product.is_active !== false);
    } else if (filters.activeStatus === 'inactive') {
      filtered = filtered.filter(product => product.is_active === false);
    }

    // Sort filter
    if (filters.sortBy) {
      filtered = filtered.sort((a, b) => {
        const priceA = parseFloat(String(a.discount_price));
        const priceB = parseFloat(String(b.discount_price));
        return filters.sortBy === 'price_low_to_high' ? priceA - priceB : priceB - priceA;
      });
    }

    return filtered;
  }, [products, filters]);

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);


  if (editingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary dark:text-white">Edit Product</h2>
          <button
            onClick={() => setEditingProduct(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back to List
          </button>
        </div>
        <EditProductForm 
          product={editingProduct} 
          onCancel={() => setEditingProduct(null)} 
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h2 className="text-xl font-bold text-primary dark:text-white">Product List</h2>
      
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{success}</span>
          <button
            type="button"
            onClick={clearSuccess}
            className="text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Filters Section */}
      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <ProductFilters 
          onFiltersChange={handleFiltersChange}
          isAdmin={true}
          className="hidden lg:block"
        />
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Filters Bar */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Products ({filteredProducts.length})
              </h3>
              <ProductFilters 
                onFiltersChange={handleFiltersChange}
                isMobile={true}
                isAdmin={true}
                showActionButtons={true}
              />
            </div>
          </div>
          
          {/* Desktop Products Header */}
          <div className="hidden lg:block mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Products ({filteredProducts.length})
            </h3>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {products.length === 0 ? (
                "No products found. Add your first product!"
              ) : (
                "No products match your current filters."
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const activeStatus = getActiveStatus(product);
                  const stockBadgeProps = getStatusBadgeProps(stockStatus.status, stockStatus.statusColor);
                  const activeBadgeProps = getStatusBadgeProps(activeStatus.status, activeStatus.statusColor);
                  
                  return (
                  <div key={product.product_id} className='border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
                  {/* Product Image */}
                  <div className="mb-4">
                    <CachedImage
                      src={product.thumbnail_url || ''}
                      fallbackSrc={fallbackImage}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      loadingFallback={
                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
                      }
                      onClick={() => navigate(`/products/${product.article_id}`)}
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white flex-1'>
                        {product.name}
                      </h3>
                      {/* Status Badges */}
                      <div className="flex gap-1 flex-wrap">
                        <span className={stockBadgeProps.className}>
                          {stockBadgeProps.text}
                        </span>
                        <span className={activeBadgeProps.className}>
                          {activeBadgeProps.text}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">MRP: ₹{product.mrp_price}</span>
                      <span className="text-lg font-bold text-primary">₹{product.discount_price}</span>
                    </div>
                    
                    {product.sub_category && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Brand: {product.sub_category}</p>
                    )}
                    
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {product.category}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {product.gender}
                      </span>
                    </div>
                    
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      <p>Article ID: {product.article_id}</p>
                      <p>Sizes: {Object.entries(product.sizes || {}).map(([size, qty]) => `${size}: ${qty}`).join(', ')}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product?')) {
                          deleteProduct(product.product_id);
                        }
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === pageNumber
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;