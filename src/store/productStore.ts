import { create } from 'zustand';
import { supabase } from '@lib/supabase';
import type { Product, ProductDetail, Rating } from "../types/product";
import { applyGlobalSorting, paginateProducts } from '@lib/globalSorting';
import { hasAnyStock } from '@lib/utils/stockFilter';

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
  sub_category?: string | string[];
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
    const timeoutMs = 30000;

    // Cancel any ongoing request
    if (get().abortController) {
      get().abortController!.abort();
    }

    const abortController = new AbortController();
    set({ loading: true, error: null, abortController });

    try {
      // Fetch ALL products without pagination for global sorting
      // Only fetch essential fields for listing page - exclude full images array
      const { data, error, count } = await supabase
        .from('products')
        .select(`
          product_id,
          article_id,
          name,
          category,
          sub_category,
          gender,
          thumbnail_url,
          mrp_price,
          discount_price,
          sizes,
          is_active,
          created_at
        `, { count: 'exact' })
        .eq('is_active', true);

      if (error) throw error;

      const processedProducts: Product[] = (data || []).map((product: any) => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        images: [], // Empty array for listing pages - images fetched only when needed
        thumbnail_url: product.thumbnail_url || null,
        discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
        mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0,
        color: product.article_id?.split('_')[1] || 'default' // Extract color from article_id
      }));

      // Apply global sorting (stock first, then price)
      const globallySortedProducts = applyGlobalSorting(processedProducts, {
        sortBy: filters.sortBy,
        search: filters.search,
        category: Array.isArray(filters.category) ? filters.category : (filters.category ? [filters.category] : undefined),
        gender: Array.isArray(filters.gender) ? filters.gender : (filters.gender ? [filters.gender] : undefined),
        subCategory: Array.isArray(filters.sub_category) ? filters.sub_category : (filters.sub_category ? [filters.sub_category] : undefined),
        sizeFilters: (filters as any)._sizeFilters
      });

      // Apply pagination to globally sorted results
      const paginatedProducts = paginateProducts(globallySortedProducts, page, get().itemsPerPage);

      // Calculate totalPages based on filtered products count, not total database count
      const totalPages = Math.ceil(globallySortedProducts.length / get().itemsPerPage);

      set({
        products: paginatedProducts,
        filteredProducts: paginatedProducts,
        currentPage: page,
        totalPages,
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
      // Fetch more products to account for out-of-stock filtering
      // Only fetch essential fields for listing page
      const { data, error } = await supabase
        .from('products_with_discount')
        .select(`
          product_id,
          article_id,
          name,
          category,
          gender,
          thumbnail_url,
          mrp_price,
          discount_price,
          discount_percentage,
          sizes,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20); // Fetch more to ensure we have enough after filtering

      if (error) {
        console.error('Fetch top deals error:', error);
        set({ error: 'Failed to fetch top deals' });
        return;
      }

      const parsedProducts = (data || []).map(product => {
        return {
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: [], // Empty array for listing pages - images fetched only when needed
          thumbnail_url: product.thumbnail_url || null,
          discount_percentage: product.discount_percentage || calculateDiscountPercentage(product.mrp_price, product.discount_price),
          mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0,
          color: product.article_id?.split('_')[1] || 'default' // Extract color from article_id
        };
      });

      // Filter products with discount percentage > 10% for top deals
      const topDeals = parsedProducts
        .filter(product => product.discount_percentage > 10)
        .sort((a, b) => b.discount_percentage - a.discount_percentage)
        .slice(0, 12); // Take more to account for stock filtering

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
      // Always extract base article ID to fetch ALL variants
      // This ensures all colors are shown regardless of which specific color URL is accessed
      const baseArticleId = articleId.split('_')[0];
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
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
    set({ loading: true, error: null, currentProduct: null });

    try {
      // Check if this is a full article ID (contains underscore) or base ID
      const isFullArticleId = articleId.includes('_');
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (isFullArticleId) {
        // Fetch the specific variant
        query = query.eq('article_id', articleId);
      } else {
        // Fetch all variants for the base article ID
        query = query.like('article_id', `${articleId}_%`);
      }

      const { data: variantsData, error: variantsError } = await query;

      if (variantsError) throw variantsError;

      if (variantsData && variantsData.length > 0) {
        const productData = variantsData[0];
        
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
          return {
            ...product,
            sizes: safeParseSizes(product.sizes),
            images: parseImages(product.images),
            thumbnail_url: product.thumbnail_url || null,
            discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
            rating: rating,
            mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0
          };
        });

        const baseArticleId = processedProducts[0].article_id.split('_')[0];

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
        .eq('is_active', true)
        .neq('product_id', currentProductId)
        .limit(8); // Fetch more to ensure we have enough after filtering

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
      if (!data || data.length < 8) {
        const { data: randomData, error: randomError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('product_id', currentProductId)
          .limit(8 - (data?.length || 0));

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
    // BUT only if cache is less than 1 hour old to ensure deactivated products are removed quickly
    const cacheTimestamp = localStorage.getItem('highlightProductsCacheTimestamp');
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (cachedProducts && lastFetched === now && cacheAge < oneHour) {
      set({ highlightProducts: JSON.parse(cachedProducts) });
      return;
    }

    try {
      // Get more products to account for out-of-stock filtering
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('sub_category', ['Shoes', 'Sandals', 'Bags'])
        .limit(30); // Fetch more to ensure we have enough after filtering

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

      // Check if sandals and bags have in-stock products
      const sandalsInStock = products.filter((p: Product) => p.sub_category === 'Sandals' && hasAnyStock(p)).length > 0;
      const bagsInStock = products.filter((p: Product) => p.sub_category === 'Bags' && hasAnyStock(p)).length > 0;
      
      // Select products with priority logic
      let selectedProducts = [];
      if (!sandalsInStock && !bagsInStock) {
        // Both sandals and bags out of stock, prioritize shoes
        const shuffledShoes = shuffleArray(products.filter((p: Product) => p.sub_category === 'Shoes'));
        selectedProducts = [
          ...shuffledShoes.slice(0, 12), // Take more shoes to ensure 5 products
          ...shuffledSandals.slice(0, 4), // Take some sandals
          ...shuffledBags.slice(0, 2) // Take some bags
        ];
      } else {
        // Normal logic: take more products from each category
        selectedProducts = [
          ...shuffledShoes.slice(0, 8), // Take more shoes to account for out-of-stock
          ...shuffledSandals.slice(0, 8), // Take more sandals to account for out-of-stock
          ...shuffledBags.slice(0, 6) // Take more bags to account for out-of-stock
        ];
      }

      // Shuffle the final selection to mix categories
      const shuffledSelection = shuffleArray(selectedProducts);

      // Process products with proper image parsing and discount calculation
      const processedProducts = shuffledSelection.map(product => {
        return {
          ...product,
          sizes: safeParseSizes(product.sizes),
          images: parseImages(product.images), // Use the new parseImages function
          thumbnail_url: product.thumbnail_url || null,
          discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
          mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0  // ✅ Fallback to discount_price if mrp_price is missing
        };
      });

      // Cache the results with timestamp
      localStorage.setItem('highlightProducts', JSON.stringify(processedProducts));
      localStorage.setItem('highlightProductsLastFetched', now);
      localStorage.setItem('highlightProductsCacheTimestamp', Date.now().toString());

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