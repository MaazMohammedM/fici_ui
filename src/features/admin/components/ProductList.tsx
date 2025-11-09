// ✅ ProductList.tsx — List, update sizes, delete products
import React from 'react';
import { useAdminStore } from '../store/adminStore';
import EditProductForm from './EditProductForm';
import fallbackImage from '../../../assets/Fici_logo.png';
import CachedImage from '../../../components/ui/CachedImage';

const ProductList: React.FC = () => {
  const { 
    products, 
    deleteProduct, 
    editingProduct, 
    setEditingProduct,
    success,
    clearSuccess 
  } = useAdminStore();


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
      
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No products found. Add your first product!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.product_id} className='border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
              {/* Product Image */}
              <div className="mb-4">
                <CachedImage
                  src={product.thumbnail_url || ''}
                  fallbackSrc={fallbackImage}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg"
                  loadingFallback={
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
                  }
                />
              </div>
              
              {/* Product Info */}
              <div className="space-y-2">
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {product.name}
                </h3>
                
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
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;