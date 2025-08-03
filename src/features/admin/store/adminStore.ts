// ✅ adminStore.ts — Store logic with image upload
import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { ProductFormData } from '@lib/schema/productSchema';

interface Product {
  product_id: string;
  name: string;
  description?: string;
  brand?: string;
  mrpPrice: number;
  discountPrice: number;
  gender: 'men' | 'women' | 'unisex';
  category: 'shoes' | 'sandals' | 'chappals';
  sizes: Record<string, number>;
  images: string[];
  thumbnail_url: string;
}

interface AdminStore {
  products: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (data: ProductFormData) => Promise<void>;
  uploadImages: (articleId: string, files: FileList) => Promise<{ imageUrls: string[]; thumbnail: string } | null>;
  updateSizes: (productId: string, sizes: Record<string, number>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  products: [],

  fetchProducts: async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Fetch error:', error);
    else set({ products: data });
  },

  uploadImages: async (articleId, files) => {
    const imageUrls: string[] = [];

    for (const file of Array.from(files)) {
      const filePath = `${articleId}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);

      if (uploadError) {
        console.error('Image upload error:', uploadError.message);
        return null;
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrls.push(urlData.publicUrl);
    }

    return {
      imageUrls,
      thumbnail: imageUrls[0]
    };
  },

  addProduct: async (formData) => {
    const { sizes, images, mrpPrice, discountPrice, ...rest } = formData;

    const { error } = await supabase.from('products').insert({
      ...rest,
      sizes: JSON.parse(sizes),
      images: images.split(',').map(i => i.trim()),
      mrpPrice: Number(mrpPrice),
      discountPrice: Number(discountPrice)
    });

    if (error) {
      console.error('Insert error:', error);
    } else {
      await get().fetchProducts();
    }
  },

  updateSizes: async (productId, sizes) => {
    const { error } = await supabase
      .from('products')
      .update({ sizes })
      .eq('product_id', productId);

    if (error) {
      console.error('Update error:', error);
    } else {
      await get().fetchProducts();
    }
  },

  deleteProduct: async (productId) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', productId);

    if (error) {
      console.error('Delete error:', error);
    } else {
      await get().fetchProducts();
    }
  }
}));