import { create } from 'zustand';
import { db, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, writeBatch } from '@lib/firebase';
import { ref, getDownloadURL, uploadBytes, uploadString, deleteObject, getStorage, listAll } from '@lib/firebase';
import { httpsCallable, functions } from '@lib/firebase';
import type { EnhancedProductFormData, EditProductFormData } from '@lib/util/formValidation';
import type { Product } from '../../../types/product';
import type { ShippingAddress, AdminOrder } from '../../../types/order';
import { calculateAggregateOrderStatus } from '@store/orderStore';
import { updateOrderItemStatus } from '@/lib/orderActions';
import { useAuthStore } from '@store/authStore';


// Extended Product type for admin functionality
export interface AdminProduct extends Product {
  is_active?: boolean;
  size_prices?: Record<string, number>; // Per-size pricing
  tags?: string[]; // Product tags
}

export interface Return {
  return_id: string;
  order_item_id: string;
  order_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: string;
  thumbnail_url: string;
  product_name: string;
  product_thumbnail_url: string | null;
  price_currency: string;
  color: string;
  mrp: string;
  request_type: 'return' | 'replacement';
  status: 'requested' | 'approved' | 'rejected' | 'replacement_shipped' | 'completed';
  reason_description: string | null;
  reason_code: string | null;
  requested_size: string | null;
  replacement_tracking_id: string | null;
  replacement_tracking_url: string | null;
  requested_at: string;
  return_approved_at: string | null;
  shipped_at: string;
  delivered_at: string;
  shipping_partner: string;
  tracking_id: string;
  tracking_url: string | null;
  orders: {
    order_id: string;
    order_date: string;
    user_id: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    shipping_address: any;
    payment_method: string;
    payment_status: string;
    total_amount: number;
    status: string;
  };
  order_items: {
    product_name: string;
    thumbnail_url: string;
    size: string;
    quantity: number;
    price_at_purchase: string;
    product_id: string;
    color: string;
    mrp: string;
  };
}

interface AdminStore {
  // Product related
  products: any[];
  loading: boolean;
  error: any;
  success: any;
  uploadProgress: number;
  editingProduct: any;
  // Order related
  orders: any[];
  ordersLoading: boolean;
  ordersError: any;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  statusFilter: string;
  searchTerm: string;
  // Returns related
  returns: any[];
  returnsLoading: boolean;
  returnsError: any;
  processingAction: string | null;

  // Product actions
  fetchProducts: () => Promise<void>;
  addProduct: (data: EnhancedProductFormData) => Promise<boolean>;
  updateProduct: (productId: string, data: EditProductFormData) => Promise<boolean>;
  uploadImages: (folderName: string, files: FileList) => Promise<{ imageUrls: string[]; thumbnail: string } | null>;
  updateSizes: (productId: string, sizes: Record<string, number>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  deleteProductImages: (folderName: string) => Promise<boolean>;
  getFolderNameFromImages: (images: unknown) => string | null;
  setEditingProduct: (product: AdminProduct | null) => void;
  clearError: () => void;
  clearSuccess: () => void;
  setUploadProgress: (progress: number) => void;
  
  // Order actions
  fetchOrders: (page?: number, statusFilter?: string, searchTerm?: string) => Promise<void>;
  setOrdersPage: (page: number) => void;
  setStatusFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;
  clearOrdersError: () => void;
  
  // Returns actions
  fetchReturns: () => Promise<void>;
  updateReturnStatus: (returnId: string, action: string, orderItemId?: string, additionalData?: Record<string, any>) => Promise<void>;
  
  // Order management actions
  updateAggregateOrderStatus: (orderId: string) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: string) => Promise<void>;
  updateOrderStatus: (orderId: string, action: string, data?: Record<string, unknown>) => Promise<void>;
  handleUpdateShipment: (orderId: string, selectedItems: string[], shipmentForm: {
    shipping_partner: string;
    tracking_id: string;
    tracking_url: string;
  }) => Promise<void>;
  handleUpdateDeliver: (orderId: string, selectedItems: string[]) => Promise<void>;
  
