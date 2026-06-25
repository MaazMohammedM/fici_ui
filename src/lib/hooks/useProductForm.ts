// Updated useProductForm.ts - Removed color field
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enhancedProductSchema, type EnhancedProductFormData } from '@lib/util/formValidation';
import { useAdminStore } from '@features/admin/store/adminStore';

export const useProductForm = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { addProduct, uploadImages } = useAdminStore();
  const [files, setFiles] = useState<FileList | null>(null);
  const [sizesList, setSizesList] = useState<Record<string, number>>({});
  const [sizeInput, setSizeInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [color, setColor] = useState<string>('');

  const form = useForm<EnhancedProductFormData>({
    resolver: zodResolver(enhancedProductSchema),
    defaultValues: {
      article_id: '',
      name: '',
      description: '',
      sub_category: '',
      mrp_price: '',
      discount_price: '',
      gender: undefined,
      category: undefined,
      sizes: '{}',
      images: '',
      thumbnail_url: '',
      size_prices: null,
      is_active: true
    }
  });

  const handleAddSize = (): void => {
    if (sizeInput && quantityInput && parseInt(quantityInput) > 0) {
      const newSizesList = {
        ...sizesList,
        [sizeInput]: parseInt(quantityInput, 10)
      };
      setSizesList(newSizesList);
      // Update the form's sizes field with JSON string
      form.setValue('sizes', JSON.stringify(newSizesList));
      setSizeInput('');
      setQuantityInput('');
    }
  };

  const handleRemoveSize = (size: string): void => {
    const newSizes = { ...sizesList };
    delete newSizes[size];
    setSizesList(newSizes);
    // Update the form's sizes field with JSON string
    form.setValue('sizes', JSON.stringify(newSizes));
    
    // Also remove the price for this size
    const newSizePrices = { ...sizePrices };
    delete newSizePrices[size];
    setSizePrices(newSizePrices);
    form.setValue('size_prices', Object.keys(newSizePrices).length > 0 ? JSON.stringify(newSizePrices) : null);
  };

  const handleSizePriceChange = (size: string, price: number): void => {
    const newSizePrices = { ...sizePrices, [size]: price };
    setSizePrices(newSizePrices);
    // Update the form's size_prices field with JSON string or null if empty
    form.setValue('size_prices', Object.keys(newSizePrices).length > 0 ? JSON.stringify(newSizePrices) : null);
  };

  const handleSizeQuantityChange = (size: string, quantity: number): void => {
    const newSizesList = { ...sizesList, [size]: quantity };
    setSizesList(newSizesList);
    // Update the form's sizes field with JSON string
    form.setValue('sizes', JSON.stringify(newSizesList));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {

      setFiles(selectedFiles);
      form.clearErrors('images');
      // Don't set form value for images to avoid JSON serialization
    }
  };

  const validateFiles = (): boolean => {
    if (!files || files.length < 1) {
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

  const handleThumbnailSelect = (index: number) => {
    setSelectedThumbnail(index);
  };

  const onSubmit = async (data: EnhancedProductFormData) => {
    try {

      if (!validateFiles()) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      
      // Validate color is provided
      if (!color.trim()) {
        form.setError('root', {
          type: 'manual',
          message: 'Color is required'
        });
        setIsUploading(false);
        return;
      }
      
      // Create article_id with color suffix
      const colorSlug = color.toLowerCase().replace(/\s+/g, '');
      const articleWithColor = `${data.article_id}_${colorSlug}`;
      
      const uploadResult = await uploadImages(articleWithColor, files!);

      if (!uploadResult) {
        form.setError('images', {
          type: 'manual',
          message: 'Image upload failed. Please try again.'
        });
        return;
      }

      const { imageUrls, thumbnail } = uploadResult;
      const chosenThumbnail = imageUrls[selectedThumbnail] ?? thumbnail;

      // imageUrls.forEach((url, index) => {
      //   const fileName = url.split('/').pop();
      //   console.log(`      ${index + 1}. ${fileName}`);
      // });

      const productData = {
        ...data,
        article_id: articleWithColor,
        sizes: JSON.stringify(sizesList),
        size_prices: Object.keys(sizePrices).length > 0 ? JSON.stringify(sizePrices) : null,
        images: imageUrls.join(','),
        thumbnail_url: chosenThumbnail
      };
      
      // Remove color from payload since it's embedded in article_id
      delete (productData as any).color;


      const success = await addProduct(productData);

      if (success) {
        form.reset();
        setFiles(null);
        setSizesList({});
        setUploadProgress(0);
        setColor(''); // Reset color state
      } else {
        console.warn('Failed to add product to database');
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
    sizePrices,
    isUploading,
    uploadProgress,
    uploadError,
    selectedThumbnail,
    setSizeInput: (value: string) => setSizeInput(value),
    setQuantityInput: (value: string) => setQuantityInput(value),
    setFiles: (files: FileList | null) => setFiles(files),
    setSizesList: (sizes: Record<string, number>) => setSizesList(sizes),
    setSizePrices: (prices: Record<string, number>) => setSizePrices(prices),
    setSelectedThumbnail: (index: number) => setSelectedThumbnail(index),
    color,
    setColor: (value: string) => setColor(value),
    handleAddSize,
    handleRemoveSize,
    handleSizePriceChange,
    handleSizeQuantityChange,
    handleFileChange,
    handleThumbnailSelect,
    onSubmit: form.handleSubmit(onSubmit)
  };
};