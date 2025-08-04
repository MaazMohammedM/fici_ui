import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enhancedProductSchema, type EnhancedProductFormData } from '@lib/util/formValidation';
import { useAdminStore } from '@features/admin/store/adminStore';

export const useProductForm = () => {
  const { addProduct, uploadImages, uploadProgress, setUploadProgress } = useAdminStore();
  const [files, setFiles] = useState<FileList | null>(null);
  const [sizesList, setSizesList] = useState<Record<string, number>>({});
  const [sizeInput, setSizeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<EnhancedProductFormData>({
    resolver: zodResolver(enhancedProductSchema),
    defaultValues: {
      article_id: '',
      name: '',
      description: '',
      brand: '',
      mrp_price: '',
      discount_price: '',
      gender: undefined,
      category: undefined,
      sizes: '',
      images: '',
      thumbnail_url: ''
    }
  });

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFiles(selectedFiles);
      form.clearErrors('images');
    }
  };

  const validateFiles = (): boolean => {
    if (!files || files.length < 5) {
      form.setError('images', {
        type: 'manual',
        message: 'Please upload at least 5 images'
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
    }

    for (let i = 0; i < files.length; i++) {
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

  const onSubmit = async (data: EnhancedProductFormData) => {
    try {
      console.log('Form data received:', data);
      
      if (!validateFiles()) {
        console.log('File validation failed');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      console.log('Starting image upload...');
      
      const uploadResult = await uploadImages(data.article_id, files!);
      
      if (!uploadResult) {
        console.log('Upload failed');
        form.setError('images', {
          type: 'manual',
          message: 'Image upload failed. Please try again.'
        });
        return;
      }

      const { imageUrls, thumbnail } = uploadResult;
      console.log('Upload successful. Image URLs:', imageUrls);
      console.log('Thumbnail URL:', thumbnail);

      const productData = {
        ...data,
        sizes: JSON.stringify(sizesList),
        images: imageUrls.join(','),
        thumbnail_url: thumbnail
      };

      console.log('Adding product to database:', productData);

      const success = await addProduct(productData);
      
      if (success) {
        console.log('Product added successfully');
        form.reset();
        setFiles(null);
        setSizesList({});
        setUploadProgress(0);
      } else {
        console.log('Failed to add product to database');
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
    setSizeInput,
    setQuantityInput,
    handleAddSize,
    handleRemoveSize,
    handleFileChange,
    onSubmit
  };
}; 