import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editProductSchema, type EditProductFormData } from '@lib/util/formValidation';
import { useAdminStore } from '@features/admin/store/adminStore';

export const useEditProductForm = (product: any) => {
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
      sizes: '',
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
        sizes: '',
        thumbnail_url: product.thumbnail_url || ''
      });
      setSizesList(product.sizes || {});
    }
  }, [product, form]);

  const handleAddSize = () => {
    if (sizeInput && quantityInput && parseInt(quantityInput) > 0) {
      setSizesList((prev) => ({ ...prev, [sizeInput]: parseInt(quantityInput) }));
      setSizeInput('');
      setQuantityInput('');
    }
  };

  const handleRemoveSize = (size: string) => {
    setSizesList((prev) => {
      const newSizes = { ...prev };
      delete newSizes[size];
      return newSizes;
    });
  };

  const onSubmit = async (data: EditProductFormData) => {
    try {
      console.log('Edit form data:', data);
      
      const productData = {
        ...data,
        sizes: JSON.stringify(sizesList)
      };

      console.log('Updating product:', productData);

      const success = await updateProduct(product.product_id, productData);
      
      if (success) {
        console.log('Product updated successfully');
        form.reset();
        setSizesList({});
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