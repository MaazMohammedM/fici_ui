// src/features/admin/components/EditProductForm.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useEditProductForm } from '@lib/hooks/useEditProductForm';
import { useAdminStore } from '../store/adminStore';
import SizeManager from './SizeManager';
import type { AdminProduct } from '../store/adminStore';

interface EditProductFormProps {
  product: AdminProduct;
  onCancel: () => void;
  onSuccess?: () => void;
}

export const EditProductForm: React.FC<EditProductFormProps> = ({ 
  product, 
  onCancel,
  onSuccess 
}) => {
  const { error, success, clearError, clearSuccess } = useAdminStore();
  const {
    form,
    sizesList,
    sizeInput,
    quantityInput,
    sizePrices,
    setSizeInput,
    setQuantityInput,
    handleAddSize,
    handleRemoveSize,
    handleSizePriceChange,
    onSubmit
  } = useEditProductForm(product, onSuccess);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = form;

  // Format price to avoid floating point precision issues
  const formatPrice = (value: any) => {
    if (!value) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  // Safe JSON stringify function to handle circular references
  const safeStringify = (obj: any) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      // Filter out React-specific properties
      if (key.startsWith('__react') || key.startsWith('_react')) {
        return undefined;
      }
      return val;
    }, 2);
  };

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    console.log('Form submission data:', data);
    console.log('Form errors:', errors);
    console.log('Form is valid:', !Object.keys(errors).length);
    try {
      await onSubmit(data);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  // Handle tag toggling
  const handleTagToggle = (tag: string) => {
    const currentTags = (watch('tags') as unknown as string[]) || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setValue('tags', newTags.join(','), { shouldValidate: true });
  };

  // Available tag options
  const TAG_OPTIONS = [
    { value: 'clearance_sale', label: 'Clearance Sale' },
    { value: 'discount_sale', label: 'Discount Sale' },
    { value: 'deal_of_the_day', label: 'Deal of the Day' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-white dark:bg-dark2 p-6 rounded-2xl shadow-md">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{success}</span>
          <button
            type="button"
            onClick={clearSuccess}
            className="text-green-500 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && Object.keys(errors).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p className="font-semibold">Form Errors:</p>
          <pre>{safeStringify(errors)}</pre>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Article ID (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Article ID
          </label>
          <input 
            value={product.article_id || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white" 
          />
        </div>

        {/* Product Name */}
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

        {/* Description */}
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

        {/* MRP Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            MRP Price (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('mrp_price', { valueAsNumber: false })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {(errors as any).mrp_price && (
            <p className="text-red-500 text-sm mt-1">{(errors as any).mrp_price.message}</p>
          )}
        </div>

        {/* Discount Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Discount Price (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('discount_price', { valueAsNumber: false })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {(errors as any).discount_price && (
            <p className="text-red-500 text-sm mt-1">{(errors as any).discount_price.message}</p>
          )}
        </div>

        {/* Gender */}
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

        {/* Category */}
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

        {/* Subcategory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Subcategory
          </label>
          <input 
            {...register('sub_category')} 
            placeholder="Subcategory" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white" 
          />
        </div>

        {/* Thumbnail URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Thumbnail URL
          </label>
          <input 
            {...register('thumbnail_url')} 
            placeholder="https://example.com/image.jpg" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white" 
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            {...register('is_active')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-white">
            Product is active
          </label>
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
            sizePrices={sizePrices}
            onSizePriceChange={handleSizePriceChange}
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {['clearance_sale', 'discount_sale', 'deal_of_the_day'].map((tag) => {
              const isSelected = ((watch('tags') as unknown as string[]) || [])?.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = (watch('tags') as unknown as string[]) || [];
                    const newTags = isSelected
                      ? currentTags.filter((t: string) => t !== tag)
                      : [...currentTags, tag];
                    setValue('tags', newTags.join(','));
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isSelected
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {tag.replace('_', ' ')}
                  {isSelected && <X className="ml-1 h-3 w-3 inline" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Images */}
        {product.images && product.images.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Current Images
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {product.images.map((image: string, index: number) => (
                <div key={index} className="relative group">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
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
        )}
      </div>

      {/* Tags */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => {
            const isSelected = ((watch('tags') as unknown as string[]) || []).includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => handleTagToggle(tag.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isSelected
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {tag.label}
                {isSelected && <X className="ml-1 h-3 w-3 inline" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex gap-4">
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update Product'}
        </button>
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl shadow transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditProductForm;