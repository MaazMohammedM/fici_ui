// src/features/admin/components/EditProductForm.tsx
import React, { useEffect, useState } from 'react';
import { X, Trash2, Upload, Plus } from 'lucide-react';
import { useEditProductForm } from '@lib/hooks/useEditProductForm';
import { useAdminStore } from '../store/adminStore';
import SizeManager from './SizeManager';
import ProductDiscountForm from './ProductDiscountForm';
import type { AdminProduct } from '../store/adminStore';
import { getStockStatus, getActiveStatus, getStatusBadgeProps } from '../../../lib/admin/productStatus';

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
  const { 
    error, 
    success, 
    clearError, 
    clearSuccess,
    deleteSingleImage,
    updateProductImages,
    uploadImages,
    uploadProgress 
  } = useAdminStore();
  
  // Image management state
  const [currentImages, setCurrentImages] = useState<string[]>(product.images || []);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Sync currentImages with product.images when product changes
  useEffect(() => {
    console.log('Product images updated:', product.images);
    setCurrentImages(product.images || []);
  }, [product.images]);

  // Calculate current status
  const stockStatus = getStockStatus(product);
  const activeStatus = getActiveStatus(product);
  const stockBadgeProps = getStatusBadgeProps(stockStatus.status, stockStatus.statusColor);
  const activeBadgeProps = getStatusBadgeProps(activeStatus.status, activeStatus.statusColor);
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
    handleSizeQuantityChange,
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
    try {
      const result = await onSubmit(data);
      if (result && onSuccess) {
        window.scrollTo(0, 0);
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  // Handle thumbnail selection
  const handleThumbnailSelect = (imageUrl: string) => {
    setValue('thumbnail_url', imageUrl, { shouldValidate: true });
  };

  // Handle tag toggling
  const handleTagToggle = (tag: string) => {
    const currentTags = (watch('tags') as unknown as string[]) || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setValue('tags', newTags.join(','), { shouldValidate: true });
  };

  // Handle image deletion
  const handleDeleteImage = async (imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      console.log('Deleting image:', imageUrl);
      
      // Prevent deletion if it's the last image
      if (currentImages.length <= 1) {
        console.warn('Cannot delete the last image');
        return;
      }

      const success = await deleteSingleImage(product.product_id, imageUrl);
      if (success) {
        // Update local state immediately for better UX
        const updatedImages = currentImages.filter(img => img !== imageUrl);
        setCurrentImages(updatedImages);
        
        // Update form thumbnail if needed
        if (watch('thumbnail_url') === imageUrl) {
          const newThumbnail = updatedImages[0] || '';
          setValue('thumbnail_url', newThumbnail, { shouldValidate: true });
        }
        
        console.log('Image deleted successfully, updated images:', updatedImages);
      } else {
        console.error('Failed to delete image');
      }
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding new images would exceed the limit
    if (currentImages.length + files.length > 5) {
      alert(`You can only upload a maximum of 5 images. Currently have ${currentImages.length} images, trying to add ${files.length} more.`);
      event.target.value = '';
      return;
    }

    setIsUploadingImages(true);
    try {
      // Get folder name from product
      const folderName = product.article_id;
      
      // Upload new images
      const uploadResult = await uploadImages(folderName, files);
      
      if (uploadResult) {
        // Combine existing images with new ones
        const updatedImages = [...currentImages, ...uploadResult.imageUrls];
        setCurrentImages(updatedImages);
        
        // Update product in database with new images
        await updateProductImages(product.product_id, updatedImages, watch('thumbnail_url'));
        
        console.log('Images uploaded successfully. Total images:', updatedImages.length);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploadingImages(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Available tag options
  const TAG_OPTIONS = [
    { value: 'clearance_sale', label: 'Clearance Sale' },
    { value: 'discount_sale', label: 'Discount Sale' },
    { value: 'deal_of_the_day', label: 'Deal of the Day' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-white dark:bg-dark2 p-6 rounded-2xl shadow-md">
      {/* Product Status Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Article ID: {product.article_id}</p>
        </div>
        <div className="flex gap-2">
          <span className={stockBadgeProps.className}>
            {stockBadgeProps.text}
          </span>
          <span className={activeBadgeProps.className}>
            {activeBadgeProps.text}
          </span>
        </div>
      </div>

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
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Selected from images above)
            </span>
          </label>
          <input 
            {...register('thumbnail_url')} 
            placeholder="Click an image above to set as thumbnail" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700"
            readOnly
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Click on any image in the "Product Images" section below to set it as the thumbnail. This image will be displayed as the main product image in listings.
          </p>
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
            onSizeQuantityChange={handleSizeQuantityChange}
          />
        </div>

        {/* Image Management */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white">
              Product Images
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                (Click to set thumbnail, hover for options)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <label className={`relative cursor-pointer px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                currentImages.length >= 5 || isUploadingImages
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}>
                <Upload className="h-4 w-4" />
                Add Images ({currentImages.length}/5)
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImages || currentImages.length >= 5}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </label>
              {isUploadingImages && (
                <span className="text-xs text-blue-600">
                  Uploading... {Math.round(uploadProgress)}%
                </span>
              )}
              {currentImages.length >= 5 && (
                <span className="text-xs text-orange-600">
                  Maximum 5 images allowed
                </span>
              )}
            </div>
          </div>

          {currentImages.length > 0 ? (
            <>
              <div className="text-xs text-gray-500 mb-2">
                Debug: {currentImages.length} images loaded
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentImages.map((image: string, index: number) => {
                const isCurrentThumbnail = watch('thumbnail_url') === image || 
                                       (index === 0 && !watch('thumbnail_url'));
                return (
                  <div key={index} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleThumbnailSelect(image)}
                      className={`relative w-full h-24 object-cover rounded border-2 transition-all ${
                        isCurrentThumbnail 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      {isCurrentThumbnail && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          Thumbnail
                        </div>
                      )}
                    </button>
                    
                    {/* Action buttons - always visible */}
                    <div className="absolute top-1 right-1 flex gap-1 bg-black bg-opacity-50 rounded p-1">
                      <button
                        type="button"
                        onClick={() => handleThumbnailSelect(image)}
                        className={`p-1 rounded text-xs ${
                          isCurrentThumbnail 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-700 text-white hover:bg-gray-800'
                        }`}
                        title={isCurrentThumbnail ? 'Current thumbnail' : 'Set as thumbnail'}
                      >
                        {isCurrentThumbnail ? '✓' : '👁'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Delete button clicked for image:', image);
                          console.log('Current images count:', currentImages.length);
                          console.log('Current images:', currentImages);
                          handleDeleteImage(image);
                        }}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title="Delete image"
                        disabled={currentImages.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrentThumbnail ? 'Thumbnail' : `Image ${index + 1}`}
                    </div>
                  </div>
                );
              })}
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No images uploaded yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Click "Add Images" to upload product images
              </p>
            </div>
          )}
          
          {watch('thumbnail_url') && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Selected thumbnail: {watch('thumbnail_url').substring(0, 50)}...
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
      </div>

      {/* Product Discount Section */}
      <div className="md:col-span-2 mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Discount Settings</h3>
        <ProductDiscountForm 
          allProducts={[product]} 
          singleProductId={product.product_id} 
        />
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
