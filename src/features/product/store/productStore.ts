import { create } from 'zustand';
import { supabase } from '@lib/supabase';

export interface Product {
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

interface ProductStore {
  products: Product[];
  loading: boolean;
  categoryFilter: string; // empty means no filter
  sortOption: '' | 'discountAsc' | 'discountDesc';
  fetchProducts: () => Promise<void>;
  setCategoryFilter: (category: string) => void;
  setSortOption: (option: '' | 'discountAsc' | 'discountDesc') => void;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  loading: false,
  categoryFilter: '',
  sortOption: '',

  fetchProducts: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('products').select('*');

    if (error) {
      console.error('Error fetching products:', error.message);
      set({ loading: false });
      return;
    }

    set({ products: data || [], loading: false });
  },

  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setSortOption: (option) => set({ sortOption: option })
}));