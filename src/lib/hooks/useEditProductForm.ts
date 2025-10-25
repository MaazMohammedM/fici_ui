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
    mode: 'onSubmit', // Only validate on submit to avoid blocking user input
    defaultValues: {
      name: '',
      description: '',
      sub_category: '',
      mrp_price: '',
      discount_price: '',
      gender: '', // Start with empty string for proper validation
      category: '', // Start with empty string for proper validation
      sizes: '{}',
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
        gender: product.gender || '', // Ensure it's a string, not undefined
        category: product.category || '', // Ensure it's a string, not undefined
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
    console.log('🚀 FORM SUBMISSION TRIGGERED!');
    console.log('📝 Form data received:', data);
    console.log('📏 Current sizes list:', sizesList);
    console.log('🔍 Form errors:', form.formState.errors);
    console.log('✅ Form is valid:', form.formState.isValid);

    try {
      // Ensure sizes field is updated before validation
      const sizesJson = JSON.stringify(sizesList);
      form.setValue('sizes', sizesJson);

      // Validate sizes before proceeding
      if (Object.keys(sizesList).length === 0) {
        console.log('❌ No sizes added, setting error');
        form.setError('sizes', {
          type: 'manual',
          message: 'Please add at least one size with quantity'
        });
        return;
      }

      // Validate the sizes JSON string
      try {
        const parsedSizes = JSON.parse(sizesJson);
        if (typeof parsedSizes !== 'object' || parsedSizes === null || Object.keys(parsedSizes).length === 0) {
          console.log('❌ Invalid sizes JSON, setting error');
          form.setError('sizes', {
            type: 'manual',
            message: 'Please add at least one size with quantity'
          });
          return;
        }
      } catch (parseError) {
        console.log('❌ Failed to parse sizes JSON, setting error');
        form.setError('sizes', {
          type: 'manual',
          message: 'Invalid sizes data format'
        });
        return;
      }

      const productData = {
        ...data,
        sizes: sizesJson
      };

      console.log('📦 Final product data to update:', productData);
      console.log('🆔 Product ID:', product.product_id);

      const success = await updateProduct(product.product_id, productData);

      if (success) {
        console.log('✅ Product updated successfully');
        form.reset();
        setSizesList({});
        // Call the success callback to close the edit form
        onSuccess?.();
      } else {
        console.log('❌ Failed to update product');
      }
    } catch (error) {
      console.error('💥 Error updating product:', error);
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
