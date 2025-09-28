// Updated useProductForm.ts - Include color field for form only
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enhancedProductSchema, type EnhancedProductFormData } from '@lib/util/formValidation';
import { useAdminStore } from '@features/admin/store/adminStore';

// Update the useProductForm hook
export const useProductForm = () => {
  const { addProduct, uploadImages, uploadProgress, setUploadProgress } = useAdminStore();
  const [files, setFiles] = useState<FileList | null>(null);
  const [sizesList, setSizesList] = useState<Record<string, number>>({});
  const [sizeInput, setSizeInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const form = useForm<EnhancedProductFormData>({
    resolver: zodResolver(enhancedProductSchema),
    defaultValues: {
      article_id: '',
      name: '',
      description: '',
      sub_category: '',
      color: '',
      mrp_price: '',
      discount_price: '',
      gender: undefined,
      category: undefined,
      sizes: '{}',
      images: '',
      thumbnail_url: ''
    }
  });

  const handleAddSize = (): void => {
    if (sizeInput && quantityInput && parseInt(quantityInput) > 0) {
      setSizesList(prev => ({
        ...prev,
        [sizeInput]: parseInt(quantityInput, 10)
      }));
      setSizeInput('');
      setQuantityInput('');
    }
  };

  const handleRemoveSize = (size: string): void => {
    setSizesList(prev => {
      const newSizes = { ...prev };
      delete newSizes[size];
      return newSizes;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);
      form.clearErrors('images');
    }
  };

  const validateFiles = (): boolean => {
    if (!files || files.length === 0) {
      form.setError('images', {
        type: 'manual',
        message: 'Please upload at least 1 image'
      });
      return false;
    }
  
    if (files.length > 5) {
      form.setError('images', {
        type: 'manual',
        message: 'You can upload a maximum of 5 images'
      });
      return false;
    }

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/')) {
        form.setError('images', {
          type: 'manual',
          message: 'All files must be images'
        });
        return false;
      }

      if (files[i].size > 5 * 1024 * 1024) {
        form.setError('images', {
          type: 'manual',
          message: 'Each image must be less than 5MB'
        });
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: EnhancedProductFormData): Promise<void> => {
    try {
      if (!files || !validateFiles()) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const colorSlug = data.color.toLowerCase().replace(/\s+/g, '');
      const articleWithColor = `${data.article_id}_${colorSlug}`;
      const uploadResult = await uploadImages(articleWithColor, files);

      if (!uploadResult) {
        form.setError('images', {
          type: 'manual',
          message: 'Image upload failed. Please try again.'
        });
        return;
      }
      
      const { imageUrls, thumbnail } = uploadResult;
      const productData: EnhancedProductFormData = {
        ...data,
        article_id: articleWithColor,
        sizes: JSON.stringify(sizesList),
        images: imageUrls.join(','),
        thumbnail_url: thumbnail
      };

      const success = await addProduct(productData);
      if (success) {
        form.reset();
        setFiles(null);
        setSizesList({});
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      form.setError('root', {
        type: 'manual',
        message: 'Failed to add product. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    form,
    files,
    sizesList,
    sizeInput,
    quantityInput,
    isUploading,
    uploadProgress,
    setSizeInput: (value: string) => setSizeInput(value),
    setQuantityInput: (value: string) => setQuantityInput(value),
    handleAddSize,
    handleRemoveSize,
    handleFileChange,
    onSubmit: form.handleSubmit(onSubmit)
  };
};