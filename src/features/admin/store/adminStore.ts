// ✅ adminStore.ts — Enhanced store with proper array storage for images
import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { EnhancedProductFormData, EditProductFormData } from '@lib/util/formValidation';

interface Product {
  product_id: string;
  name: string;
  description?: string;
  sub_category?: string;
  mrp_price: string;
  discount_price: string;
  gender: 'men' | 'women' | 'unisex';
  category: 'Footwear' | 'Bags and Accessories';
  sizes: Record<string, number>;
  images: string[];
  thumbnail_url: string;
  article_id: string;
  created_at: string;
}

interface AdminStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  success: string | null;
  uploadProgress: number;
  editingProduct: Product | null;
  fetchProducts: () => Promise<void>;
  addProduct: (data: EnhancedProductFormData) => Promise<boolean>;
  updateProduct: (productId: string, data: EditProductFormData) => Promise<boolean>;
  uploadImages: (folderName: string, files: FileList) => Promise<{ imageUrls: string[]; thumbnail: string } | null>;
  updateSizes: (productId: string, sizes: Record<string, number>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  deleteProductImages: (folderName: string) => Promise<boolean>;
  getFolderNameFromImages: (images: string[]) => string | null;
  setEditingProduct: (product: Product | null) => void;
  clearError: () => void;
  clearSuccess: () => void;
  setUploadProgress: (progress: number) => void;
}

