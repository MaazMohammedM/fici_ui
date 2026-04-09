import { create } from 'zustand';
import { supabase } from '@lib/supabase';
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
  products: AdminProduct[];
  loading: boolean;
  error: string | null;
  success: string | null;
  uploadProgress: number;
  editingProduct: AdminProduct | null;
  
  // Order related
  orders: AdminOrder[];
  ordersLoading: boolean;
  ordersError: string | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  statusFilter: string;
  searchTerm: string;
  
  // Returns related
  returns: Return[];
  returnsLoading: boolean;
  returnsError: string | null;
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
 * Transform old Supabase URLs to custom domain
 */
const transformImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return url;
  
  // Replace old Supabase URLs with custom domain
  return url.replace(
    /https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/ficishoesimages\//g,
    'https://api.ficishoes.com/storage/v1/object/public/ficishoesimages/'
  );
};

/**
 * Parse images from database - handles arrays and comma-separated strings
 * Returns clean array of image URLs with transformed domain
 */
const parseImages = (images: unknown): string[] => {
  if (!images) return [];

  // Helper to process individual URLs
  const processUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    return transformImageUrl(trimmed);
  };

  // Already an array
  if (Array.isArray(images)) {
    return images
      .filter((img): img is string => img !== null && typeof img === 'string' && img.trim() !== '')
      .map(processUrl)
      .filter(url => url.length > 0);
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
        .map(processUrl)
        .filter(url => url.length > 0);
    }

    // Try JSON parsing
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((img): img is string => img !== null && typeof img === 'string' && img.trim() !== '')
          .map(processUrl)
          .filter(url => url.length > 0);
      }
    } catch {
      // Not JSON, return as single URL if it's valid
      if (cleaned.startsWith('http')) {
        const transformed = processUrl(cleaned);
        return transformed ? [transformed] : [];
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
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          description,
          sub_category,
          mrp_price,
          discount_price,
          gender,
          category,
          sizes,
          images,
          thumbnail_url,
          article_id,
          created_at,
          is_active,
          size_prices,
          tags
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedProducts = (data || []).map(product => ({
        ...product,
        sizes: safeParseSizes(product.sizes),
        size_prices: safeParseSizePrices(product.size_prices),
        tags: safeParseTags(product.tags),
        images: parseImages(product.images),
        thumbnail_url: product.thumbnail_url ? transformImageUrl(product.thumbnail_url) : product.thumbnail_url,
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

        const { error: uploadError } = await supabase.storage
          .from('ficishoesimages')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType
          });

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Construct URL manually using custom domain instead of Supabase's getPublicUrl
        const publicUrl = `https://api.ficishoes.com/storage/v1/object/public/ficishoesimages/${filePath}`;
        imageUrls.push(publicUrl);

        const progress = ((i + 1) / totalFiles) * 100;
        set({ uploadProgress: progress });
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
      const { data: fileList, error: listError } = await supabase.storage
        .from('ficishoesimages')
        .list(folderName);

      if (listError) {
        console.error('Error listing files:', listError);
        return false;
      }

      if (!fileList || fileList.length === 0) {
        return true;
      }

      const filePaths = fileList.map(file => `${folderName}/${file.name}`);

      const { error: deleteError } = await supabase.storage
        .from('ficishoesimages')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
        return false;
      }

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
      // Format data for storage in Supabase
      const formattedData = {
        ...productData,
        // Store sizes as clean JSON object (Supabase JSONB will handle it)
        sizes: typeof productData.sizes === 'string'
          ? productData.sizes
          : JSON.stringify(productData.sizes),
        // Store size_prices as JSON object or null (not stringified)
        size_prices: productData.size_prices && productData.size_prices !== '{}'
          ? JSON.parse(productData.size_prices)
          : null,
        // Store images as comma-separated string (NOT double-stringified)
        images: Array.isArray(productData.images)
          ? productData.images.join(',')
          : productData.images
      };

      const { error } = await supabase
        .from('products')
        .insert([formattedData])
        .select()
        .single();

      if (error) throw error;

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
        updateData.sizes = sizes; // Send object directly for JSONB
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


      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('product_id', productId)
        .select();

      if (error) {
        console.error('❌ Supabase update error:', error);
        set({ error: `Failed to update product: ${error.message}` });
        return false;
      }


      if (!data || data.length === 0) {
        console.error('❌ No data returned from update');
        set({ error: 'Product update failed - no data returned' });
        return false;
      }

      await get().fetchProducts();
      set({ editingProduct: null, success: 'Product updated successfully' });
      setTimeout(() => set({ success: null }), 3000);
      return true;
    } catch (error) {
      console.error('💥 Update product error:', error);
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

      if (error) throw error;

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
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('product_id', productId)
        .single();

      if (fetchError) throw fetchError;

      const folderName = get().getFolderNameFromImages(product.images);

      if (folderName) {
        const imagesDeletionSuccess = await get().deleteProductImages(folderName);
        if (!imagesDeletionSuccess) {
          console.warn('Failed to delete some images, but continuing with product deletion');
        }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;

      await get().fetchProducts();
      set({ success: 'Product deleted successfully' });
      setTimeout(() => set({ success: null }), 3000);
      return true;
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
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `, { count: 'exact' });

      // Apply status filter at database level
      switch (statusFilter) {
        case 'cod-pending':
          query = query.eq('payment_method', 'cod').eq('status', 'pending');
          break;
        case 'paid-orders':
          query = query.eq('payment_method', 'razorpay').eq('status', 'paid');
          break;
        case 'pending':
          query = query.eq('payment_method', 'cod').eq('status', 'pending');
          break;
        case 'paid':
          query = query.eq('status', 'paid');
          break;
        case 'cancelled':
          query = query.eq('status', 'cancelled');
          break;
        case 'delivered':
          query = query.eq('status', 'delivered');
          break;
        case 'shipped':
          query = query.eq('status', 'shipped');
          break;
        case 'partially_shipped':
          query = query.eq('status', 'partially_shipped');
          break;
        case 'partially_delivered':
          query = query.eq('status', 'partially_delivered');
          break;
        case 'partially_cancelled':
          query = query.eq('status', 'partially_cancelled');
          break;
        case 'all':
        default:
          // For 'all' filter, fetch all orders and filter client-side
          // This is more reliable than complex Supabase queries
          break;
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        query = query.or(`order_id.ilike.%${searchLower}%,shipping_address->>name.ilike.%${searchLower}%,shipping_address->>email.ilike.%${searchLower}%,shipping_address->>phone.ilike.%${searchTerm}%,guest_email.ilike.%${searchLower}%`);
      }

      // Apply pagination and ordering
      const offset = (page - 1) * get().itemsPerPage;
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + get().itemsPerPage - 1);

      if (error) throw error;


      // Apply client-side filtering for 'all' case to exclude pending razorpay orders
      let filteredData = data || [];
      let actualCount = count || 0;
      
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
          actualCount = Math.ceil((count || 0) * (filteredData.length / originalLength));
        }
      }

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
    try {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          orders (
            order_id,
            order_date,
            user_id,
            guest_email,
            guest_phone,
            shipping_address,
            payment_method,
            payment_status,
            total_amount,
            status
          ),
          order_items (
            product_name,
            thumbnail_url,
            size,
            quantity,
            price_at_purchase,
            product_id,
            color,
            mrp
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
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
      const { data, error } = await supabase.functions.invoke('update-item-status', {
        body: requestBody,
      });

      if (error) throw error;

      if (data?.success) {
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
        throw new Error(data?.error || 'Failed to update status');
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
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const aggregateStatus = calculateAggregateOrderStatus(items || []);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: aggregateStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating aggregate order status:', error);
      throw error;
    }
  },

  updatePaymentStatus: async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
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
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'shipped',
            shipping_partner: data?.shipping_partner || '',
            tracking_id: data?.tracking_id || '',
            tracking_url: data?.tracking_url || '',
            shipped_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (error) throw error;

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
        const { error } = await supabase
          .from('orders')
          .update({
            status: action,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (error) throw error;

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
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('payment_method, payment_status, razorpay_payment_id, effective_amount, order_items (order_item_id)')
        .eq('order_id', orderId)
        .single();

      if (orderError) throw orderError;

      // Validate that this is a Razorpay order
      if (order.payment_method !== 'razorpay') {
        throw new Error('Refund can only be processed for Razorpay payments');
      }

      if (order.payment_status !== 'paid') {
        throw new Error('Refund can only be processed for paid orders');
      }

      if (!order.razorpay_payment_id) {
        throw new Error('No Razorpay payment ID found for this order');
      }

      // For single item orders, use effective_amount if available and matches the passed amount
      let finalAmount = amount;
      if (order.order_items && order.order_items.length === 1 && order.effective_amount) {
        finalAmount = order.effective_amount;
      }

      // Call the refund API endpoint
      const { data: refundData, error: refundError } = await supabase.functions.invoke('process-razorpay-refund', {
        body: {
          payment_id: order.razorpay_payment_id,
          amount: Math.round(finalAmount * 100), // Convert to paise
          reason: reason,
          reference_id: refReference
        }
      });

      if (refundError) {
        console.error('Refund API error:', refundError);
        throw new Error(`Refund processing failed: ${refundError.message}`);
      }

      // Update the order status to reflect the refund
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      if (updateError) throw updateError;

      // Log the refund in order_items if needed
      const { error: itemUpdateError } = await supabase
        .from('order_items')
        .update({
          refunded_at: new Date().toISOString(),
          item_status: 'refunded',
          refund_amount: finalAmount.toString(),
        })
        .eq('order_id', orderId);

      if (itemUpdateError) {
        console.warn('Warning: Could not update order items refund status:', itemUpdateError);
      }

      await get().fetchOrders();
      set({ success: `Refund of ₹${finalAmount.toLocaleString('en-IN')} processed successfully` });
      setTimeout(() => set({ success: null }), 3000);
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