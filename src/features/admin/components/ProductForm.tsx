import React, { useState } from 'react';
import { useProductForm } from '@lib/hooks/useProductForm';
import FileUpload from './FileUpload';
import SizeManager from './SizeManager';
import { useAdminStore } from '../store/adminStore';
import { CATEGORY_CONFIG, GENDER_OPTIONS } from './constants/productConfig'; // Import the constants

const ProductForm: React.FC = () => {
  const { error, clearError } = useAdminStore();
  const {
    form,
    files,
    sizesList,
    sizeInput,
    quantityInput,
    isUploading,
    uploadProgress,
    uploadError,
    selectedThumbnail,
    handleAddSize,
    handleRemoveSize,
    handleFileChange,
    handleThumbnailSelect,
    onSubmit,
    setSizeInput,
    setQuantityInput
  } = useProductForm();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = form;

  const [successMessage, setSuccessMessage] = useState('');
  const selectedCategory = watch('category');

  const wrappedSubmit = async (data: any) => {
    setSuccessMessage('');
    await onSubmit(data);
    setSuccessMessage('Product added successfully!');
  };

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
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
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
          <input
            {...register('article_id')}
            placeholder="e.g. SH123488"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {errors.article_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.article_id.message}
            </p>
          )}
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
          {errors.color && (
            <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
          )}
        </div>

        {/* MRP Price */}
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
            <p className="text-red-500 text-sm mt-1">
              {errors.mrp_price.message}
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
            {...register('discount_price')}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
          {errors.discount_price && (
            <p className="text-red-500 text-sm mt-1">
              {errors.discount_price.message}
            </p>
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
            {GENDER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">
              {errors.category.message}
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
              {...register('sub_category')}
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
              {...register('sub_category')}
              placeholder="SubCategory name"
              disabled={!selectedCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          )}
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

        {/* File Upload */}
        <div className="md:col-span-2">
          <FileUpload
            files={files}
            onChange={handleFileChange}
            error={errors.images?.message}
            disabled={isUploading}
            selectedThumbnail={selectedThumbnail}
            onThumbnailSelect={handleThumbnailSelect}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-xl shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isUploading ? 'Adding Product...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;