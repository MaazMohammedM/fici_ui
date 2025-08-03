import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@lib/schema/productSchema';
import { useAdminStore } from '../store/adminStore';
import type { ProductFormData } from '@lib/schema/productSchema';

const ProductForm: React.FC = () => {
  const { addProduct, uploadImages } = useAdminStore();
  const [files, setFiles] = useState<FileList | null>(null);
  const [sizesList, setSizesList] = useState<Record<string, number>>({});
  const [sizeInput, setSizeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema)
  });

  const handleAddSize = () => {
    if (sizeInput && quantityInput) {
      setSizesList((prev) => ({ ...prev, [sizeInput]: parseInt(quantityInput) }));
      setSizeInput('');
      setQuantityInput('');
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!files || files.length < 5) {
      alert('Please upload at least 5 images.');
      return;
    }

    const uploadResult = await uploadImages(data.article_id, files);
    if (!uploadResult) {
      alert('Image upload failed.');
      return;
    }

    const { imageUrls, thumbnail } = uploadResult;

    await addProduct({
      ...data,
      sizes: JSON.stringify(sizesList),
      images: imageUrls.join(','),
      thumbnail_url: thumbnail
    });

    reset();
    setFiles(null);
    setSizesList({});
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white dark:bg-dark2 p-6 rounded-2xl shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Article ID</label>
          <input {...register('article_id')} placeholder="e.g. SH123488" className="input w-full px-3 py-2 border rounded-md" />
          {errors.article_id && <p className="text-red-500 text-sm">{errors.article_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Product Name</label>
          <input {...register('name')} placeholder="Name" className="input w-full px-3 py-2 border rounded-md" />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Description</label>
          <textarea {...register('description')} placeholder="Description" className="input w-full px-3 py-2 border rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Brand</label>
          <input {...register('brand')} placeholder="Brand" className="input w-full px-3 py-2 border rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">MRP Price (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('mrpPrice', { valueAsNumber: true })}
            placeholder="MRP Price"
            className="input w-full px-3 py-2 border rounded-md"
          />
          {errors.mrpPrice && <p className="text-red-500 text-sm">{errors.mrpPrice.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Discount Price (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('discountPrice', { valueAsNumber: true })}
            placeholder="Discount Price"
            className="input w-full px-3 py-2 border rounded-md"
          />
          {errors.discountPrice && <p className="text-red-500 text-sm">{errors.discountPrice.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Gender</label>
          <select {...register('gender')} className="input w-full px-3 py-2 border rounded-md">
            <option value="">Select</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Category</label>
          <select {...register('category')} className="input w-full px-3 py-2 border rounded-md">
            <option value="">Select</option>
            <option value="shoes">Shoes</option>
            <option value="sandals">Sandals</option>
            <option value="chappals">Chappals</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Sizes and Quantities</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="Size (e.g. 39)"
              className="input px-2 py-1 border rounded-md w-1/2"
            />
            <input
              type="number"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              placeholder="Qty"
              className="input px-2 py-1 border rounded-md w-1/2"
            />
            <button
              type="button"
              onClick={handleAddSize}
              className="bg-secondary text-black dark:text-white px-3 py-1 rounded-md"
            >
              Add
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {Object.entries(sizesList).map(([size, qty]) => (
              <div key={size}>Size {size}: {qty}</div>
            ))}
          </div>
        </div>


        <div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-white">Upload Product Images (min 5)</label>
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => setFiles(e.target.files)}
    className="input w-full"
  />
  <p className="text-xs text-gray-500">Upload minimum 5 images</p>
</div>

      </div>

      <div className="pt-4">
        <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-active text-white px-6 py-2 rounded-xl shadow">
          {isSubmitting ? 'Adding...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;