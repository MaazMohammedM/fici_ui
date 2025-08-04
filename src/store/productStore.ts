import { create } from 'zustand';
import { supabase } from '@lib/supabase';

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
  thumbnail_url?: string;
  article_id: string;
  created_at: string;
}

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
  selectedGender: string | null;
  selectedPriceRange: string | null;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  
  // Actions
  fetchProducts: (page?: number, filters?: any) => Promise<void>;
  filterProducts: (filters: any) => void;
  searchProducts: (query: string) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  clearError: () => void;
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

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  filteredProducts: [],
  loading: false,
  error: null,
  selectedCategory: null,
  selectedGender: null,
  selectedPriceRange: null,
  searchQuery: '',
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 12,

  fetchProducts: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      
      if (filters.gender && filters.gender !== 'all') {
        query = query.eq('gender', filters.gender);
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const offset = (page - 1) * get().itemsPerPage;
      query = query.range(offset, offset + get().itemsPerPage - 1);
      
      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Fetch error:', error);
        set({ error: 'Failed to fetch products' });
        return;
      }

      // Process products - only parse sizes, images are already arrays
      const processedProducts = (data || []).map(product => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        // images are already arrays from Supabase, no need to parse
        images: Array.isArray(product.images) ? product.images : [],
        thumbnail_url: product.thumbnail_url || null
      }));

      const totalPages = Math.ceil((count || 0) / get().itemsPerPage);

      set({ 
        products: processedProducts,
        filteredProducts: processedProducts,
        currentPage: page,
        totalPages,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: 'Failed to fetch products', loading: false });
    }
  },

  filterProducts: (filters) => {
    const { products } = get();
    let filtered = [...products];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.gender && filters.gender !== 'all') {
      filtered = filtered.filter(product => product.gender === filters.gender);
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        const price = parseFloat(product.discount_price);
        return price >= min && (max ? price <= max : true);
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower)
      );
    }

    set({ 
      filteredProducts: filtered,
      selectedCategory: filters.category || null,
      selectedGender: filters.gender || null,
      selectedPriceRange: filters.priceRange || null,
      searchQuery: filters.search || ''
    });
  },

  searchProducts: (query) => {
    set({ searchQuery: query });
    get().filterProducts({ ...get(), search: query });
  },

  clearFilters: () => {
    const { products } = get();
    set({ 
      filteredProducts: products,
      selectedCategory: null,
      selectedGender: null,
      selectedPriceRange: null,
      searchQuery: ''
    });
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchProducts(page, {
      category: get().selectedCategory,
      gender: get().selectedGender,
      priceRange: get().selectedPriceRange,
      search: get().searchQuery
    });
  },

  clearError: () => set({ error: null })
})); 