import { create } from 'zustand';
import { productService } from '@/services/productService';
import type { Product, ProductDetail, Rating } from "../types/product";
import { applyGlobalSorting, paginateProducts } from '@lib/globalSorting';
import { hasAnyStock } from '@lib/utils/stockFilter';

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  totalFilteredCount: number;
  topDeals: Product[];
  relatedProducts: Product[];
  currentProduct: ProductDetail | null;
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
  selectedGender: string | null;
  selectedSubCategory: string | null;
  selectedPriceRange: string | null;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  abortController: AbortController | null;
  sortBy: 'price_low_to_high' | 'price_high_to_low' | null;
  highlightProducts: Product[];
  fetchHighlightProducts: () => Promise<void>;
  clearHighlightProductsCache: () => void;
  setSortBy: (sortBy: 'price_low_to_high' | 'price_high_to_low' | null) => void;
  clearFilters: () => void;
  clearError: () => void;
  fetchSingleProductByArticleId: (articleId: string) => Promise<void>;
  filterProducts: (filters: ProductFilters) => void;
  searchProducts: (query: string) => void;
  setPage: (page: number) => void;
  fetchProducts: (page?: number, filters?: ProductFilters, retryCount?: number) => Promise<void>;
  fetchTopDeals: () => Promise<void>;
  fetchProductByArticleId: (articleId: string) => Promise<void>;
  fetchRelatedProducts: (category: string, currentProductId: string) => Promise<void>;
}

interface ProductFilters {
  category?: string | string[];
  sub_category?: string | string[] | null;
  gender?: string | string[];
  size?: string[];
  search?: string;
  sortBy?: 'price_low_to_high' | 'price_high_to_low' | null;
  priceRange?: string;
  _sizeFilters?: string[];
}

