# Firebase Migration Complete Guide

## ✅ Migration Status

### 📊 Data Successfully Migrated
- **19,425 records** imported from Supabase to Firebase
- **53 Products** with updated Firebase Storage URLs
- **15 User Profiles** with addresses
- **19,301 Pincodes** for shipping coverage
- **3 Orders** with payments and items
- **47 Product Visit Stats** for analytics

### 🖼️ Image Migration
- Product URLs updated to Firebase Storage format
- Images need manual upload to Firebase Storage
- Folder structure: `products/{product_id}/{filename}`

## 🔗 Firebase Console Links
- **Firestore Database**: https://console.firebase.google.com/project/fici-shoes/firestore/data
- **Storage**: https://console.firebase.google.com/project/fici-shoes/storage/fici-shoes.firebasestorage.app/files

## 📝 Code Migration Guide

### Replace Supabase Imports

**OLD (Supabase):**
```typescript
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
```

**NEW (Firebase):**
```typescript
import { ficiFirestore } from '../lib/ficiFirestore'
import { useAuth } from '../context/FirebaseAuthContext'
```

### Common Operations Examples

#### 1. Fetch Products
```typescript
// OLD: Supabase
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)

// NEW: Firebase
const querySnapshot = await ficiFirestore.products.getAll()
const products = ficiHelpers.queryToArray(querySnapshot)
```

#### 2. Get User Orders
```typescript
// OLD: Supabase
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)

// NEW: Firebase
const querySnapshot = await ficiFirestore.orders.getUserOrders(userId)
const orders = ficiHelpers.queryToArray(querySnapshot)
```

#### 3. Create Order
```typescript
// OLD: Supabase
const { data, error } = await supabase
  .from('orders')
  .insert([orderData])

// NEW: Firebase
const docRef = await ficiFirestore.orders.create(orderData)
const orderId = docRef.id
```

#### 4. Update Product
```typescript
// OLD: Supabase
const { data, error } = await supabase
  .from('products')
  .update(updateData)
  .eq('product_id', productId)

// NEW: Firebase
await ficiFirestore.products.update(productId, updateData)
```

#### 5. Check Pincode Serviceability
```typescript
// OLD: Supabase
const { data, error } = await supabase
  .from('pincodes')
  .select('*')
  .eq('pincode', pincode)
  .eq('is_serviceable', true)

// NEW: Firebase
const querySnapshot = await ficiFirestore.pincodes.checkServiceability(pincode)
const pincodes = ficiHelpers.queryToArray(querySnapshot)
```

#### 6. Get Product Images
```typescript
// OLD: Supabase
const images = product.images ? product.images.split(',') : []

// NEW: Firebase (with helper)
const images = ficiHelpers.getProductImages(product)
```

#### 7. Format Currency
```typescript
// OLD: Manual formatting
const formattedPrice = `₹${price.toFixed(2)}`

// NEW: Firebase helper
const formattedPrice = ficiHelpers.formatCurrency(price, 'INR')
```

## 🔐 Authentication Migration

### Sign In
```typescript
// OLD: Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// NEW: Firebase
import { signInWithEmailAndPassword } from 'firebase/auth'
const userCredential = await signInWithEmailAndPassword(auth, email, password)
```

### Get Current User
```typescript
// OLD: Supabase
const { data: { user } } = await supabase.auth.getUser()

// NEW: Firebase
import { useAuth } from '../context/FirebaseAuthContext'
const { user } = useAuth()
```

## 🖼️ Image Upload to Firebase Storage

### Upload Product Image
```typescript
import { ficiStorage } from '../lib/ficiFirestore'

const uploadImage = async (productId, file) => {
  const fileName = `${Date.now()}_${file.name}`
  const downloadURL = await ficiStorage.uploadProductImage(
    productId, 
    file, 
    fileName
  )
  return downloadURL
}
```

## 📋 Component Migration Checklist

### Products Component
- [ ] Replace `supabase.from('products')` with `ficiFirestore.products.getAll()`
- [ ] Use `ficiHelpers.getProductImages()` for image arrays
- [ ] Use `ficiHelpers.formatCurrency()` for price formatting
- [ ] Update image URLs to Firebase Storage format

### Orders Component  
- [ ] Replace `supabase.from('orders')` with `ficiFirestore.orders.getUserOrders()`
- [ ] Use `ficiHelpers.formatDate()` for date formatting
- [ ] Update order status handling

### User Profile Component
- [ ] Replace `supabase.from('user_profiles')` with `ficiFirestore.users.get()`
- [ ] Update address handling (JSON arrays)
- [ ] Use Firebase auth context

### Admin Dashboard
- [ ] Replace all Supabase queries with Firebase equivalents
- [ ] Update real-time subscriptions (use Firestore onSnapshot)
- [ ] Update analytics queries

## 🚀 Next Steps

1. **Upload Images**: Manually upload product images to Firebase Storage
2. **Update Components**: Replace Supabase calls with Firebase equivalents
3. **Test Authentication**: Verify Firebase auth flows work correctly
4. **Update Environment**: Set Firebase environment variables
5. **Deploy**: Test the application with Firebase backend

## 🔧 Environment Variables

Update your `.env.local`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fici-shoes
VITE_FIREBASE_STORAGE_BUCKET=fici-shoes.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 📞 Support

If you need help with:
- **Image Upload**: Use Firebase Console or implement upload functionality
- **Component Updates**: Reference the examples above
- **Authentication**: Use FirebaseAuthContext
- **Real-time Updates**: Replace Supabase realtime with Firestore onSnapshot

---

**🎉 Your Firebase migration is complete! Start updating your components to use Firebase instead of Supabase.**