  // Refund actions
  processRazorpayRefund: (orderId: string, amount: number, reason: string, refReference: string) => Promise<void>;
  
  setProcessingAction: (action: string | null) => void;
  clearReturnsError: () => void;
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
 * Parse size_prices from database - similar to sizes parsing
 */
const safeParseSizePrices = (value: unknown): Record<string, number> => {
  return safeParseSizes(value); // Same logic as sizes
};

/**
 * Parse tags from database - handles arrays and comma-separated strings
 */
const safeParseTags = (value: unknown): string[] => {
  if (!value) return [];

  // Already an array
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => tag !== null && typeof tag === 'string' && tag.trim() !== '')
      .map(tag => tag.trim());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    // Remove outer quotes if present
    let cleaned = trimmed;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // If it contains commas, split by comma
    if (cleaned.includes(',')) {
      return cleaned
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    // Try JSON parsing
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((tag): tag is string => tag !== null && typeof tag === 'string' && tag.trim() !== '')
          .map(tag => tag.trim());
      }
    } catch {
      // Not JSON, return as single tag if it's valid
      return [cleaned];
    }
  }

  return [];
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
  
  // Order related state
  orders: [],
  ordersLoading: false,
  ordersError: null,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 20,
  statusFilter: 'all',
  searchTerm: '',
  
  // Returns related state
  returns: [],
  returnsLoading: false,
  returnsError: null,
  processingAction: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(query(collection(db, 'products')));
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        product_id: doc.data().product_id || '',
        article_id: doc.data().article_id || '',
        name: doc.data().name || '',
        description: doc.data().description || '',
        sub_category: doc.data().sub_category || '',
        mrp_price: doc.data().mrp_price || '',
        discount_price: doc.data().discount_price || '',
        gender: doc.data().gender || '',
        category: doc.data().category || '',
        sizes: doc.data().sizes || {},
        size_prices: doc.data().size_prices || null,
        tags: doc.data().tags || [],
        images: doc.data().images || '',
        is_active: doc.data().is_active !== false, // Default to true if not explicitly false
        mrp: doc.data().mrp || 0,
        color: (doc.data() as any).color || '',
        discount_percentage: doc.data().discount_percentage || 0,
        created_at: (doc.data() as any).created_at || new Date().toISOString()
      }));

      const parsedProducts = data.map(product => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        size_prices: safeParseSizePrices(product.size_prices),
        tags: safeParseTags(product.tags),
        images: parseImages(product.images),
        // Add missing fields with defaults to satisfy AdminProduct interface
        mrp: parseFloat(product.mrp_price) || 0,
        color: (product as { color?: string }).color || '',
        discount_percentage: product.discount_price ? 
          Math.round(((parseFloat(product.mrp_price) - parseFloat(product.discount_price)) / parseFloat(product.mrp_price)) * 100) : 0
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
        const contentType = file.type && file.type.startsWith('image/')
          ? file.type
          : getMimeType(file.name);

        const storageRef = ref(getStorage(), filePath);
        const snapshot = await uploadBytes(storageRef, file, { contentType });
        const downloadURL = await getDownloadURL(snapshot.ref);
        imageUrls.push(downloadURL);
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
      const storageRef = ref(getStorage(), folderName);
      const imageRefs = await listAll(storageRef);

      const deletePromises = imageRefs.items.map((imageRef) => deleteObject(imageRef));
      await Promise.all(deletePromises);

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
      // Format data for storage in Firestore
      const formattedData = {
        ...productData,
        // Store sizes as object (Firestore handles it natively)
        sizes: typeof productData.sizes === 'string'
          ? JSON.parse(productData.sizes)
          : productData.sizes,
        // Store size_prices as object or null
        size_prices: productData.size_prices && productData.size_prices !== '{}'
          ? JSON.parse(productData.size_prices)
          : null,
        // Store images as comma-separated string
        images: Array.isArray(productData.images)
          ? productData.images.join(',')
          : productData.images,
        // Add created_at timestamp
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'products'), formattedData);

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
      const { sizes, size_prices, ...rest } = formData;

      const updateData: Record<string, unknown> = {
        ...rest
      };

      // Only include sizes if they exist
      if (sizes !== undefined) {
        updateData.sizes = sizes; // Send object directly for Firestore
      }

      // Only include size_prices if they exist
      if (size_prices !== undefined) {
        // Handle size_prices - if it's a string and empty, set to null, otherwise parse JSON
        updateData.size_prices = size_prices && size_prices !== '{}' && typeof size_prices === 'string'
          ? JSON.parse(size_prices)
          : size_prices && size_prices !== '{}' && typeof size_prices === 'object'
          ? size_prices
          : null;
      }


      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, updateData);

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
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, { sizes: sizes }); // Send object directly for Firestore

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
      const docRef = doc(db, 'products', productId);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const folderName = get().getFolderNameFromImages(docSnapshot.data().images);

        if (folderName) {
          const imagesDeletionSuccess = await get().deleteProductImages(folderName);
          if (!imagesDeletionSuccess) {
            console.warn('Failed to delete some images, but continuing with product deletion');
          }
        }

        await deleteDoc(docRef);

        await get().fetchProducts();
        set({ success: 'Product deleted successfully' });
        setTimeout(() => set({ success: null }), 3000);
        return true;
      } else {
        console.error('Product not found');
        set({ error: 'Product not found' });
        return false;
      }
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
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  
  // Order actions
  fetchOrders: async (page = 1, statusFilter = 'all', searchTerm = '') => {
    set({ ordersLoading: true, ordersError: null });
    
    try {
      let baseQuery = query(collection(db, 'orders'));
      
      // Apply status filter at database level
      switch (statusFilter) {
        case 'cod-pending':
          baseQuery = query(baseQuery, where('payment_method', '==', 'cod'), where('status', '==', 'pending'));
          break;
        case 'paid-orders':
          baseQuery = query(baseQuery, where('payment_method', '==', 'razorpay'), where('status', '==', 'paid'));
          break;
        case 'pending':
          baseQuery = query(baseQuery, where('payment_method', '==', 'cod'), where('status', '==', 'pending'));
          break;
        case 'paid':
          baseQuery = query(baseQuery, where('status', '==', 'paid'));
          break;
        case 'cancelled':
          baseQuery = query(baseQuery, where('status', '==', 'cancelled'));
          break;
        case 'delivered':
          baseQuery = query(baseQuery, where('status', '==', 'delivered'));
          break;
        case 'shipped':
          baseQuery = query(baseQuery, where('status', '==', 'shipped'));
          break;
        case 'partially_shipped':
          baseQuery = query(baseQuery, where('status', '==', 'partially_shipped'));
          break;
        case 'partially_delivered':
          baseQuery = query(baseQuery, where('status', '==', 'partially_delivered'));
          break;
        case 'partially_cancelled':
          baseQuery = query(baseQuery, where('status', '==', 'partially_cancelled'));
          break;
        case 'all':
        default:
          // For 'all' filter, fetch all orders and filter client-side
          // This is more reliable than complex Supabase queries
          break;
      }

      // Apply search filter (Firebase doesn't support complex OR queries, so we'll handle client-side)
      // Apply pagination and ordering
      const offset = (page - 1) * get().itemsPerPage;
      baseQuery = query(baseQuery, orderBy('created_at', 'desc'));
      
      const snapshot = await getDocs(baseQuery);
      let data = snapshot.docs.map(doc => doc.data() as AdminOrder);
      
      // Fetch order items for all orders
      const orderIds = data.map(order => order.order_id);
      const itemsSnapshot = await getDocs(
        query(collection(db, 'order_items'), where('order_id', 'in', orderIds))
      );
      
      // Create a map of order_id to items for easy lookup
      const itemsMap = new Map();
      itemsSnapshot.docs.forEach(doc => {
        const item = doc.data() as any;
        const orderId = item.order_id;
        if (!itemsMap.has(orderId)) {
          itemsMap.set(orderId, []);
        }
        itemsMap.get(orderId).push(item);
      });
      
      // Attach items to their respective orders
      data = data.map(order => ({
        ...order,
        order_items: itemsMap.get(order.order_id) || []
      }));
      
      // Apply client-side search filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        data = data.filter(order => 
          order.order_id?.toLowerCase().includes(searchLower) ||
          (typeof order.shipping_address === 'object' && order.shipping_address?.name?.toLowerCase().includes(searchLower)) ||
          (typeof order.shipping_address === 'object' && order.shipping_address?.email?.toLowerCase().includes(searchLower)) ||
          (typeof order.shipping_address === 'object' && order.shipping_address?.phone?.includes(searchTerm)) ||
          order.guest_email?.toLowerCase().includes(searchLower)
        );
      }

      // Apply client-side filtering for 'all' case to exclude pending razorpay orders
      let filteredData = data || [];
      let actualCount = data.length;
      
      if (statusFilter === 'all') {
        const originalLength = filteredData.length;
        // Only exclude razorpay orders that are still pending (not paid)
        const excludedOrders = filteredData.filter(order => 
          order.payment_method === 'razorpay' && order.status === 'pending'
        );
        
        filteredData = filteredData.filter(order => 
          !(order.payment_method === 'razorpay' && order.status === 'pending')
        );
        
        // If we filtered out some orders, estimate the total count
        if (filteredData.length !== originalLength) {
          // For now, use the current page data to estimate
          // This will be recalculated on each page navigation
          actualCount = Math.ceil(data.length * (filteredData.length / originalLength));
        }
      }
      
      // Apply pagination
      const paginatedData = filteredData.slice(offset, offset + get().itemsPerPage);

      const totalPages = Math.ceil(actualCount / get().itemsPerPage);

      set({
        orders: filteredData,
        currentPage: page,
        totalPages,
        ordersLoading: false,
        statusFilter,
        searchTerm
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ 
        ordersError: error instanceof Error ? error.message : 'Failed to fetch orders',
        ordersLoading: false 
      });
    }
  },

  setOrdersPage: (page) => {
    set({ currentPage: page });
    get().fetchOrders(page, get().statusFilter, get().searchTerm);
  },

  setStatusFilter: (filter) => {
    set({ statusFilter: filter, currentPage: 1 });
    get().fetchOrders(1, filter, get().searchTerm);
  },

  setSearchTerm: (term) => {
    set({ searchTerm: term, currentPage: 1 });
    get().fetchOrders(1, get().statusFilter, term);
  },

  clearOrdersError: () => set({ ordersError: null }),
  
  // Returns actions
  fetchReturns: async () => {
    set({ returnsLoading: true, returnsError: null });
    console.log('🔍 Fetching returns from returns table...');
    try {
      const snapshot = await getDocs(query(collection(db, 'returns')));
      const data = snapshot.docs.map(doc => doc.data() as Return);
      
      set({ returns: data || [], returnsLoading: false });
    } catch (err: unknown) {
      console.error('Error fetching returns:', err);
      set({ 
        returnsError: err instanceof Error ? err.message : 'Failed to fetch returns',
        returnsLoading: false 
      });
    }
  },

  updateReturnStatus: async (returnId: string, action: string, orderItemId?: string, additionalData?: Record<string, any>) => {
    try {
      set({ processingAction: `return-${returnId}-${action}` });

      // Prepare request body
      const requestBody: Record<string, any> = {
        action: action,
        order_item_id: orderItemId || returnId, // Use order_item_id for edge function
      };

      // Add shipping details for ship_replacement action
      if (action === 'ship_replacement' && additionalData) {
        requestBody.shipping_partner = additionalData.shipping_partner;
        requestBody.tracking_id = additionalData.tracking_id;
        requestBody.tracking_url = additionalData.tracking_url;
      }

      // Add reason for reject_replacement action
      if (action === 'reject_replacement' && additionalData) {
        requestBody.reason = additionalData.reason;
      }

      // Add admin info for approve_replacement action
      if (action === 'approve_replacement' && additionalData) {
        requestBody.approved_by = additionalData.approvedBy;
      }

      // Call edge function to update return status
      const updateReturnStatus = httpsCallable(functions, 'update-item-status');
      const result = await updateReturnStatus({
        body: requestBody,
      });
      
      if ((result.data as any)?.success) {
        // Refresh returns data after successful update
        await get().fetchReturns();
        
        // Set success message based on action
        const successMessages = {
          'request_replacement': 'Replacement request submitted successfully',
          'approve_replacement': 'Replacement approved successfully',
          'reject_replacement': 'Replacement rejected successfully',
          'ship_replacement': 'Replacement shipped successfully',
          'deliver_replacement': 'Replacement marked as delivered successfully',
          'mark_replacement_returned': 'Replacement return marked as completed successfully',
          'refund_item': 'Refund processed successfully',
        };
        
        set({ success: successMessages[action] || 'Status updated successfully' });
      } else {
        throw new Error((result.data as any)?.error || 'Failed to update status');
      }
    } catch (err: unknown) {
      console.error('Error updating return status:', err);
      set({ 
        returnsError: err instanceof Error ? err.message : 'Failed to update return status' 
      });
    } finally {
      set({ processingAction: null });
    }
  },

  // Order management actions
  updateAggregateOrderStatus: async (orderId: string) => {
    try {
      const itemsSnapshot = await getDocs(query(collection(db, 'order_items'), where('order_id', '==', orderId)));
      const items = itemsSnapshot.docs.map(doc => doc.data()) as any[];

      const aggregateStatus = calculateAggregateOrderStatus(items || []);

      await updateDoc(doc(db, 'orders', orderId), {
        status: aggregateStatus,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating aggregate order status:', error);
      throw error;
    }
  },

  updatePaymentStatus: async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        payment_status: status,
        updated_at: new Date().toISOString(),
      });

      await get().fetchOrders(get().currentPage, get().statusFilter, get().searchTerm);
      set({ success: `Payment status updated to ${status}` });
      setTimeout(() => set({ success: null }), 3000);
    } catch (error) {
      console.error('Error updating payment status:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update payment status' });
    }
  },

  updateOrderStatus: async (
    orderId: string,
    action: string,
    data?: Record<string, unknown>
  ) => {
    try {
      set({ processingAction: `${orderId}-${action}` });

      if (action === 'ship') {
        await updateDoc(doc(db, 'orders', orderId), {
          status: 'shipped',
          shipping_partner: data?.shipping_partner || '',
          tracking_id: data?.tracking_id || '',
          tracking_url: data?.tracking_url || '',
          shipped_at: new Date().toISOString(),
        });

        await get().fetchOrders();
        set({ success: 'Order shipped successfully' });
      } else if (action === 'deliver') {
        // This is handled by handleUpdateDeliver
        return;
      } else if (action === 'update_status') {
        await get().updateAggregateOrderStatus(orderId);
        await get().fetchOrders();
        return;
      } else if (action === 'update_payment_status') {
        await get().updatePaymentStatus(orderId, 'paid');
        await get().fetchOrders();
        return;
      } else {
        await updateDoc(doc(db, 'orders', orderId), {
          status: action,
          updated_at: new Date().toISOString(),
        });

        await get().fetchOrders();
        set({ success: `Order ${action} successful` });
      }
      
      setTimeout(() => set({ success: null }), 3000);
    } catch (err: unknown) {
      const errorMessage = `Failed to ${action} order: ${err instanceof Error ? err.message : 'Unknown error'}`;
      set({ error: errorMessage });
      setTimeout(() => set({ error: null }), 5000);
    } finally {
      set({ processingAction: null });
    }
  },

  handleUpdateShipment: async (orderId: string, selectedItems: string[], shipmentForm: {
    shipping_partner: string;
    tracking_id: string;
    tracking_url: string;
  }) => {
    try {
      set({ processingAction: `shipment-${orderId}` });

      const user = useAuthStore.getState().user;

      for (const itemId of selectedItems) {
        await updateOrderItemStatus({
          action: 'ship_item',
          orderItemId: itemId,
          isAdmin: true,
          adminUserId: user?.id,
          shipping_partner: shipmentForm.shipping_partner,
          tracking_id: shipmentForm.tracking_id,
          tracking_url: shipmentForm.tracking_url,
        });
      }

      // The edge function will handle order-level updates, no need to manually update orders table
      await get().fetchOrders();
      set({ success: 'Items shipped successfully' });
      setTimeout(() => set({ success: null }), 3000);
    } catch (error: unknown) {
      console.error('Error in handleUpdateShipment:', error);
      const errorMessage = `Failed to update shipment: ${error instanceof Error ? error.message : 'Unknown error'}`;
      set({ error: errorMessage });
      setTimeout(() => set({ error: null }), 5000);
    } finally {
      set({ processingAction: null });
    }
  },

  handleUpdateDeliver: async (orderId: string, selectedItems: string[]) => {
    try {
      set({ processingAction: `deliver-${orderId}` });

      const user = useAuthStore.getState().user;

      for (const itemId of selectedItems) {
        await updateOrderItemStatus({
          action: 'deliver_item',
          orderItemId: itemId,
          isAdmin: true,
          adminUserId: user?.id,
        });
      }

      // The edge function will handle order-level updates, no need to manually update orders table
      await get().fetchOrders();

      set({ success: `${selectedItems.length} item(s) marked as delivered successfully` });
      setTimeout(() => set({ success: null }), 3000);
    } catch (error: unknown) {
      console.error('Error marking items as delivered:', error);
      const errorMessage = `Failed to mark items as delivered: ${error instanceof Error ? error.message : 'Unknown error'}`;
      set({ error: errorMessage });
      setTimeout(() => set({ error: null }), 5000);
    } finally {
      set({ processingAction: null });
    }
  },

  // Razorpay refund processing
  processRazorpayRefund: async (orderId: string, amount: number, reason: string, refReference: string) => {
    try {
      set({ processingAction: `refund-${orderId}` });

      // First, get the order details to validate it's a Razorpay payment
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      const orderData = orderDoc.data();
      
      if (!orderData) throw new Error('Order not found');
      
      // Validate that this is a Razorpay order
      if (orderData.payment_method !== 'razorpay') {
        throw new Error('Refund can only be processed for Razorpay payments');
      }

      if (orderData.payment_status !== 'paid') {
        throw new Error('Refund can only be processed for paid orders');
      }

      if (!orderData.razorpay_payment_id) {
        throw new Error('No Razorpay payment ID found for this order');
      }

      // For single item orders, use effective_amount if available and matches the passed amount
      let finalAmount = amount;
      if (orderData.order_items && orderData.order_items.length === 1 && orderData.effective_amount) {
        finalAmount = orderData.effective_amount;
      }

      // Call the refund API endpoint
      const processRefund = httpsCallable(functions, 'process-razorpay-refund');
      const { data: refundData } = await processRefund({
        body: {
          payment_id: orderData.razorpay_payment_id,
          amount: Math.round(finalAmount * 100), // Convert to paise
          reason: reason,
          reference_id: refReference
        }
      });

      if ((refundData as any)?.error) {
        console.error('Refund API error:', (refundData as any).error);
        throw new Error((refundData as any).error.message || 'Refund failed');
      }

      // Update the order status to reflect the refund
      await updateDoc(doc(db, 'orders', orderId), {
        payment_status: 'refunded',
        status: 'refunded',
        updated_at: new Date().toISOString(),
      });

      // Log the refund in order_items if needed
      const querySnapshot = await getDocs(query(collection(db, 'order_items'), where('order_id', '==', orderId)));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          refunded_at: new Date().toISOString(),
          item_status: 'refunded',
          refund_amount: finalAmount.toString(),
        });
      });
      
      await batch.commit();
      
      // Set success message
      set({ success: `Refund of ₹${finalAmount} processed successfully` });
    } catch (error: unknown) {
      console.error('Error processing refund:', error);
      const errorMessage = `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`;
      set({ error: errorMessage });
      setTimeout(() => set({ error: null }), 5000);
    } finally {
      set({ processingAction: null });
    }
  },

  setProcessingAction: (action: string | null) => set({ processingAction: action }),
  clearReturnsError: () => set({ returnsError: null })
}));