// Helper function to safely parse JSON - only for sizes
const safeParseSizes = (value: any): Record<string, number> => {
  if (!value) return {};
  
  if (typeof value === 'object') return value;
  
  if (typeof value === 'string') {
    try {
      const unescaped = value.replace(/\\"/g, '"').replace(/^"|"$/g, '');
      return JSON.parse(unescaped);
    } catch (error) {
      console.error('Error parsing sizes JSON:', error);
      return {};
    }
  }
  
  return {};
};

// Helper function to parse images - handles comma-separated strings
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

// Helper function to calculate discount percentage on client side (fallback)
const calculateDiscountPercentage = (mrpPrice: string, discountPrice: string): number => {
  try {
    const mrp = parseFloat(mrpPrice);
    const discount = parseFloat(discountPrice);
    
    if (mrp <= 0 || discount <= 0 || discount >= mrp) {
      return 0;
    }
    
    return Math.round(((mrp - discount) / mrp) * 100);
  } catch (error) {
    console.error('Error calculating discount percentage:', error);
    return 0;
  }
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  filteredProducts: [],
  totalFilteredCount: 0,
  topDeals: [],
  relatedProducts: [],
  highlightProducts: [],
  currentProduct: null,
  loading: false,
  error: null,
  selectedCategory: null,
  selectedGender: null,
  selectedSubCategory: null,
  selectedPriceRange: null,
  searchQuery: '',
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 12,
  abortController: null,
  sortBy: null,

  fetchProducts: async (page = 1, filters = {}, retryCount = 0) => {
    const maxRetries = 3;

    // Cancel any ongoing request
    if (get().abortController) {
      get().abortController!.abort();
    }

    const abortController = new AbortController();
    set({ loading: true, error: null, abortController });

    try {
      const result = await productService.fetchProducts(page, get().itemsPerPage, filters);
      
      // Use the paginated result directly from productService
      // productService already handles all filtering, sorting, and pagination
      set({
        products: result.products,
        filteredProducts: result.products,
        totalFilteredCount: result.totalFilteredCount,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        loading: false,
        abortController: null,
        sortBy: filters.sortBy || null
      });

    } catch (error) {
      console.error('Error fetching products:', error);

      // Don't retry on abort errors
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        set({ loading: false, abortController: null });
        return;
      }

      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);

        setTimeout(() => {
          const currentState = get();
          currentState.fetchProducts(page, filters, retryCount + 1);
        }, delay);
        return;
      }

      // Final failure after all retries
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch products after multiple attempts',
        loading: false,
        abortController: null
      });
    }
  },
  clearFilters: () => {
    const { products } = get();
    set({ 
      filteredProducts: products,
      selectedCategory: null,
      selectedGender: null,
      selectedSubCategory: null,
      selectedPriceRange: null,
      searchQuery: '',
      sortBy: null
    });
  },

  fetchTopDeals: async () => {
    set({ loading: true, error: null });
    try {
      const topDeals = await productService.fetchTopDeals();
      set({ topDeals });
    } catch (error) {
      console.error('Error fetching top deals:', error);
      set({ error: 'Failed to fetch top deals' });
    } finally {
      set({ loading: false });
    }
  },

  fetchProductByArticleId: async (articleId: string) => {
    set({ loading: true, error: null, currentProduct: null });

    try {
      const productDetail = await productService.fetchProductByArticleId(articleId);
      
      if (productDetail) {
        set({
          currentProduct: productDetail,
          loading: false
        });
      } else {
        set({ currentProduct: null, error: 'Product not found', loading: false });
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      set({ error: 'Failed to fetch product details', loading: false });
    }
  },
  

  fetchSingleProductByArticleId: async (articleId: string) => {
    set({ loading: true, error: null, currentProduct: null });

    try {
      const productDetail = await productService.fetchSingleProductByArticleId(articleId);
      
      if (productDetail) {
        set({ 
          currentProduct: productDetail,
          loading: false
        });
      } else {
        set({ 
          currentProduct: null,
          error: 'Product not found',
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      set({ error: 'Failed to fetch product details', loading: false });
    }
  },

  fetchRelatedProducts: async (category: string, currentProductId: string) => {
    set({ loading: true, error: null });
    
    try {
      const relatedProducts = await productService.fetchRelatedProducts(category, currentProductId);
      set({ 
        relatedProducts,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching related products:', error);
      set({ error: 'Failed to fetch related products', loading: false });
    }
  },
  fetchHighlightProducts: async () => {
    const now = new Date().toDateString();
    const lastFetched = localStorage.getItem('highlightProductsLastFetched');
    const cachedProducts = localStorage.getItem('highlightProducts');

    // Return cached products if they exist and it's the same day
    // BUT only if cache is less than 1 hour old to ensure deactivated products are removed quickly
    const cacheTimestamp = localStorage.getItem('highlightProductsCacheTimestamp');
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (cachedProducts && lastFetched === now && cacheAge < oneHour) {
      set({ highlightProducts: JSON.parse(cachedProducts) });
      return;
    }

    try {
      const highlightProducts = await productService.fetchHighlightProducts();

      // Cache the results with timestamp
      localStorage.setItem('highlightProducts', JSON.stringify(highlightProducts));
      localStorage.setItem('highlightProductsLastFetched', now);
      localStorage.setItem('highlightProductsCacheTimestamp', Date.now().toString());

      // Set the highlight products state
      set({ highlightProducts });
    } catch (error) {
      console.error('Error fetching highlight products:', error);
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

    if (filters.sub_category && filters.sub_category !== 'all') {
      filtered = filtered.filter(product => product.sub_category === filters.sub_category);
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        const price = parseFloat(String(product.discount_price));
        return price >= min && (max ? price <= max : true);
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      if (searchLower) {
        // Split search terms for flexible matching
        const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
        
        filtered = filtered.filter(product => {
          // Check if any search term matches any field
          return searchTerms.some(term => (
            product.name?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term) ||
            product.category?.toLowerCase().includes(term) ||
            product.sub_category?.toLowerCase().includes(term) ||
            product.gender?.toLowerCase().includes(term) ||
            product.article_id?.toLowerCase().includes(term) ||
            // Search in tags if they exist
            (product.tags && product.tags.some((tag: string) => tag.toLowerCase().includes(term)))
          ));
        });
      }
    }

    set({
      filteredProducts: filtered,
      selectedCategory: Array.isArray(filters.category) ? filters.category[0] : filters.category || null,
      selectedGender: Array.isArray(filters.gender) ? filters.gender[0] : filters.gender || null,
      selectedSubCategory: Array.isArray(filters.sub_category) ? filters.sub_category[0] : filters.sub_category || null,
      selectedPriceRange: filters.priceRange || null,
      searchQuery: filters.search || ''
    });
  },

  searchProducts: (query) => {
    set({ searchQuery: query, currentPage: 1 });
    const { selectedCategory, selectedGender, selectedSubCategory, selectedPriceRange } = get();
    get().fetchProducts(1, {
      category: selectedCategory || undefined,
      gender: selectedGender || undefined,
      sub_category: selectedSubCategory || undefined,
      priceRange: selectedPriceRange || undefined,
      search: query
    });
  },

  setPage: (page) => {
    set({ currentPage: page });
    const { selectedCategory, selectedGender, selectedSubCategory, selectedPriceRange } = get();
    get().fetchProducts(page, {
      category: selectedCategory || undefined,
      gender: selectedGender || undefined,
      sub_category: selectedSubCategory || undefined,
      priceRange: selectedPriceRange || undefined,
      search: get().searchQuery
    });
  },

  clearError: () => set({ error: null }),

  clearHighlightProductsCache: () => {
    localStorage.removeItem('highlightProducts');
    localStorage.removeItem('highlightProductsLastFetched');
    localStorage.removeItem('highlightProductsCacheTimestamp');
  },
  setSortBy: (sortBy: 'price_low_to_high' | 'price_high_to_low' | null) => {
    set({ sortBy });
  }
}));