// Helper function to safely parse JSON - only for sizes
const safeParseSizes = (value: any): Record<string, number> => {
  if (!value) return {};

  if (typeof value === 'object') return value;

  if (typeof value === 'string') {
    try {
      // Handle escaped JSON strings
      const unescaped = value.replace(/\\"/g, '"').replace(/^"|"$/g, '');
      return JSON.parse(unescaped);
    } catch (error) {
      console.error('Error parsing sizes JSON:', error);
      return {};
    }
  }

  return {};
};

// Helper function to parse images - handles comma-separated strings and converts to array
const parseImages = (images: any): string[] => {
  if (!images) return [];
  
  // If it's already an array, filter valid URLs
  if (Array.isArray(images)) {
    return images.filter(img => img && typeof img === 'string' && img.trim() !== '');
  }
  
  // If it's a string, check if it's comma-separated URLs
  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed) return [];
    
    // Check if it starts with http (likely comma-separated URLs)
    if (trimmed.startsWith('http')) {
      return trimmed.split(',').map(url => url.trim()).filter(url => url !== '');
    }
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(img => img && typeof img === 'string' && img.trim() !== '');
      }
      return [];
    } catch (e) {
      // If JSON parsing fails and it's not a URL, treat as single image
      return [trimmed];
    }
  }
  
  return [];
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  success: null,
  uploadProgress: 0,
  editingProduct: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      // Single optimized query with all necessary data
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          description,
          sub_category,
          mrp_price,
          discount_price,
          gender,
          category,
          sizes,
          images,
          thumbnail_url,
          article_id,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        set({ error: 'Failed to fetch products' });
      } else {
        // Parse sizes and images properly
        const parsedProducts = (data || []).map(product => ({
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images) // Parse images to ensure they're arrays
        }));
        set({ products: parsedProducts });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: 'Failed to fetch products' });
    } finally {
      set({ loading: false });
    }
  },

  uploadImages: async (folderName, files) => {
    const imageUrls: string[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create unique filename with timestamp
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${i + 1}.${fileExtension}`;
        const filePath = `${folderName}/${fileName}`;
        
        console.log(`Uploading file ${i + 1}/${totalFiles}: ${fileName} to folder: ${folderName}`);
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('ficishoesimages')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('ficishoesimages')
          .getPublicUrl(filePath);
        
        imageUrls.push(urlData.publicUrl);
        
        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        set({ uploadProgress: progress });
      }

      console.log('Upload completed successfully. Image URLs:', imageUrls);
      
      return {
        imageUrls,
        thumbnail: imageUrls[0] // First image as thumbnail
      };
    } catch (error) {
      console.error('Upload error:', error);
      set({ error: error instanceof Error ? error.message : 'Upload failed' });
      return null;
    } finally {
      set({ uploadProgress: 0 });
    }
  },

  deleteProductImages: async (folderName) => {
    try {
      // List all files in the folder
      const { data: fileList, error: listError } = await supabase.storage
        .from('ficishoesimages')
        .list(folderName);

      if (listError) {
        console.error('Error listing files:', listError);
        return false;
      }

      if (!fileList || fileList.length === 0) {
        console.log('No files found to delete');
        return true;
      }

      // Create file paths for deletion
      const filePaths = fileList.map(file => `${folderName}/${file.name}`);

      // Delete all files in the folder
      const { error: deleteError } = await supabase.storage
        .from('ficishoesimages')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
        return false;
      }

      console.log(`Successfully deleted ${filePaths.length} files from folder: ${folderName}`);
      return true;
    } catch (error) {
      console.error('Error in deleteProductImages:', error);
      return false;
    }
  },

  addProduct: async (productData) => {
    set({ loading: true, error: null });
    
    try {
      // Remove color field before saving to database (color is only used for folder creation)
      const { color, ...dataToSave } = productData;
      
      // Ensure sizes is properly formatted as JSON and images is stored as array (not stringified)
      const formattedData = {
        ...dataToSave,
        sizes: typeof dataToSave.sizes === 'string' 
          ? dataToSave.sizes 
          : JSON.stringify(dataToSave.sizes),
        // Keep images as array - don't stringify them
        images: Array.isArray(dataToSave.images) 
          ? dataToSave.images 
          : (typeof dataToSave.images === 'string' ? [dataToSave.images] : [])
      };

      const { error } = await supabase
        .from('products')
        .insert([formattedData])
        .select()
        .single();

      if (error) {
        console.error('Add product error:', error);
        set({ error: 'Failed to add product' });
        return false;
      }

      // Refresh products list
      await get().fetchProducts();
      set({ success: 'Product added successfully' });
      
      // Clear success message after 3 seconds
      setTimeout(() => set({ success: null }), 3000);
      return true;
      
    } catch (error) {
      console.error('Error adding product:', error);
      set({ error: 'Failed to add product' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (productId, formData) => {
    set({ loading: true, error: null });
    try {
      const { sizes, ...rest } = formData;

      console.log('Updating product:', {
        ...rest,
        sizes: JSON.stringify(sizes),
      });

      const { error } = await supabase
        .from('products')
        .update({
          ...rest,
          sizes: JSON.stringify(sizes),
        })
        .eq('product_id', productId);

      if (error) {
        console.error('Update error:', error);
        set({ error: `Failed to update product: ${error.message}` });
        return false;
      } else {
        console.log('Product updated successfully');
        await get().fetchProducts();
        set({ editingProduct: null });
        return true;
      }
    } catch (error) {
      console.error('Update product error:', error);
      set({ error: 'Failed to update product' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

updateSizes: async (productId, sizes) => {
  set({ loading: true, error: null });
  try {
    const { error } = await supabase
      .from('products')
      .update({ sizes: JSON.stringify(sizes) })
      .eq('product_id', productId);

    if (error) {
      console.error('Update error:', error);
      set({ error: 'Failed to update sizes' });
    } else {
      await get().fetchProducts();
    }
  } catch (error) {
    console.error('Update sizes error:', error);
    set({ error: 'Failed to update sizes' });
  } finally {
    set({ loading: false });
  }
},
// Helper function to extract folder name from image URLs
getFolderNameFromImages: (images: string[]) => {
  if (!images || images.length === 0) return null;
  
  try {
    // Extract folder name from the first image URL
    // URL format: https://domain.com/storage/v1/object/public/ficishoesimages/FOLDER_NAME/filename.jpg
    const firstImageUrl = images[0];
    const urlParts = firstImageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'ficishoesimages');
    
    if (bucketIndex !== -1 && urlParts[bucketIndex + 1]) {
      return urlParts[bucketIndex + 1]; // This is the folder name
    }
  } catch (error) {
    console.error('Error extracting folder name from images:', error);
  }
  
  return null;
},
deleteProduct: async (productId) => {
  set({ loading: true, error: null });
  try {
    // First get the product to get the images for folder name extraction
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('images')
      .eq('product_id', productId)
      .single();

    if (fetchError) {
      console.error('Error fetching product for deletion:', fetchError);
      set({ error: 'Failed to delete product' });
      return;
    }

    // Extract folder name from images
    const folderName = get().getFolderNameFromImages(product.images);
    
    if (folderName) {
      // Delete product images from storage using extracted folder name
      const imagesDeletionSuccess = await get().deleteProductImages(folderName);
      
      if (!imagesDeletionSuccess) {
        console.warn('Failed to delete some images, but continuing with product deletion');
      }
    } else {
      console.warn('Could not extract folder name from images');
    }

    // Delete product from database
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', productId);

    if (error) {
      console.error('Delete error:', error);
      set({ error: 'Failed to delete product' });
    } else {
      await get().fetchProducts();
      set({ success: 'Product and associated images deleted successfully' });
      setTimeout(() => set({ success: null }), 3000);
    }
  } catch (error) {
    console.error('Delete product error:', error);
    set({ error: 'Failed to delete product' });
  } finally {
    set({ loading: false });
  }
},

setEditingProduct: (product) => set({ editingProduct: product }),
clearError: () => set({ error: null }),
clearSuccess: () => set({ success: null }),
setUploadProgress: (progress) => set({ uploadProgress: progress })
}));