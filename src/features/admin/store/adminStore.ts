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
  updateSizes: (productId: string, sizes: Record<string, number>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  deleteProductImages: (folderName: string) => Promise<boolean>;
  getFolderNameFromImages: (images: unknown) => string | null;
  setEditingProduct: (product: Product | null) => void;
  clearError: () => void;
  clearSuccess: () => void;
  setUploadProgress: (progress: number) => void;
}

// Type guard for Record<string, number>
const isRecordWithNumbers = (value: unknown): value is Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every(v => typeof v === 'number');
};

// Helper function to safely parse JSON - only for sizes
const safeParseSizes = (value: unknown): Record<string, number> => {
  if (!value) return {};

  if (isRecordWithNumbers(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const unescaped = value.replace(/\\"/g, '"').replace(/^"|"$/g, '');
      const parsed = JSON.parse(unescaped);
      return isRecordWithNumbers(parsed) ? parsed : {};
    } catch (error) {
      console.error('Error parsing sizes JSON:', error);
      return {};
    }
  }

  return {};
};

// Helper function to parse images - handles comma-separated strings and converts to array
const parseImages = (images: unknown): string[] => {
  if (!images) return [];
  
  if (Array.isArray(images)) {
    return images.filter((img): img is string => 
      img !== null && typeof img === 'string' && img.trim() !== ''
    );
  }
  
  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed) return [];
    
    if (trimmed.startsWith('http')) {
      return trimmed
        .split(',')
        .map(url => url.trim())
        .filter(url => url !== '');
    }
    
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((img): img is string => 
          img !== null && typeof img === 'string' && img.trim() !== ''
        );
      }
      return [];
    } catch {
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

      if (error) throw error;

      const parsedProducts = (data || []).map(product => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        images: parseImages(product.images)
      }));
      
      set({ products: parsedProducts });
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
        const fileExtension = file.name.split('.').pop();
        const fileName = `${folderName}_${i + 1}.${fileExtension}`;
        const filePath = `${folderName}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ficishoesimages')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('ficishoesimages')
          .getPublicUrl(filePath);
        
        imageUrls.push(urlData.publicUrl);
        
        const progress = ((i + 1) / totalFiles) * 100;
        set({ uploadProgress: progress });
      }
      
      return {
        imageUrls,
        thumbnail: imageUrls[0]
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

      const filePaths = fileList.map(file => `${folderName}/${file.name}`);

      const { error: deleteError } = await supabase.storage
        .from('ficishoesimages')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProductImages:', error);
      return false;
    }
  },

  getFolderNameFromImages: (images: unknown): string | null => {
    if (!images) return null;
    
    const imageArray = Array.isArray(images) 
      ? images.filter((img): img is string => typeof img === 'string')
      : typeof images === 'string'
        ? [images]
        : [];

    if (imageArray.length === 0) return null;
    
    try {
      const firstImageUrl = imageArray[0];
      const urlParts = firstImageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'ficishoesimages');
      
      if (bucketIndex !== -1 && urlParts[bucketIndex + 1]) {
        return urlParts[bucketIndex + 1];
      }
    } catch (error) {
      console.error('Error extracting folder name from images:', error);
    }
    
    return null;
  },

  addProduct: async (productData) => {
    set({ loading: true, error: null });
    
    try {
      const { color, ...dataToSave } = productData;
      
      const formattedData = {
        ...dataToSave,
        sizes: typeof dataToSave.sizes === 'string' 
          ? dataToSave.sizes 
          : JSON.stringify(dataToSave.sizes),
        images: dataToSave.images
      };

      const { error } = await supabase
        .from('products')
        .insert([formattedData])
        .select()
        .single();

      if (error) throw error;

      await get().fetchProducts();
      set({ success: 'Product added successfully' });
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

      const { error } = await supabase
        .from('products')
        .update({
          ...rest,
          sizes: JSON.stringify(sizes),
        })
        .eq('product_id', productId);

      if (error) throw error;

      await get().fetchProducts();
      set({ editingProduct: null });
      return true;
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

      if (error) throw error;

      await get().fetchProducts();
      return true;
    } catch (error) {
      console.error('Update sizes error:', error);
      set({ error: 'Failed to update sizes' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (productId: string): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('product_id', productId)
        .single();

      if (fetchError) throw fetchError;

      const folderName = get().getFolderNameFromImages(product.images);
      
      if (folderName) {
        const imagesDeletionSuccess = await get().deleteProductImages(folderName);
        if (!imagesDeletionSuccess) {
          console.warn('Failed to delete some images, but continuing with product deletion');
        }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;

      await get().fetchProducts();
      set({ success: 'Product deleted successfully' });
      setTimeout(() => set({ success: null }), 3000);
      return true;
    } catch (error) {
      console.error('Delete product error:', error);
      set({ error: 'Failed to delete product' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  setEditingProduct: (product) => set({ editingProduct: product }),
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  setUploadProgress: (progress) => set({ uploadProgress: progress })
}));