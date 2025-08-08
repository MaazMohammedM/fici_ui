import React, { useState } from 'react';
import { useProductForm } from '@lib/hooks/useProductForm';
import FileUpload from './FileUpload';
import SizeManager from './SizeManager';
import { useAdminStore } from '../store/adminStore';

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
    handleAddSize,
    handleRemoveSize,
    handleFileChange,
    onSubmit,
    setSizeInput,
    setQuantityInput
  } = useProductForm();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = form;

  const [successMessage, setSuccessMessage] = useState('');

  const wrappedSubmit = async (data: any) => {
    setSuccessMessage('');
    await onSubmit(data);
    setSuccessMessage('Product added successfully!');
  };

  return (
    <form onSubmit={handleSubmit(wrappedSubmit)} className="space-y-6 bg-white dark:bg-dark2 p-6 rounded-2xl shadow-md">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

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

      {/* Upload Progress */}
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
        {/* Basic Information */}
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
            <p className="text-red-500 text-sm mt-1">{errors.article_id.message}</p>
          )}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Brand
          </label>
          <input 
            {...register('brand')} 
            placeholder="Brand name" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white" 
          />
        </div>

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
            <option value="shoes">Shoes</option>
            <option value="sandals">Sandals</option>
            <option value="chappals">Chappals</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
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