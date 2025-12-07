import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProductForm } from '@lib/hooks/useProductForm';
import { useEditProductForm } from '@lib/hooks/useEditProductForm';
import FileUpload from './FileUpload';
import SizeManager from './SizeManager';
import { useAdminStore } from '../store/adminStore';
import { CATEGORY_CONFIG, GENDER_OPTIONS } from './constants/productConfig';
import type { Product } from '../../../types/product';

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product,
  onSuccess,
  onCancel 
}) => {
  const isEditMode = !!product;
  const { error, success, clearError, clearSuccess } = useAdminStore();
  
  // Use the appropriate form hook based on mode
  const createFormHook = useProductForm();
  const editFormHook = product ? useEditProductForm(product, onSuccess) : null;
  
  const formHook = isEditMode ? editFormHook : createFormHook;
  
  if (!formHook) {
    return <div>Loading...</div>;
  }

  const {
    form,
    files,
    sizesList,
    sizeInput,
    quantityInput,
    sizePrices,
    isUploading,
    uploadProgress,
    uploadError,
    selectedThumbnail,
    handleAddSize,
    handleRemoveSize,
    handleSizePriceChange,
    handleSizeQuantityChange,
    handleFileChange,
    handleThumbnailSelect,
    onSubmit,
    setSizeInput,
    setQuantityInput
  } = formHook as any;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = form as any;

  const [successMessage, setSuccessMessage] = useState('');
  const selectedCategory = (watch('category' as any) as string);

  // Handle form submission
  const wrappedSubmit = async (data: any) => {
    setSuccessMessage('');
    try {
      await onSubmit(data);
      if (onSuccess) onSuccess();
      if (!isEditMode) {
        setSuccessMessage('Product added successfully!');
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
    }
  };

  // Handle tag toggling
  const handleTagToggle = (tag: string) => {
    const currentTags = (watch('tags' as any) as unknown as string[]) || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setValue('tags' as any, newTags, { shouldValidate: true });
  };

  // Available tag options
  const TAG_OPTIONS = [
    { value: 'clearance_sale', label: 'Clearance Sale' },
    { value: 'discount_sale', label: 'Discount Sale' },
    { value: 'deal_of_the_day', label: 'Deal of the Day' },
  ];

  const getSubCategoryOptions = () => {
    if (!selectedCategory) return [];
    const category = CATEGORY_CONFIG[selectedCategory as keyof typeof CATEGORY_CONFIG];
    if (!category?.subCategories) return [];
    
    // Handle both string and object subcategories
    return category.subCategories.map(subCat => {
      if (typeof subCat === 'string') {
        return { value: subCat, label: subCat };
      }
      return subCat; // Already in {value, label} format
    });
  };

  return (
    <form
      onSubmit={handleSubmit(wrappedSubmit)}
      className="space-y-6 bg-white dark:bg-dark2 p-6 rounded-2xl shadow-md"
    >
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-green-500 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
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

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {uploadError}
        </div>
      )}

      {isUploading && uploadProgress > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <div className="flex items-center justify-between mb-2">
            <span>Uploading images...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Article ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Article ID *
          </label>
          {isEditMode ? (
            <input
              value={product?.article_id}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white" 
            />
          ) : (
            <input
              {...(register as any)('article_id')}
              placeholder="e.g. SH123488"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
            />
          )}
          {(errors as any).article_id && (
            <p className="text-red-500 text-sm mt-1">
              {(errors as any).article_id.message}
            </p>
          )}
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Product Name *
          </label>
          <input
            {...(register as any)('name')}
            placeholder="Product name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {(errors as any).name && (
            <p className="text-red-500 text-sm mt-1">{(errors as any).name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Description
          </label>
          <textarea
            {...(register as any)('description')}
            placeholder="Product description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Color
          </label>
          <input
            {...register('color')}
            placeholder="e.g. Black, Brown"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {(errors as any).color && (
            <p className="text-red-500 text-sm mt-1">{(errors as any).color.message}</p>
          )}
        </div>

        {/* MRP Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            MRP Price (₹) *
          </label>
          <input
            type="text"
            {...(register as any)('mrp_price')}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {(errors as any).mrp_price && (
            <p className="text-red-500 text-sm mt-1">
              {(errors as any).mrp_price.message}
            </p>
          )}
        </div>

        {/* Discount Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Discount Price (₹) *
          </label>
          <input
            type="text"
            {...(register as any)('discount_price')}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {(errors as any).discount_price && (
            <p className="text-red-500 text-sm mt-1">
              {(errors as any).discount_price.message}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Gender *
          </label>
          <select
            {...(register as any)('gender')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Gender</option>
            {GENDER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {(errors as any).gender && (
            <p className="text-red-500 text-sm mt-1">{(errors as any).gender.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Category *
          </label>
          <select
            {...(register as any)('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Category</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
          {(errors as any).category && (
            <p className="text-red-500 text-sm mt-1">
              {(errors as any).category.message}
            </p>
          )}
        </div>

        {/* SubCategory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            SubCategory
          </label>
          {selectedCategory && Object.keys(CATEGORY_CONFIG).includes(selectedCategory) ? (
            <select
              {...(register as any)('sub_category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select SubCategory</option>
              {getSubCategoryOptions().map(subCat => (
                <option key={subCat.value} value={subCat.value}>
                  {subCat.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...(register as any)('sub_category')}
              placeholder="SubCategory name"
              disabled={!selectedCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            {...(register as any)('is_active')}
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
            onSizeQuantityChange={handleSizeQuantityChange}
          />
        </div>

        {/* File Upload */}
        <div className="md:col-span-2">
          <FileUpload
            files={files}
            onChange={handleFileChange}
            error={(errors as any).images?.message}
            disabled={isUploading}
            selectedThumbnail={selectedThumbnail}
            onThumbnailSelect={handleThumbnailSelect}
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = ((watch('tags' as any) as unknown as string[]) || []).includes(tag.value);
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
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="flex-1 bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-xl shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isUploading 
            ? isEditMode ? 'Updating Product...' : 'Adding Product...'
            : isEditMode ? 'Update Product' : 'Add Product'}
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

export default ProductForm;