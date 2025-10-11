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

// ============================================================
// PARSING HELPERS - Handle Supabase storage quirks
// ============================================================

/**
 * Parse sizes from database - handles multiple formats from Supabase
 * Database stores as JSONB but can come back stringified
 */
const safeParseSizes = (value: unknown): Record<string, number> => {
  if (!value) return {};

  // Already parsed as object
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (Object.values(obj).every(v => typeof v === 'number')) {
      return obj as Record<string, number>;
    }
  }

  // String that needs parsing
  if (typeof value === 'string') {
    try {
      // Remove outer quotes and escape sequences
      let cleaned = value.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      
      // Handle double escaping (\\\" -> \")
      cleaned = cleaned.replace(/\\"/g, '"');
      
      const parsed = JSON.parse(cleaned);
      
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Convert string keys to numbers if needed
        const result: Record<string, number> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          if (typeof val === 'number') {
            result[key] = val;
          }
        });
        return result;
      }
    } catch (error) {
      console.error('Error parsing sizes:', error, 'Raw value:', value);
      return {};
    }
  }

  return {};
};

/**
 * Parse images from database - handles arrays and comma-separated strings
 * Returns clean array of image URLs
 */
const parseImages = (images: unknown): string[] => {
  if (!images) return [];

  // Already an array
  if (Array.isArray(images)) {
    return images
      .filter((img): img is string => img !== null && typeof img === 'string' && img.trim() !== '')
      .map(url => url.trim());
  }

  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed) return [];

    // Remove outer quotes if present
    let cleaned = trimmed;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // If it contains URLs, split by comma
    if (cleaned.includes('http')) {
      return cleaned
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    }

    // Try JSON parsing
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((img): img is string => img !== null && typeof img === 'string' && img.trim() !== '')
          .map(url => url.trim());
      }
    } catch {
      // Not JSON, return as single URL if it's valid
      if (cleaned.startsWith('http')) {
        return [cleaned];
      }
    }
  }

  return [];
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeMap[ext] || 'image/jpeg';
};

/**
 * Extract color from article_id
 * Format: SHXXX_color (e.g., SH0001_black)
 */
const extractColorFromArticleId = (articleId: string): string => {
  const parts = articleId.split('_');
  return parts.slice(1).join('_') || 'default';
};

// ============================================================
// ZUSTAND STORE
// ============================================================

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
        const mimeType = getMimeType(file.name);

        console.log('Uploading file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          fileName,
          filePath,
          mimeType
        });

        const { error: uploadError } = await supabase.storage
          .from('ficishoesimages')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: mimeType // CRITICAL: Set correct MIME type
          });

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

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
      // Extract color from article_id if needed
      const { color, ...dataWithoutColor } = productData;
      
      // Format data for storage in Supabase
      const formattedData = {
        ...dataWithoutColor,
        // Store sizes as clean JSON object (Supabase JSONB will handle it)
        sizes: typeof productData.sizes === 'string'
          ? productData.sizes
          : JSON.stringify(productData.sizes),
        // Store images as comma-separated string (NOT double-stringified)
        images: Array.isArray(productData.images)
          ? productData.images.join(',')
          : productData.images
      };

      console.log('Adding product with data:', {
        ...formattedData,
        images: `[${(formattedData.images as string).split(',').length} images]`
      });

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
      set({ error: error instanceof Error ? error.message : 'Failed to add product' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (productId, formData) => {
    set({ loading: true, error: null });
    try {
      const { sizes, ...rest } = formData;

      const updateData = {
        ...rest,
        sizes: JSON.stringify(sizes)
      };

      console.log('Updating product:', productId, updateData);

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('product_id', productId);

      if (error) {
        console.error('Update error:', error);
        set({ error: `Failed to update product: ${error.message}` });
        return false;
      }

      await get().fetchProducts();
      set({ editingProduct: null, success: 'Product updated successfully' });
      setTimeout(() => set({ success: null }), 3000);
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