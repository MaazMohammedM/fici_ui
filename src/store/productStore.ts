import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { Product, ProductDetail, Rating } from "../types/product";

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
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
  
  // Actions
  fetchProducts: (page?: number, filters?: any) => Promise<void>;
  fetchTopDeals: () => Promise<void>;
  fetchProductByArticleId: (articleId: string) => Promise<void>;
  fetchRelatedProducts: (category: string, currentProductId: string) => Promise<void>;
  filterProducts: (filters: any) => void;
  searchProducts: (query: string) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  clearError: () => void;
  fetchSingleProductByArticleId: (articleId: string) => Promise<void>;
  highlightProducts: Product[];
  fetchHighlightProducts: () => Promise<void>;
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
      
      if (filters.sub_category && filters.sub_category !== 'all') {
        query = query.eq('sub_category', filters.sub_category);
      }
      if (filters.gender && filters.gender !== 'all') {
        query = query.eq('gender', filters.gender);
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sub_category.ilike.%${filters.search}%`);
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

      // Process products with proper image parsing and discount calculation
      const processedProducts = (data || []).map(product => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        images: parseImages(product.images), // Use the new parseImages function
        thumbnail_url: product.thumbnail_url || null,
        discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price)
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

  clearFilters: () => {
    const { products } = get();
    set({ 
      filteredProducts: products,
      selectedCategory: null,
      selectedGender: null,
      selectedSubCategory: null,
      selectedPriceRange: null,
      searchQuery: ''
    });
  },

  fetchTopDeals: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch products with discount calculation and filter for good deals
      const { data, error } = await supabase
        .from('products_with_discount')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Fetch top deals error:', error);
        set({ error: 'Failed to fetch top deals' });
        return;
      }

      const parsedProducts = (data || []).map(product => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        images: parseImages(product.images), // Use the new parseImages function
        discount_percentage: product.discount_percentage || calculateDiscountPercentage(product.mrp_price, product.discount_price)
      }));

      // Filter products with discount percentage > 10% for top deals
      const topDeals = parsedProducts
        .filter(product => product.discount_percentage > 10)
        .sort((a, b) => b.discount_percentage - a.discount_percentage) // Sort by highest discount
        .slice(0, 6); // Limit to 6 items

      set({ topDeals });
    } catch (error) {
      console.error('Error fetching top deals:', error);
      set({ error: 'Failed to fetch top deals' });
      set({ loading: false });
    }
  },

  fetchProductByArticleId: async (articleId: string) => {
    set({ loading: true, error: null, currentProduct: null });
    
    try {
      const baseArticleId = articleId.split('_')[0];
      
      // First, fetch the product variants
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .like('article_id', `${baseArticleId}_%`);
  
      if (productsError) throw productsError;
  
      if (productsData && productsData.length > 0) {
        // Fetch ratings for the product
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('product_ratings')
          .select('*')
          .eq('article_id_base', baseArticleId)
          .single();
        
        let rating: Rating | undefined;
        if (!ratingsError && ratingsData) {
          rating = {
            average: parseFloat(ratingsData.average_rating) || 0,
            count: parseInt(ratingsData.review_count) || 0,
            distribution: ratingsData.rating_distribution || {
              1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            }
          };
        }
        
        const processedProducts = productsData.map(product => ({
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images),
          thumbnail_url: product.thumbnail_url || null,
          discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
          rating: rating
        }));
  
        const firstProduct = processedProducts[0];
        const baseId = firstProduct.article_id.split('_')[0];
  
        const variantsWithColors = processedProducts.map(product => ({
          ...product,
          color: product.article_id.split('_')[1] || 'default'
        }));
  
        set({
          currentProduct: {
            article_id: baseId,
            name: firstProduct.name,
            description: firstProduct.description,
            sub_category: firstProduct.sub_category,
            variants: variantsWithColors,
            category: firstProduct.category,
            gender: firstProduct.gender,
            rating: rating,
            total_reviews: rating?.count || 0
          },
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
    set({ loading: true, error: null });
    
    try {
      // First get the base article ID
      const baseArticleId = articleId.split('_')[0];
      
      // Fetch the specific product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('article_id', articleId)
        .single();
        
      if (productError) throw productError;
      
      if (productData) {
        // Fetch all variants
        const { data: variantsData, error: variantsError } = await supabase
          .from('products')
          .select('*')
          .like('article_id', `${baseArticleId}_%`);
          
        if (variantsError) throw variantsError;
        
        // Fetch ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('product_ratings')
          .select('*')
          .eq('article_id_base', baseArticleId)
          .single();
          
        let rating: Rating | undefined;
        if (!ratingsError && ratingsData) {
          rating = {
            average: parseFloat(ratingsData.average_rating) || 0,
            count: parseInt(ratingsData.review_count) || 0,
            distribution: ratingsData.rating_distribution || {
              1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            }
          };
        }
        
        const processedProducts = variantsData.map(product => ({
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images),
          thumbnail_url: product.thumbnail_url || null,
          discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
          rating: rating
        }));

        const productDetail: ProductDetail = {
          article_id: baseArticleId,
          name: productData.name,
          description: productData.description,
          sub_category: productData.sub_category,
          variants: processedProducts,
          category: productData.category,
          gender: productData.gender,
          rating: rating,
          total_reviews: rating?.count || 0
        };

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
      let query = supabase
        .from('products')
        .select('*')
        .neq('product_id', currentProductId)
        .limit(4);

      // Try to get products from same category first
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fetch related products error:', error);
        set({ error: 'Failed to fetch related products' });
        return;
      }

      // If not enough products from same category, get random products
      if (!data || data.length < 4) {
        const { data: randomData, error: randomError } = await supabase
          .from('products')
          .select('*')
          .neq('product_id', currentProductId)
          .limit(4 - (data?.length || 0));

        if (!randomError && randomData) {
          const allProducts = [...(data || []), ...randomData];
          const processedProducts = allProducts.map(product => ({
            ...product,
            sizes: safeParseSizes(product.sizes),
            images: parseImages(product.images), // Use the new parseImages function
            thumbnail_url: product.thumbnail_url || null,
            discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price)
          }));

          set({ 
            relatedProducts: processedProducts,
            loading: false
          });
          return;
        }
      }

      const processedProducts = (data || []).map(product => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        images: parseImages(product.images), // Use the new parseImages function
        thumbnail_url: product.thumbnail_url || null,
        discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price)
      }));

      set({ 
        relatedProducts: processedProducts,
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
    if (cachedProducts && lastFetched === now) {
      set({ highlightProducts: JSON.parse(cachedProducts) });
      return;
    }
  
    try {
      // Get all products
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('sub_category', ['Shoes', 'Sandals', 'Bags']);
  
      if (error) throw error;
  
      // Shuffle function
      const shuffleArray = (array: any[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
      };
  
      // Shuffle products within each category
      const shuffledShoes = shuffleArray(products.filter(p => p.sub_category === 'Shoes'));
      const shuffledSandals = shuffleArray(products.filter(p => p.sub_category === 'Sandals'));
      const shuffledBags = shuffleArray(products.filter(p => p.sub_category === 'Bags'));
  
      // Select products after shuffling
      const selectedProducts = [
        ...shuffledShoes.slice(0, 2),
        ...shuffledSandals.slice(0, 2),
        ...shuffledBags.slice(0, 1)
      ];
  
      // Shuffle the final selection to mix categories
      const shuffledSelection = shuffleArray(selectedProducts);
  
      // Cache the results
      localStorage.setItem('highlightProducts', JSON.stringify(shuffledSelection));
      localStorage.setItem('highlightProductsLastFetched', now);
      
      set({ highlightProducts: shuffledSelection });
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
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.sub_category?.toLowerCase().includes(searchLower)
      );
    }

    set({ 
      filteredProducts: filtered,
      selectedCategory: filters.category || null,
      selectedGender: filters.gender || null,
      selectedSubCategory: filters.sub_category || null,
      selectedPriceRange: filters.priceRange || null,
      searchQuery: filters.search || ''
    });
  },

  searchProducts: (query) => {
    set({ searchQuery: query, currentPage: 1 });
    const { selectedCategory, selectedGender, selectedSubCategory, selectedPriceRange } = get();
    get().fetchProducts(1, {
      category: selectedCategory,
      gender: selectedGender,
      sub_category: selectedSubCategory,
      priceRange: selectedPriceRange,
      search: query
    });
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchProducts(page, {
      category: get().selectedCategory,
      gender: get().selectedGender,
      sub_category: get().selectedSubCategory,
      priceRange: get().selectedPriceRange,
      search: get().searchQuery
    });
  },

  clearError: () => set({ error: null })
}));