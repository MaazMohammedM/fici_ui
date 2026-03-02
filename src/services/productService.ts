import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  type DocumentData,
  type Query 
} from '@/lib/firebase';
import type { Product, ProductDetail, Rating } from '@/types/product'

// Helper function to safely parse JSON - only for sizes
const safeParseSizes = (value: any): Record<string, number> => {
  if (!value) return {}
  
  if (typeof value === 'object') return value
  
  if (typeof value === 'string') {
    try {
      const unescaped = value.replace(/\\"/g, '"').replace(/^"|"$/g, '')
      return JSON.parse(unescaped)
    } catch (error) {
      console.error('Error parsing sizes JSON:', error)
      return {}
    }
  }
  
  return {}
}

// Helper function to parse images - handles comma-separated strings
const parseImages = (images: any): string[] => {
  if (!images) return []
  
  // If it's already an array, filter valid URLs
  if (Array.isArray(images)) {
    return images.filter(img => img && typeof img === 'string' && img.trim() !== '')
  }
  
  // If it's a string, check if it's comma-separated URLs
  if (typeof images === 'string') {
    const trimmed = images.trim()
    if (!trimmed) return []
    
    // Check if it starts with http (likely comma-separated URLs)
    if (trimmed.startsWith('http')) {
      return trimmed.split(',').map(url => url.trim()).filter(url => url !== '')
    }
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter(img => img && typeof img === 'string' && img.trim() !== '')
      }
      return []
    } catch (e) {
      // If JSON parsing fails and it's not a URL, treat as single image
      return [trimmed]
    }
  }
  
  return []
}

// Helper function to calculate discount percentage on client side (fallback)
const calculateDiscountPercentage = (mrpPrice: string, discountPrice: string): number => {
  try {
    const mrp = parseFloat(mrpPrice)
    const discount = parseFloat(discountPrice)
    
    if (mrp <= 0 || discount <= 0 || discount >= mrp) {
      return 0
    }
    
    return Math.round(((mrp - discount) / mrp) * 100)
  } catch (error) {
    console.error('Error calculating discount percentage:', error)
    return 0
  }
}

class ProductService {
  private static instance: ProductService

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService()
    }
    return ProductService.instance
  }

  // Fetch all products with pagination
  // Replace the fetchProducts method in productService.ts (lines 102-175)

