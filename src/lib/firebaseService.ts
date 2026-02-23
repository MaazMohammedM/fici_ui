import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction,
  getFirestore,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getStorage 
} from 'firebase/storage';
import { db, storage } from './firebase';

// Types
export type Product = {
  product_id: string;
  name: string;
  description: string;
  category: string;
  sub_category?: string;
  mrp_price: string;
  gender: string;
  sizes: Record<string, number>;
  images: string[];
  created_at: Timestamp;
  article_id: string;
  discount_price: string;
  thumbnail_url: string;
  is_active: boolean;
  size_prices?: Record<string, number>;
  tags?: string[];
};

export type UserProfile = {
  user_id: string;
  first_name: string;
  email?: string;
  role: 'admin' | 'user';
  created_at: Timestamp;
  last_name?: string;
  addresses: Address[];
  phone_number?: string;
  is_guest: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  last_login_at?: Timestamp;
  login_method: string;
};

export type Order = {
  order_id: string;
  user_id?: string;
  order_date: Timestamp;
  status: string;
  total_amount: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  payment_status: string;
  payment_method: string;
  shipping_address: Address;
  created_at: Timestamp;
  updated_at: Timestamp;
  guest_session_id?: string;
  guest_email?: string;
  guest_phone?: string;
  order_type: 'registered' | 'guest';
  tracking_id?: string;
  tracking_url?: string;
  shipped_at?: Timestamp;
  delivered_at?: Timestamp;
};

export type OrderItem = {
  order_item_id: string;
  order_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price_at_purchase: number;
  thumbnail_url: string;
  product_name: string;
  price_currency: string;
  color?: string;
  mrp: number;
  item_status: string;
  cancel_reason?: string;
  return_reason?: string;
  refund_amount?: number;
  shipped_at?: Timestamp;
  delivered_at?: Timestamp;
  shipping_partner?: string;
  tracking_id?: string;
  tracking_url?: string;
};

export type Address = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  district?: string;
  landmark?: string;
  is_default?: boolean;
};

export type Pincode = {
  pincode: string;
  city: string;
  state: string;
  active: boolean;
  is_serviceable: boolean;
  cod_allowed: boolean;
  min_order_amount?: number;
  shipping_fee: number;
  cod_fee: number;
  free_shipping_threshold?: number;
  delivery_time: string;
  districts: string[];
  is_returnable: boolean;
  is_exchangeable: boolean;
  return_window_days: number;
  exchange_window_days: number;
};

// Product Services
export const productService = {
  // Get all products
  getAllProducts: async (filters?: {
    category?: string;
    gender?: string;
    is_active?: boolean;
    tags?: string[];
    limit?: number;
    lastDoc?: any;
  }) => {
    let q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
    
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters?.gender) {
      q = query(q, where('gender', '==', filters.gender));
    }
    
    if (filters?.is_active !== undefined) {
      q = query(q, where('is_active', '==', filters.is_active));
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }
    
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }
    
    if (filters?.lastDoc) {
      q = query(q, startAfter(filters.lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Product 
    }));
    
    return {
      products,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === (filters?.limit || 10)
    };
  },

  // Get single product
  getProduct: async (productId: string) => {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() as Product };
    }
    return null;
  },

  // Search products
  searchProducts: async (searchTerm: string, limit: number = 20) => {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation - for production, consider Algolia or similar
    const q = query(
      collection(db, 'products'),
      where('is_active', '==', true),
      orderBy('name'),
      limit(limit * 2) // Get more to filter client-side
    );
    
    const snapshot = await getDocs(q);
    const allProducts = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Product 
    }));
    
    // Client-side filtering
    const filtered = allProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.slice(0, limit);
  },

  // Update product
  updateProduct: async (productId: string, data: Partial<Product>) => {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
  },

  // Get products by IDs
  getProductsByIds: async (productIds: string[]) => {
    const q = query(
      collection(db, 'products'),
      where('product_id', 'in', productIds)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Product 
    }));
  }
};

// User Services
export const userService = {
  // Get user profile
  getUserProfile: async (userId: string) => {
    const docRef = doc(db, 'user_profiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() as UserProfile };
    }
    return null;
  },

  // Update user profile
  updateUserProfile: async (userId: string, data: Partial<UserProfile>) => {
    const docRef = doc(db, 'user_profiles', userId);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
  },

  // Add address to user
  addAddress: async (userId: string, address: Address) => {
    const docRef = doc(db, 'user_profiles', userId);
    await updateDoc(docRef, {
      addresses: arrayUnion(address),
      updated_at: serverTimestamp()
    });
  },

  // Update address
  updateAddress: async (userId: string, addresses: Address[]) => {
    const docRef = doc(db, 'user_profiles', userId);
    await updateDoc(docRef, {
      addresses,
      updated_at: serverTimestamp()
    });
  },

  // Delete address
  deleteAddress: async (userId: string, addressId: string) => {
    const user = await userService.getUserProfile(userId);
    if (user) {
      const updatedAddresses = user.addresses.filter(addr => addr.id !== addressId);
      await userService.updateAddress(userId, updatedAddresses);
    }
  }
};

