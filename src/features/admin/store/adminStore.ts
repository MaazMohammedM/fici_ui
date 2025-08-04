// ✅ adminStore.ts — Enhanced store with proper database handling
import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { EnhancedProductFormData, EditProductFormData } from '@lib/util/formValidation';

interface Product {
  product_id: string;
  name: string;
  description?: string;
  brand?: string;
  mrp_price: string;
  discount_price: string;
  gender: 'men' | 'women' | 'unisex';
  category: 'shoes' | 'sandals' | 'chappals';
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
  uploadImages: (articleId: string, files: FileList) => Promise<{ imageUrls: string[]; thumbnail: string } | null>;
  updateSizes: (productId: string, sizes: Record<string, number>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
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
          brand,
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
        // Parse only sizes, images are already arrays
        const parsedProducts = (data || []).map(product => ({
          ...product,
          sizes: safeParseSizes(product.sizes),
          // images are already arrays from Supabase, no need to parse
          images: Array.isArray(product.images) ? product.images : []
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

  uploadImages: async (articleId, files) => {
    const imageUrls: string[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create unique filename with timestamp
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${i + 1}.${fileExtension}`;
        const filePath = `${articleId}/${fileName}`;
        
        console.log(`Uploading file ${i + 1}/${totalFiles}: ${fileName}`);
        
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

  addProduct: async (productData) => {
    set({ loading: true, error: null });
    
    try {
      // Ensure sizes is properly formatted as JSON
      const formattedData = {
        ...productData,
        sizes: typeof productData.sizes === 'string' 
          ? productData.sizes 
          : JSON.stringify(productData.sizes),
        images: typeof productData.images === 'string'
          ? productData.images
          : JSON.stringify(productData.images)
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
        sizes: JSON.stringify(sizes)
      });

      const { error } = await supabase
        .from('products')
        .update({
          ...rest,
          sizes: JSON.stringify(sizes)
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

  deleteProduct: async (productId) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productId);

      if (error) {
        console.error('Delete error:', error);
        set({ error: 'Failed to delete product' });
      } else {
        await get().fetchProducts();
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