import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editProductSchema, type EditProductFormData } from '@lib/util/formValidation';
import { useAdminStore } from '@features/admin/store/adminStore';

export const useEditProductForm = (product: any, onSuccess?: () => void) => {
  const { updateProduct } = useAdminStore();
  const [sizesList, setSizesList] = useState<Record<string, number>>({});
  const [sizeInput, setSizeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: '',
      description: '',
      sub_category: '',
      mrp_price: '',
      discount_price: '',
      gender: undefined,
      category: undefined,
      sizes: '{}', // Initialize with empty JSON object instead of empty string
      thumbnail_url: ''
    }
  });

  // Update form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || '',
        description: product.description || '',
        sub_category: product.sub_category || '',
        mrp_price: product.mrp_price || '',
        discount_price: product.discount_price || '',
        gender: product.gender,
        category: product.category,
        sizes: '{}', // Start with empty JSON, will be updated by sizesList
        thumbnail_url: product.thumbnail_url || ''
      });
      setSizesList(product.sizes || {});
    }
  }, [product, form]);

  const handleAddSize = () => {
    if (sizeInput && quantityInput && parseInt(quantityInput) > 0) {
      const newSizesList = { ...sizesList, [sizeInput]: parseInt(quantityInput) };
      setSizesList(newSizesList);
      // Update the form's sizes field with JSON string
      form.setValue('sizes', JSON.stringify(newSizesList));
      setSizeInput('');
      setQuantityInput('');
    }
  };

  const handleRemoveSize = (size: string) => {
    const newSizes = { ...sizesList };
    delete newSizes[size];
    setSizesList(newSizes);
    // Update the form's sizes field with JSON string
    form.setValue('sizes', JSON.stringify(newSizes));
  };

  const onSubmit = async (data: EditProductFormData) => {
    try {
      // Ensure sizes field is updated before validation
      form.setValue('sizes', JSON.stringify(sizesList));

      // Validate sizes before proceeding
      if (Object.keys(sizesList).length === 0) {
        form.setError('sizes', {
          type: 'manual',
          message: 'Please add at least one size with quantity'
        });
        return;
      }

      const productData = {
        ...data,
        sizes: JSON.stringify(sizesList)
      };

      const success = await updateProduct(product.product_id, productData);

      if (success) {
        console.log('Product updated successfully');
        form.reset();
        setSizesList({});
        // Call the success callback to close the edit form
        onSuccess?.();
      } else {
        console.log('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      form.setError('root', {
        type: 'manual',
        message: 'Failed to update product. Please try again.'
      });
    }
  };

  return {
    form,
    sizesList,
    sizeInput,
    quantityInput,
    setSizeInput,
    setQuantityInput,
    handleAddSize,
    handleRemoveSize,
    onSubmit
  };
};
