# Firebase Migration Guide - Complete Implementation

## 🎯 Overview
This guide helps you migrate from Supabase to Firebase, including database queries, authentication, and storage.

## 📋 Migration Checklist

### ✅ Completed
- [x] Database schema migrated to Firestore
- [x] All data imported (19,425 records)
- [x] Firebase configuration setup
- [x] Authentication context created
- [x] Service utilities created

### 🔄 In Progress
- [ ] Image migration (Supabase storage issues)
- [ ] Update application components
- [ ] Replace Supabase queries with Firebase

## 🚀 Step 1: Update Environment Variables

Update your `.env.local` file with Firebase credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fici-shoes
VITE_FIREBASE_STORAGE_BUCKET=fici-shoes.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Remove Supabase variables
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

## 🔥 Step 2: Replace Supabase Imports

### OLD (Supabase):
```typescript
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
```

### NEW (Firebase):
```typescript
import { firebaseService } from '../lib/firebaseService'
import { useAuth } from '../context/FirebaseAuthContext'
```

## 📊 Step 3: Update Database Queries

### Products

#### OLD:
```typescript
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

#### NEW:
```typescript
const { products } = await firebaseService.products.getAllProducts({
  is_active: true
});
```

### User Profile

#### OLD:
```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single()
```

#### NEW:
```typescript
const profile = await firebaseService.users.getUserProfile(userId);
```

### Orders

#### OLD:
```typescript
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .order('order_date', { ascending: false })
```

#### NEW:
```typescript
const orders = await firebaseService.orders.getUserOrders(userId);
```

### Pincodes

#### OLD:
```typescript
const { data: pincode } = await supabase
  .from('pincodes')
  .select('*')
  .eq('pincode', pincode)
  .single()
```

#### NEW:
```typescript
const pincode = await firebaseService.pincodes.checkServiceability(pincode);
```

## 🔐 Step 4: Update Authentication

### OLD:
```typescript
import { useAuth } from '../context/AuthContext';

const { user, login, logout, signUp } = useAuth();

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

### NEW:
```typescript
import { useAuth } from '../context/FirebaseAuthContext';

const { user, login, logout, signUp } = useAuth();

// Login
await login(email, password);
```

## 📁 Step 5: Update File Uploads

### OLD:
```typescript
const { data, error } = await supabase.storage
  .from('products')
  .upload(filePath, file);

const { data: { publicUrl } } = supabase.storage
  .from('products')
  .getPublicUrl(filePath);
```

### NEW:
```typescript
const downloadURL = await firebaseService.storage.uploadImage(file, filePath);
```

## 🏪 Step 6: Update E-commerce Functions

### Create Order

#### OLD:
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert([orderData])
  .select();
```

#### NEW:
```typescript
const orderId = await firebaseService.orders.createOrder(orderData);
```

### Update Product

#### OLD:
```typescript
const { data, error } = await supabase
  .from('products')
  .update(updateData)
  .eq('product_id', productId);
```

#### NEW:
```typescript
await firebaseService.products.updateProduct(productId, updateData);
```

## 📱 Step 7: Update Component Examples

### Product List Component

```typescript
// OLD
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      setProducts(data);
    };
    fetchProducts();
  }, []);

  return (
    // Render products
  );
}

// NEW
import { useEffect, useState } from 'react';
import { firebaseService } from '../lib/firebaseService';

function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { products } = await firebaseService.products.getAllProducts({
        is_active: true
      });
      setProducts(products);
    };
    fetchProducts();
  }, []);

  return (
    // Render products
  );
}
```

### User Profile Component

```typescript
// NEW
import { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { firebaseService } from '../lib/firebaseService';

function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      firebaseService.users.getUserProfile(user.uid)
        .then(setProfile);
    }
  }, [user]);

  const handleAddAddress = async (address) => {
    await firebaseService.users.addAddress(user.uid, address);
    // Refresh profile
    const updatedProfile = await firebaseService.users.getUserProfile(user.uid);
    setProfile(updatedProfile);
  };

  return (
    // Render profile
  );
}
```

## 🛠️ Step 8: Common Migration Patterns

### Real-time Updates

#### OLD (Supabase Realtime):
```typescript
supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('New order:', payload.new);
    }
  )
  .subscribe();
```

#### NEW (Firestore Realtime):
```typescript
import { onSnapshot } from 'firebase/firestore';
import { collection } from 'firebase/firestore';

const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('New order:', change.doc.data());
    }
  });
});

// Cleanup
return () => unsubscribe();
```

### Pagination

#### OLD:
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .range(offset, offset + limit - 1);
```

#### NEW:
```typescript
const { products, lastDoc, hasMore } = await firebaseService.products.getAllProducts({
  limit: 20,
  lastDoc: previousLastDoc
});
```

### Search

#### OLD:
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .ilike('name', `%${searchTerm}%`);
```

#### NEW:
```typescript
const products = await firebaseService.products.searchProducts(searchTerm);
```

## 📊 Step 9: Admin Dashboard Updates

### Dashboard Stats

#### OLD:
```typescript
const [usersCount, setUsersCount] = useState(0);
const [ordersCount, setOrdersCount] = useState(0);

useEffect(() => {
  const fetchStats = async () => {
    const { count: users } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: orders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    setUsersCount(users);
    setOrdersCount(orders);
  };
  fetchStats();
}, []);
```

#### NEW:
```typescript
const [stats, setStats] = useState({});

useEffect(() => {
  const fetchStats = async () => {
    const dashboardStats = await firebaseService.admin.getDashboardStats();
    setStats(dashboardStats);
  };
  fetchStats();
}, []);
```

## 🚨 Step 10: Error Handling

### OLD:
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*');

if (error) {
  console.error('Supabase error:', error);
  return;
}
```

#### NEW:
```typescript
try {
  const { products } = await firebaseService.products.getAllProducts();
  // Use products
} catch (error) {
  console.error('Firebase error:', error);
  // Handle error
}
```

## 📝 Step 11: Testing Checklist

- [ ] User authentication works
- [ ] Product listing displays correctly
- [ ] Product search functions
- [ ] Order creation works
- [ ] User profile updates work
- [ ] Pincode validation works
- [ ] Admin dashboard loads
- [ ] Image uploads work (if implemented)

## 🔧 Step 12: Performance Optimizations

### Enable Firestore Caching
```typescript
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});
```

### Use Batch Operations
```typescript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
// Add multiple operations
await batch.commit();
```

## 📞 Troubleshooting

### Common Issues:
1. **Missing imports**: Make sure to import from `firebaseService`
2. **Authentication**: Use `FirebaseAuthContext` instead of old auth context
3. **Timestamps**: Use `convertTimestamp()` helper for display
4. **Pagination**: Use the `lastDoc` pattern for pagination
5. **Real-time**: Use Firestore `onSnapshot` instead of Supabase channels

### Getting Help:
- Check Firebase Console for errors
- Enable debug mode in Firebase
- Check network tab for API calls
- Review Firestore rules for permission issues

---

## 🎉 Migration Complete!

Once you've completed these steps, your application will be fully migrated to Firebase with:
- ✅ Real-time database
- ✅ Authentication
- ✅ File storage
- ✅ Better performance
- ✅ Scalability

**Ready for production deployment!** 🚀
