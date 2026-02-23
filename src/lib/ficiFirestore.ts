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
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// Enhanced Firebase CRUD operations for FICI
export const ficiFirestore = {
  // User Profiles
  users: {
    get: (userId) => getDoc(doc(db, 'user_profiles', userId)),
    getAll: () => getDocs(collection(db, 'user_profiles')),
    update: (userId, data) => updateDoc(doc(db, 'user_profiles', userId), data),
    create: (data) => addDoc(collection(db, 'user_profiles'), data),
    getByEmail: (email) => getDocs(query(collection(db, 'user_profiles'), where('email', '==', email))),
    getByPhone: (phone) => getDocs(query(collection(db, 'user_profiles'), where('phone_number', '==', phone))),
  },

  // Products
  products: {
    get: (productId) => getDoc(doc(db, 'products', productId)),
    getAll: (activeOnly = true) => {
      const q = activeOnly 
        ? query(collection(db, 'products'), where('is_active', '==', true))
        : collection(db, 'products');
      return getDocs(q);
    },
    getByCategory: (category) => getDocs(query(
      collection(db, 'products'), 
      where('category', '==', category),
      where('is_active', '==', true)
    )),
    getByGender: (gender) => getDocs(query(
      collection(db, 'products'), 
      where('gender', '==', gender),
      where('is_active', '==', true)
    )),
    search: (searchTerm) => getDocs(query(
      collection(db, 'products'), 
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      where('is_active', '==', true)
    )),
    getFeatured: (limitCount = 10) => getDocs(query(
      collection(db, 'products'),
      where('is_active', '==', true),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    )),
    update: (productId, data) => updateDoc(doc(db, 'products', productId), data),
    create: (data) => addDoc(collection(db, 'products'), data),
    delete: (productId) => deleteDoc(doc(db, 'products', productId)),
  },

  // Orders
  orders: {
    get: (orderId) => getDoc(doc(db, 'orders', orderId)),
    getUserOrders: (userId, statusFilter = null) => {
      let q = query(
        collection(db, 'orders'), 
        where('user_id', '==', userId),
        orderBy('order_date', 'desc')
      );
      
      if (statusFilter) {
        q = query(q, where('status', '==', statusFilter));
      }
      
      return getDocs(q);
    },
    getAll: (statusFilter = null, limitCount = 50) => {
      let q = query(collection(db, 'orders'), orderBy('order_date', 'desc'), limit(limitCount));
      
      if (statusFilter) {
        q = query(q, where('status', '==', statusFilter));
      }
      
      return getDocs(q);
    },
    update: (orderId, data) => updateDoc(doc(db, 'orders', orderId), {
      ...data,
      updated_at: serverTimestamp()
    }),
    create: (data) => addDoc(collection(db, 'orders'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }),
    updateStatus: (orderId, status) => updateDoc(doc(db, 'orders', orderId), {
      status,
      updated_at: serverTimestamp()
    }),
  },

  // Order Items
  orderItems: {
    get: (itemId) => getDoc(doc(db, 'order_items', itemId)),
    getByOrder: (orderId) => getDocs(query(
      collection(db, 'order_items'), 
      where('order_id', '==', orderId)
    )),
    update: (itemId, data) => updateDoc(doc(db, 'order_items', itemId), data),
    create: (data) => addDoc(collection(db, 'order_items'), data),
    updateStatus: (itemId, status) => updateDoc(doc(db, 'order_items', itemId), {
      item_status: status
    }),
  },

  // Payments
  payments: {
    get: (paymentId) => getDoc(doc(db, 'payments', paymentId)),
    getByOrder: (orderId) => getDocs(query(
      collection(db, 'payments'), 
      where('order_id', '==', orderId)
    )),
    update: (paymentId, data) => updateDoc(doc(db, 'payments', paymentId), {
      ...data,
      updated_at: serverTimestamp()
    }),
    create: (data) => addDoc(collection(db, 'payments'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }),
    updateStatus: (paymentId, status) => updateDoc(doc(db, 'payments', paymentId), {
      payment_status: status,
      updated_at: serverTimestamp()
    }),
  },

  // Pincodes
  pincodes: {
    get: (pincode) => getDoc(doc(db, 'pincodes', pincode.toString())),
    checkServiceability: (pincode) => getDocs(query(
      collection(db, 'pincodes'), 
      where('pincode', '==', pincode.toString()),
      where('is_serviceable', '==', true),
      where('active', '==', true)
    )),
    getServiceablePincodes: (city = null) => {
      let q = query(
        collection(db, 'pincodes'),
        where('is_serviceable', '==', true),
        where('active', '==', true)
      );
      
      if (city) {
        q = query(q, where('city', '==', city));
      }
      
      return getDocs(q);
    },
    update: (pincode, data) => updateDoc(doc(db, 'pincodes', pincode.toString()), {
      ...data,
      updated_at: serverTimestamp()
    }),
  },

  // Reviews
  reviews: {
    get: (reviewId) => getDoc(doc(db, 'reviews', reviewId)),
    getByProduct: (productId) => getDocs(query(
      collection(db, 'reviews'), 
      where('product_id', '==', productId),
      orderBy('created_at', 'desc')
    )),
    getUserReviews: (userId) => getDocs(query(
      collection(db, 'reviews'), 
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    )),
    create: (data) => addDoc(collection(db, 'reviews'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }),
    update: (reviewId, data) => updateDoc(doc(db, 'reviews', reviewId), {
      ...data,
      updated_at: serverTimestamp()
    }),
  },

  // Product Visit Stats
  productVisitStats: {
    get: (productId) => getDoc(doc(db, 'product_visit_stats', productId)),
    incrementVisit: (productId) => {
      const docRef = doc(db, 'product_visit_stats', productId);
      return updateDoc(docRef, {
        visit_count: increment(1),
        last_visited_at: serverTimestamp()
      });
    },
    createOrUpdate: (productId, name, thumbnailUrl) => {
      const docRef = doc(db, 'product_visit_stats', productId);
      return getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          return updateDoc(docRef, {
            visit_count: increment(1),
            last_visited_at: serverTimestamp()
          });
        } else {
          return setDoc(docRef, {
            product_id: productId,
            name,
            thumbnail_url: thumbnailUrl,
            visit_count: 1,
            last_visited_at: serverTimestamp()
          });
        }
      });
    },
    getPopular: (limitCount = 10) => getDocs(query(
      collection(db, 'product_visit_stats'),
      orderBy('visit_count', 'desc'),
      limit(limitCount)
    )),
  },

  // Traffic Sources
  trafficSources: {
    get: (sourceId) => getDoc(doc(db, 'traffic_sources', sourceId)),
    getAll: () => getDocs(query(
      collection(db, 'traffic_sources'),
      orderBy('visit_count', 'desc')
    )),
    createOrUpdate: (sourceData) => {
      // This would need to be implemented based on your source tracking logic
      return addDoc(collection(db, 'traffic_sources'), {
        ...sourceData,
        created_at: serverTimestamp(),
        last_visited_at: serverTimestamp()
      });
    },
  },
};