async fetchProducts(page = 1, itemsPerPage = 12, filters: any = {}): Promise<{
  products: Product[]
  totalFilteredCount: number
  totalPages: number
  currentPage: number
}> {
  try {
    // Build base query with only is_active filter
    let q: Query = collection(db, 'products')
    q = query(q, where('is_active', '==', true))
    q = query(q, orderBy('created_at', 'desc'))
    
    // Get all active products first
    const snapshot = await getDocs(q)
    let allProducts = this.processProducts(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })))
    
    // Apply client-side filtering for category, gender, sub_category
    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category]
      allProducts = allProducts.filter(product => categories.includes(product.category))
    }
    
    if (filters.gender) {
      const genders = Array.isArray(filters.gender) ? filters.gender : [filters.gender]
      allProducts = allProducts.filter(product => genders.includes(product.gender))
    }
    
    if (filters.sub_category) {
      const subCategories = Array.isArray(filters.sub_category) ? filters.sub_category : [filters.sub_category]
      allProducts = allProducts.filter(product => subCategories.includes(product.sub_category))
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim()
      if (searchLower) {
        const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0)
        
        allProducts = allProducts.filter(product => {
          return searchTerms.some(term => (
            product.name?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term) ||
            product.category?.toLowerCase().includes(term) ||
            product.sub_category?.toLowerCase().includes(term) ||
            product.gender?.toLowerCase().includes(term) ||
            product.article_id?.toLowerCase().includes(term)
          ))
        })
      }
    }
    
    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number)
      allProducts = allProducts.filter(product => {
        const price = parseFloat(String(product.discount_price))
        return price >= min && (max ? price <= max : true)
      })
    }
    
    // Apply size filtering
    if (filters.size && filters.size.length > 0) {
      allProducts = allProducts.filter(product => {
        return filters.size.some((sizeFilter: string) => {
          const [gender, sizeValue] = sizeFilter.split('-')
          return product.sizes && product.sizes[sizeValue] && product.sizes[sizeValue] > 0
        })
      })
    }
    
    // Apply sorting
    if (filters.sortBy === 'price_low_to_high') {
      allProducts.sort((a, b) => a.mrp - b.mrp)
    } else if (filters.sortBy === 'price_high_to_low') {
      allProducts.sort((a, b) => b.mrp - a.mrp)
    }
    
    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedProducts = allProducts.slice(startIndex, endIndex)
    
    return {
      products: paginatedProducts,
      totalFilteredCount: allProducts.length,
      totalPages: Math.ceil(allProducts.length / itemsPerPage),
      currentPage: page
    }
  } catch (error: any) {
    console.error('Error fetching products:', error)
    throw new Error(error.message || 'Failed to fetch products')
  }
}
  // Fetch top deals
  async fetchTopDeals(): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('is_active', '==', true),
        orderBy('created_at', 'desc'),
        limit(20)
      )
      
      const snapshot = await getDocs(q)
      const products = this.processProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      // Filter products with discount percentage > 10% for top deals
      const topDeals = products
        .filter(product => product.discount_percentage > 10)
        .sort((a, b) => b.discount_percentage - a.discount_percentage)
        .slice(0, 12)
      
      return topDeals
    } catch (error: any) {
      console.error('Error fetching top deals:', error)
      throw new Error(error.message || 'Failed to fetch top deals')
    }
  }

  // Fetch product by article ID
  async fetchProductByArticleId(articleId: string): Promise<ProductDetail | null> {
    try {
      // Always extract base article ID to fetch ALL variants
      const baseArticleId = articleId.split('_')[0]
      
      const q = query(
        collection(db, 'products'),
        where('is_active', '==', true),
        where('article_id', '>=', baseArticleId + '_'),
        where('article_id', '<', baseArticleId + '`')
      )
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const processedProducts = this.processProductsWithImages(productsData)
      
      // Get rating from reviews
      const rating = await this.getProductRating(productsData[0].id)
      
      const firstProduct = processedProducts[0]
      const baseId = firstProduct.article_id.split('_')[0]
      
      const variantsWithColors = processedProducts.map(product => ({
        ...product,
        color: product.article_id.split('_')[1] || 'default',
        mrp: parseFloat(String(product.mrp_price)) || parseFloat(String(product.discount_price)) || 0
      }))
      
      return {
        article_id: baseId,
        name: firstProduct.name,
        description: firstProduct.description,
        sub_category: firstProduct.sub_category,
        variants: variantsWithColors,
        category: firstProduct.category,
        gender: firstProduct.gender,
        rating: rating,
        total_reviews: rating?.count || 0
      }
    } catch (error: any) {
      console.error('Error fetching product by article ID:', error)
      throw new Error(error.message || 'Failed to fetch product')
    }
  }

  // Fetch single product by article ID
  async fetchSingleProductByArticleId(articleId: string): Promise<ProductDetail | null> {
    try {
      const isFullArticleId = articleId.includes('_')
      
      let q: Query = collection(db, 'products')
      q = query(q, where('is_active', '==', true))
      
      if (isFullArticleId) {
        q = query(q, where('article_id', '==', articleId))
      } else {
        const baseArticleId = articleId
        q = query(q, where('article_id', '>=', baseArticleId + '_'))
        q = query(q, where('article_id', '<', baseArticleId + '`'))
      }
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const processedProducts = this.processProductsWithImages(productsData)
      
      // Get rating from reviews
      const rating = await this.getProductRating(productsData[0].id)
      
      const productData = processedProducts[0]
      const baseArticleId = processedProducts[0].article_id.split('_')[0]
      
      return {
        article_id: baseArticleId,
        name: productData.name,
        description: productData.description,
        sub_category: productData.sub_category,
        variants: processedProducts,
        category: productData.category,
        gender: productData.gender,
        rating: rating,
        total_reviews: rating?.count || 0
      }
    } catch (error: any) {
      console.error('Error fetching single product by article ID:', error)
      throw new Error(error.message || 'Failed to fetch product')
    }
  }

  // Fetch related products
  async fetchRelatedProducts(category: string, currentProductId: string): Promise<Product[]> {
    try {
      console.log('Fetching related products with simplified query...')
      
      // Ultra-simple query - just get active products with basic index
      const baseQuery = query(
        collection(db, 'products'),
        where('is_active', '==', true),
        limit(20) // Smaller limit for faster response
      )
      
      const snapshot = await getDocs(baseQuery)
      let allProducts = this.processProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      console.log(`Found ${allProducts.length} active products`)
      
      // Simple filtering
      allProducts = allProducts.filter(product => product.product_id !== currentProductId)
      
      let relatedProducts: Product[] = []
      
      if (category && category.trim()) {
        const categoryProducts = allProducts.filter(product => 
          product.category && product.category === category
        )
        relatedProducts = categoryProducts.slice(0, 8)
        
        if (relatedProducts.length < 8) {
          const remainingProducts = allProducts.filter(product => 
            (!product.category || product.category !== category) && 
            !relatedProducts.some(rp => rp.product_id === product.product_id)
          )
          const additionalCount = 8 - relatedProducts.length
          const randomProducts = this.shuffleArray(remainingProducts).slice(0, additionalCount)
          relatedProducts = [...relatedProducts, ...randomProducts]
        }
      } else {
        relatedProducts = this.shuffleArray(allProducts).slice(0, 8)
      }
      
      console.log(`Returning ${relatedProducts.length} related products`)
      return relatedProducts
    } catch (error: any) {
      console.error('Error fetching related products:', error)
      // Return empty array as fallback
      return []
    }
  }

  // Helper method to shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Fetch highlight products
  async fetchHighlightProducts(): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('is_active', '==', true),
        where('sub_category', 'in', ['Shoes', 'Sandals', 'Bags']),
        limit(30)
      )
      
      const snapshot = await getDocs(q)
      const products = this.processProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      // Shuffle function
      const shuffleArray = (array: any[]) => {
        const newArray = [...array]
        for (let i = newArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const temp = newArray[i]
          newArray[i] = newArray[j]
          newArray[j] = temp
        }
        return newArray
      }
      
      // Shuffle products within each category
      const shuffledShoes = shuffleArray(products.filter(p => p.sub_category === 'Shoes'))
      const shuffledSandals = shuffleArray(products.filter(p => p.sub_category === 'Sandals'))
      const shuffledBags = shuffleArray(products.filter(p => p.sub_category === 'Bags'))
      
      // Select products with priority logic
      const selectedProducts = [
        ...shuffledShoes.slice(0, 8),
        ...shuffledSandals.slice(0, 8),
        ...shuffledBags.slice(0, 6)
      ]
      
      // Shuffle the final selection to mix categories
      return shuffleArray(selectedProducts)
    } catch (error: any) {
      console.error('Error fetching highlight products:', error)
      throw new Error(error.message || 'Failed to fetch highlight products')
    }
  }

  // Get product rating from reviews
  private async getProductRating(productId: string): Promise<Rating | undefined> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('product_id', '==', productId)
      )
      
      const reviewsSnapshot = await getDocs(reviewsQuery)
      
      if (reviewsSnapshot.empty) {
        return undefined
      }
      
      const reviews = reviewsSnapshot.docs.map(doc => doc.data())
      const totalReviews = reviews.length
      const sumOfRatings = reviews.reduce((sum, review) => sum + ((review as any).rating || 0), 0)
      const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0
      
      // Calculate rating distribution
      const distribution = reviews.reduce((dist: Record<number, number>, review) => {
        const ratingValue = (review as any).rating || 0
        dist[ratingValue] = (dist[ratingValue] || 0) + 1
        return dist
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
      
      return {
        average: Math.round(averageRating * 10) / 10,
        count: totalReviews,
        distribution: distribution as { 1: number; 2: number; 3: number; 4: number; 5: number; }
      }
    } catch (error) {
      console.error('Error getting product rating:', error)
      return undefined
    }
  }

  // Process products for listing
  private processProducts(products: any[]): Product[] {
    return products.map(product => ({
      ...product,
      sizes: safeParseSizes(product.sizes),
      images: [], // Empty array for listing pages
      thumbnail_url: product.thumbnail_url || null,
      discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
      mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0,
      color: product.article_id?.split('_')[1] || 'default'
    }))
  }

  // Process products with full images for detail pages
  private processProductsWithImages(products: any[]): Product[] {
    return products.map(product => ({
      ...product,
      sizes: safeParseSizes(product.sizes),
      images: parseImages(product.images),
      thumbnail_url: product.thumbnail_url || null,
      discount_percentage: calculateDiscountPercentage(product.mrp_price, product.discount_price),
      mrp: parseFloat(product.mrp_price) || parseFloat(product.discount_price) || 0
    }))
  }
}

export const productService = ProductService.getInstance()