// Order Services
export const orderService = {
  // Create order
  createOrder: async (orderData: Omit<Order, 'order_id' | 'created_at' | 'updated_at'>) => {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    return docRef.id;
  },

  // Get user orders
  getUserOrders: async (userId: string, status?: string) => {
    let q = query(
      collection(db, 'orders'),
      where('user_id', '==', userId),
      orderBy('order_date', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Order 
    }));
  },

  // Get single order
  getOrder: async (orderId: string) => {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() as Order };
    }
    return null;
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string, trackingInfo?: { tracking_id: string; tracking_url: string }) => {
    const docRef = doc(db, 'orders', orderId);
    const updateData: any = {
      status,
      updated_at: serverTimestamp()
    };
    
    if (trackingInfo) {
      updateData.tracking_id = trackingInfo.tracking_id;
      updateData.tracking_url = trackingInfo.tracking_url;
    }
    
    if (status === 'shipped') {
      updateData.shipped_at = serverTimestamp();
    } else if (status === 'delivered') {
      updateData.delivered_at = serverTimestamp();
    }
    
    await updateDoc(docRef, updateData);
  },

  // Get all orders (admin)
  getAllOrders: async (filters?: {
    status?: string;
    limit?: number;
    lastDoc?: any;
  }) => {
    let q = query(collection(db, 'orders'), orderBy('order_date', 'desc'));
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }
    
    if (filters?.lastDoc) {
      q = query(q, startAfter(filters.lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Order 
    }));
    
    return {
      orders,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === (filters?.limit || 20)
    };
  }
};

// Pincode Services
export const pincodeService = {
  // Check if pincode is serviceable
  checkServiceability: async (pincode: string) => {
    const docRef = doc(db, 'pincodes', pincode.toString());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Pincode;
      return {
        serviceable: data.is_serviceable && data.active,
        codAllowed: data.cod_allowed,
        shippingFee: data.shipping_fee,
        codFee: data.cod_fee,
        freeShippingThreshold: data.free_shipping_threshold,
        deliveryTime: data.delivery_time,
        minOrderAmount: data.min_order_amount
      };
    }
    
    return { serviceable: false };
  },

  // Get pincode details
  getPincodeDetails: async (pincode: string) => {
    const docRef = doc(db, 'pincodes', pincode.toString());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() as Pincode };
    }
    return null;
  }
};

// Analytics Services
export const analyticsService = {
  // Track product visit
  trackProductVisit: async (productId: string, productName: string, thumbnailUrl: string) => {
    const docRef = doc(db, 'product_visit_stats', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        visit_count: increment(1),
        last_visited_at: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        product_id: productId,
        name: productName,
        thumbnail_url: thumbnailUrl,
        visit_count: 1,
        last_visited_at: serverTimestamp()
      });
    }
  },

  // Get popular products
  getPopularProducts: async (limit: number = 10) => {
    const q = query(
      collection(db, 'product_visit_stats'),
      orderBy('visit_count', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }
};

// Storage Services
export const storageService = {
  // Upload image
  uploadImage: async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  // Delete image
  deleteImage: async (path: string) => {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  // Get product images
  getProductImages: async (productId: string) => {
    const folderRef = ref(storage, `products/${productId}`);
    const result = await listAll(folderRef);
    
    const urls = await Promise.all(
      result.items.map(item => getDownloadURL(item))
    );
    
    return urls;
  }
};

// Admin Services
export const adminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const [
      usersSnapshot,
      productsSnapshot,
      ordersSnapshot,
      pincodesSnapshot
    ] = await Promise.all([
      getDocs(query(collection(db, 'user_profiles'))),
      getDocs(query(collection(db, 'products'))),
      getDocs(query(collection(db, 'orders'))),
      getDocs(query(collection(db, 'pincodes')))
    ]);
    
    return {
      totalUsers: usersSnapshot.size,
      totalProducts: productsSnapshot.size,
      totalOrders: ordersSnapshot.size,
      serviceablePincodes: pincodesSnapshot.docs.filter(doc => 
        doc.data().is_serviceable && doc.data().active
      ).length
    };
  },

  // Get recent orders
  getRecentOrders: async (limit: number = 10) => {
    const q = query(
      collection(db, 'orders'),
      orderBy('order_date', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Order 
    }));
  }
};

// Export all services
export const firebaseService = {
  products: productService,
  users: userService,
  orders: orderService,
  pincodes: pincodeService,
  analytics: analyticsService,
  storage: storageService,
  admin: adminService
};

// Helper function to convert timestamps
export const convertTimestamp = (timestamp: Timestamp) => {
  return timestamp.toDate().toISOString();
};

// Export types
export type { Product, UserProfile, Order, OrderItem, Address, Pincode };
