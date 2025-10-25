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
  abortController: AbortController | null;

  // Actions
  fetchProducts: (page?: number, filters?: any, retryCount?: number) => Promise<void>;
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
  abortController: null,

  fetchProducts: async (page = 1, filters = {}, retryCount = 0) => {
    console.log('productStore: fetchProducts called with page:', page, 'filters:', filters, 'retry:', retryCount);
    const maxRetries = 3;
    const timeoutMs = 30000; // Increased to 30 seconds for better reliability

    // Cancel any ongoing request
    if (get().abortController) {
      get().abortController!.abort();
    }

    const abortController = new AbortController();
    set({ loading: true, error: null, abortController });

    const fetchWithTimeout = async () => {
      return new Promise<{ data: any[]; count: number | null }>(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, timeoutMs);

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

          clearTimeout(timeoutId);

          if (error) {
            console.error('Fetch error:', error);
            reject(error);
            return;
          }

          resolve({ data: data || [], count });
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    };

    try {
      const { data, count } = await fetchWithTimeout();

      // Process products with proper image parsing and discount calculation
      const processedProducts: Product[] = (data || []).map((product: any) => {
        return {
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images),
          thumbnail_url: product.thumbnail_url || null,
          discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
          mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0
        };
      });

      const totalPages = Math.ceil((count || 0) / get().itemsPerPage);

      set({
        products: processedProducts,
        filteredProducts: processedProducts,
        currentPage: page,
        totalPages,
        loading: false,
        abortController: null // Clear abort controller on success
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
        console.log(`Retrying... Attempt ${retryCount + 1}/${maxRetries}`);
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5 seconds delay

        setTimeout(() => {
          // Use the current state to avoid stale closures
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

      const parsedProducts = (data || []).map(product => {
        console.log('Processing top deal product:', {
          article_id: product.article_id,
          mrp_price: product.mrp_price,
          discount_price: product.discount_price,
          name: product.name
        });
        return {
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images),
          discount_percentage: product.discount_percentage || calculateDiscountPercentage(product.mrp_price, product.discount_price),
          mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0
        };
      });

      // Filter products with discount percentage > 10% for top deals
      const topDeals = parsedProducts
        .filter(product => product.discount_percentage > 10)
        .sort((a, b) => b.discount_percentage - a.discount_percentage)
        .slice(0, 6);

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
        // Get the product_id from the first variant to fetch reviews
        const productId = productsData[0].product_id;

        // Fetch average rating from reviews table instead of product_ratings
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', productId);

        let rating: Rating | undefined;
        if (!reviewsError && reviewsData && reviewsData.length > 0) {
          // Calculate average rating
          const totalReviews = reviewsData.length;
          const sumOfRatings = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
          const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;

          // Calculate rating distribution
          const distribution = reviewsData.reduce((dist, review) => {
            const ratingValue = review.rating || 0;
            dist[ratingValue] = (dist[ratingValue] || 0) + 1;
            return dist;
          }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

          rating = {
            average: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            count: totalReviews,
            distribution
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

        const variantsWithColors = processedProducts.map(product => {
          console.log('Processing variant:', {
            article_id: product.article_id,
            mrp_price: product.mrp_price,
            discount_price: product.discount_price,
            name: product.name
          });
          return {
            ...product,
            color: product.article_id.split('_')[1] || 'default',
            mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0
          };
        });

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
        
        // Fetch average rating from reviews table instead of product_ratings
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', productData.product_id);

        let rating: Rating | undefined;
        if (!reviewsError && reviewsData && reviewsData.length > 0) {
          // Calculate average rating
          const totalReviews = reviewsData.length;
          const sumOfRatings = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
          const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;

          // Calculate rating distribution
          const distribution = reviewsData.reduce((dist, review) => {
            const ratingValue = review.rating || 0;
            dist[ratingValue] = (dist[ratingValue] || 0) + 1;
            return dist;
          }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

          rating = {
            average: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            count: totalReviews,
            distribution
          };
        }
        
        const processedProducts = variantsData.map(product => {
          console.log('Processing variant in fetchSingleProductByArticleId:', {
            article_id: product.article_id,
            mrp_price: product.mrp_price,
            discount_price: product.discount_price,
            name: product.name
          });
          return {
            ...product,
            sizes: safeParseSizes(product.sizes),
            images: parseImages(product.images),
            thumbnail_url: product.thumbnail_url || null,
            discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
            rating: rating,
            mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0  // ✅ Fallback to discount_price if mrp_price is missing
          };
        });

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
          const processedProducts = allProducts.map(product => {
            return {
              ...product,
              sizes: safeParseSizes(product.sizes),
              images: parseImages(product.images), // Use the new parseImages function
              thumbnail_url: product.thumbnail_url || null,
              discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
              mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0  // ✅ Fallback to discount_price if mrp_price is missing
            };
          });

          set({ 
            relatedProducts: processedProducts,
            loading: false
          });
          return;
        }
      }

      const processedProducts = (data || []).map(product => {
        return {
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images), // Use the new parseImages function
          thumbnail_url: product.thumbnail_url || null,
          discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
          mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0  // ✅ Fallback to discount_price if mrp_price is missing
        };
      });

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
      const shuffledShoes = shuffleArray(products.filter((p: Product) => p.sub_category === 'Shoes'));
      const shuffledSandals = shuffleArray(products.filter((p: Product) => p.sub_category === 'Sandals'));
      const shuffledBags = shuffleArray(products.filter((p: Product) => p.sub_category === 'Bags'));

      // Select products after shuffling
      const selectedProducts = [
        ...shuffledShoes.slice(0, 2),
        ...shuffledSandals.slice(0, 2),
        ...shuffledBags.slice(0, 1)
      ];

      // Shuffle the final selection to mix categories
      const shuffledSelection = shuffleArray(selectedProducts);

      // Process products with proper image parsing and discount calculation
      const processedProducts = shuffledSelection.map(product => {
        console.log('Processing highlight product:', {
          article_id: product.article_id,
          mrp_price: product.mrp_price,
          discount_price: product.discount_price,
          name: product.name
        });
        return {
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images), // Use the new parseImages function
          thumbnail_url: product.thumbnail_url || null,
          discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
          mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0  // ✅ Fallback to discount_price if mrp_price is missing
        };
      });

      // Cache the results
      localStorage.setItem('highlightProducts', JSON.stringify(processedProducts));
      localStorage.setItem('highlightProductsLastFetched', now);

      // Set the highlight products state
      set({ highlightProducts: processedProducts });
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