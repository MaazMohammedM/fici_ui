import React from 'react';
import { useEditProductForm } from '@lib/hooks/useEditProductForm';
import SizeManager from './SizeManager';
import { useAdminStore } from '../store/adminStore';

interface EditProductFormProps {
  product: any;
  onCancel: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({ product, onCancel }) => {
  const { error, clearError } = useAdminStore();
  const {
    form,
    sizesList,
    sizeInput,
    quantityInput,
    handleAddSize,
    handleRemoveSize,
    onSubmit,
    setSizeInput,
    setQuantityInput
  } = useEditProductForm(product);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-dark2 p-6 rounded-2xl shadow-md">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {errors.root && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Article ID (Read-only)
          </label>
          <input 
            value={product.article_id}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Product Name *
          </label>
          <input 
            {...register('name')} 
            placeholder="Product name" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white" 
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Description
          </label>
          <textarea 
            {...register('description')} 
            placeholder="Product description" 
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white" 
          />
        </div>



        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            MRP Price (₹) *
          </label>
          <input
            type="text"
            {...register('mrp_price')}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {errors.mrp_price && (
            <p className="text-red-500 text-sm mt-1">{errors.mrp_price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Discount Price (₹) *
          </label>
          <input
            type="text"
            {...register('discount_price')}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {errors.discount_price && (
            <p className="text-red-500 text-sm mt-1">{errors.discount_price.message}</p>
          )}
        </div>

        {/* Category and Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Gender *
          </label>
          <select 
            {...register('gender')} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Gender</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Category *
          </label>
          <select 
            {...register('category')} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Category</option>
            <option value="Footwear">Footwear</option>
            <option value="Bags and Accessories">Bags and Accessories</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            SubCategory
          </label>
          <input 
            {...register('sub_category')} 
            placeholder="SubCategory name" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white" 
          />
        </div>

        {/* Size Manager */}
        <div className="md:col-span-2">
          <SizeManager
            sizesList={sizesList}
            sizeInput={sizeInput}
            quantityInput={quantityInput}
            onSizeInputChange={setSizeInput}
            onQuantityInputChange={setQuantityInput}
            onAddSize={handleAddSize}
            onRemoveSize={handleRemoveSize}
          />
        </div>

        {/* Current Images */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Current Images (Read-only)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {product.images && product.images.map((image: string, index: number) => (
              <div key={index} className="relative">
                <img 
                  src={image} 
                  alt={`Product ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                    Thumbnail
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex gap-4">
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="flex-1 bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-xl shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update Product'}
        </button>
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-xl shadow transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditProductForm; 