// Firebase Storage operations
export const ficiStorage = {
  // Upload product images
  uploadProductImage: async (productId, imageFile, fileName) => {
    const storageRef = ref(storage, `products/${productId}/${fileName}`);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef);
  },

  // Delete product image
  deleteProductImage: async (productId, fileName) => {
    const storageRef = ref(storage, `products/${productId}/${fileName}`);
    return deleteObject(storageRef);
  },

  // Upload user avatar
  uploadUserAvatar: async (userId, imageFile) => {
    const storageRef = ref(storage, `users/${userId}/avatar`);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef);
  },
};

// Helper functions for data conversion
export const ficiHelpers = {
  // Convert Firestore document to usable object
  docToObject: (doc) => {
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  // Convert Firestore query snapshot to array
  queryToArray: (querySnapshot) => {
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Format currency
  formatCurrency: (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  // Format date
  formatDate: (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN');
  },

  // Calculate discount percentage
  calculateDiscount: (mrp, price) => {
    if (!mrp || !price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  },

  // Get product image URLs as array
  getProductImages: (product) => {
    if (!product.images) return [];
    if (Array.isArray(product.images)) return product.images;
    if (typeof product.images === 'string') {
      return product.images.split(',').map(url => url.trim()).filter(url => url);
    }
    return [];
  },

  // Parse product sizes
  parseProductSizes: (product) => {
    if (!product.sizes) return {};
    if (typeof product.sizes === 'object') return product.sizes;
    if (typeof product.sizes === 'string') {
      try {
        return JSON.parse(product.sizes);
      } catch {
        return {};
      }
    }
    return {};
  },
};

export { Timestamp, serverTimestamp };
