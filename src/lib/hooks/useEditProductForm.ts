import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdminStore } from '@features/admin/store/adminStore';
import { partialEditProductSchema, type PartialEditProductFormData } from '@lib/util/formValidation';
import type { AdminProduct } from '@features/admin/store/adminStore';

export const useEditProductForm = (product: AdminProduct, onSuccess?: () => void) => {
  const { updateProduct } = useAdminStore();
  const [sizesList, setSizesList] = useState<Record<string, number>>({});
  const [sizeInput, setSizeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({});

  const form = useForm<PartialEditProductFormData>({
    resolver: zodResolver(partialEditProductSchema),
    mode: 'onChange', // Validate on change to enable button when valid
    defaultValues: {
      name: '',
      description: '',
      sub_category: '',
      mrp_price: '',
      discount_price: '',
      gender: '', // Start with empty string for proper validation
      category: '', // Start with empty string for proper validation
      sizes: '{}',
      thumbnail_url: '',
      // New fields
      is_active: true,
      size_prices: '', // Empty string to avoid constraint violation,
      tags: ''
    }
  });

  // Update form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || '',
        description: product.description || '',
        sub_category: product.sub_category || '',
        mrp_price: String(product.mrp_price || ''),
        discount_price: String(product.discount_price || ''),
        gender: product.gender || '', // Ensure it's a string, not undefined
        category: product.category || '', // Ensure it's a string, not undefined
        sizes: JSON.stringify(product.sizes || {}), // Set actual product sizes
        thumbnail_url: product.thumbnail_url || '',
        // New fields
        is_active: product.is_active ?? true,
        size_prices: product.size_prices && Object.keys(product.size_prices).length > 0 
          ? JSON.stringify(product.size_prices) 
          : '', // Empty string if no size prices
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '')
      });
      setSizesList(product.sizes || {});
      setSizePrices(product.size_prices || {});
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
    const newSizesList = { ...sizesList };
    delete newSizesList[size];
    setSizesList(newSizesList);
    // Update the form's sizes field with JSON string
    form.setValue('sizes', JSON.stringify(newSizesList));
    
    // Also remove the price for this size
    const newSizePrices = { ...sizePrices };
    delete newSizePrices[size];
    setSizePrices(newSizePrices);
    form.setValue('size_prices', JSON.stringify(newSizePrices));
  };

  const handleSizePriceChange = (size: string, price: number) => {
    const newSizePrices = { ...sizePrices, [size]: price };
    setSizePrices(newSizePrices);
    // Update the form's size_prices field with JSON string
    form.setValue('size_prices', JSON.stringify(newSizePrices));
  };

  const handleSizeQuantityChange = (size: string, quantity: number) => {
    const newSizesList = { ...sizesList, [size]: quantity };
    setSizesList(newSizesList);
    // Update the form's sizes field with JSON string
    form.setValue('sizes', JSON.stringify(newSizesList));
  };

  const onSubmit = async (data: PartialEditProductFormData) => {
    console.log('🚀 FORM SUBMISSION TRIGGERED!');
    console.log('📝 Form data received:', data);
    console.log('📏 Current sizes list:', sizesList);
    console.log('🔍 Form errors:', form.formState.errors);
    console.log('✅ Form is valid:', form.formState.isValid);

    try {
      // Check if any actual changes have been made
      const hasChanges = Object.keys(data).some(key => {
        const formValue = data[key as keyof PartialEditProductFormData];
        const originalValue = product[key as keyof typeof product];
        
        // Handle sizes comparison
        if (key === 'sizes') {
          const currentSizesJson = JSON.stringify(sizesList);
          const originalSizesJson = JSON.stringify(product.sizes || {});
          return currentSizesJson !== originalSizesJson;
        }
        
        // Handle other fields
        return formValue !== originalValue;
      });

      if (!hasChanges) {
        console.log('⚠️ No changes detected, skipping update');
        form.setError('root', {
          type: 'manual',
          message: 'No changes detected. Please make at least one change to update the product.'
        });
        return;
      }

      // Only validate sizes if they've been modified
      const currentSizesJson = JSON.stringify(sizesList);
      const originalSizesJson = JSON.stringify(product.sizes || {});
      const sizesChanged = currentSizesJson !== originalSizesJson;

      if (sizesChanged) {
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
          const parsedSizes = JSON.parse(currentSizesJson);
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
      }

      // Prepare product data - only include changed fields
      const productData: any = {};
      
      Object.keys(data).forEach(key => {
        const formValue = data[key as keyof PartialEditProductFormData];
        const originalValue = product[key as keyof typeof product];
        
        // Handle sizes
        if (key === 'sizes') {
          if (sizesChanged) {
            productData.sizes = sizesList; // Send object, not JSON string
          }
        } 
        // Handle other fields - only include if changed
        else if (formValue !== originalValue && formValue !== '') {
          // Special handling for size_prices - send object directly
          if (key === 'size_prices') {
            try {
              const parsed = JSON.parse(formValue as string);
              // If empty object, don't include the field at all (database will handle null)
              if (Object.keys(parsed).length === 0) {
                // Don't add to productData - let database use default null
              } else {
                productData[key] = parsed; // Send object, not JSON string
              }
            } catch {
              // If invalid JSON, don't include the field
            }
          } else {
            productData[key] = formValue;
          }
        }
      });

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
    sizePrices,
    setSizeInput,
    setQuantityInput,
    handleAddSize,
    handleRemoveSize,
    handleSizePriceChange,
    handleSizeQuantityChange,
    onSubmit
  };
};
