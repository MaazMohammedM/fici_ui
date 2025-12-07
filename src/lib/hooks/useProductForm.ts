// Updated useProductForm.ts - Include color field for form only
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
      thumbnail_url: '',
      size_prices: '{}'
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
    form.setValue('size_prices', JSON.stringify(newSizePrices));
  };

  const handleSizePriceChange = (size: string, price: number): void => {
    const newSizePrices = { ...sizePrices, [size]: price };
    setSizePrices(newSizePrices);
    // Update the form's size_prices field with JSON string
    form.setValue('size_prices', JSON.stringify(newSizePrices));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      console.log('Files selected in handleFileChange:', {
        length: selectedFiles.length,
        files: Array.from(selectedFiles).map(f => ({
          name: (f as any).name,
          type: (f as any).type,
          size: f.size
        }))
      });

      setFiles(selectedFiles);
      console.log('Files state set, new files state:', selectedFiles);
      // Clear any existing image errors when files are selected
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
      console.log('Form data received:', data);

      if (!validateFiles()) {
        console.log('File validation failed');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      console.log('Starting image upload...');
      const colorSlug = data.color.toLowerCase().replace(/\s+/g, '');
      const articleWithColor = `${data.article_id}_${colorSlug}`;
      const uploadResult = await uploadImages(articleWithColor, files!);

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
      const chosenThumbnail = imageUrls[selectedThumbnail] ?? thumbnail;
      console.log('Thumbnail URL (chosen):', chosenThumbnail);

      // Verify the uploaded files in Supabase storage
      console.log('🔍 SUPABASE STORAGE VERIFICATION:');
      console.log('   📁 Check this exact folder in Supabase Storage:');
      console.log(`   📂 Storage > ficishoesimages > ${articleWithColor}`);
      console.log('   📄 Files should be:');
      imageUrls.forEach((url, index) => {
        const fileName = url.split('/').pop();
        console.log(`      ${index + 1}. ${fileName}`);
      });
      console.log('   🏷️  Content type should show: image/jpeg');
      console.log('   📏 File sizes should match:', imageUrls.map((_, i) => `${i + 1}. ~${Math.round((files![i]?.size || 0) / 1024 / 1024)}MB`));
      console.log('   🔄 If showing application/json, try:');
      console.log('      - Hard refresh browser (Ctrl+F5)');
      console.log('      - Wait 2-3 minutes for Supabase to update');
      console.log('      - Check the EXACT folder name above');

      const productData = {
        ...data,
        article_id: articleWithColor,
        sizes: JSON.stringify(sizesList),
        images: imageUrls.join(','),
        thumbnail_url: chosenThumbnail
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
    sizePrices,
    isUploading,
    uploadProgress,
    uploadError,
    selectedThumbnail,
    setSizeInput: (value: string) => setSizeInput(value),
    setQuantityInput: (value: string) => setQuantityInput(value),
    handleAddSize,
    handleRemoveSize,
    handleSizePriceChange,
    handleFileChange,
    handleThumbnailSelect,
    onSubmit: form.handleSubmit(onSubmit)
  };
};