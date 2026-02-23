# Firebase Database Migration Guide

## 🚀 Quick Start

### Prerequisites
1. **Firebase CLI installed**: `npm install -g firebase-tools`
2. **Firebase project created** in [Firebase Console](https://console.firebase.google.com/)
3. **Service account key** downloaded from Firebase Console

### Step 1: Setup Firebase Project
```bash
# Login to Firebase
firebase login

# Initialize your project
firebase init firestore

# Choose your project from the list
# Select "Use an existing project"
```

### Step 2: Deploy Database Schema
```bash
# Make the migration script executable (Linux/Mac)
chmod +x firebase-migration.sh

# Run the migration script
./firebase-migration.sh
```

This will:
- ✅ Create all necessary Firestore indexes
- ✅ Deploy security rules
- ✅ Setup collection structure

### Step 3: Import Sample Data
```bash
# Install required packages
npm install firebase-admin uuid

# Place your service account key in the project root
# Download from: Firebase Console → Project Settings → Service Accounts

# Run the data import
node import-data.js
```

## 📊 Collections Created

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `user_profiles` | User information | `user_id`, `email`, `role` |
| `products` | Product catalog | `product_id`, `name`, `category` |
| `orders` | Customer orders | `order_id`, `user_id`, `status` |
| `order_items` | Order line items | `order_item_id`, `order_id`, `product_id` |
| `payments` | Payment records | `payment_id`, `order_id`, `payment_status` |
| `pincodes` | Shipping zones | `pincode`, `city`, `is_serviceable` |
| `reviews` | Product reviews | `review_id`, `product_id`, `rating` |
| `guest_sessions` | Guest user sessions | `session_id`, `email`, `expires_at` |
| `otps` | One-time passwords | `otp_id`, `identifier`, `expires_at` |
| `traffic_sources` | Analytics data | `source`, `medium`, `visit_count` |
| `product_discounts` | Product-specific discounts | `discount_id`, `product_id`, `mode` |
| `checkout_discount_rules` | Cart-level discounts | `rule_id`, `rule_type`, `active` |
| `returns` | Return/replacement requests | `return_id`, `order_id`, `status` |
| `refunds` | Refund records | `refund_id`, `order_id`, `refund_status` |
| `account_merges` | Guest to registered user merges | `merge_id`, `guest_profile_id`, `registered_profile_id` |
| `user_identities` | Multiple user identities | `identity_id`, `profile_id`, `identity_type` |
| `product_visit_stats` | Product view analytics | `product_id`, `visit_count`, `last_visited_at` |

## 🔐 Security Rules

The security rules provide:
- **Admin access** to all collections
- **User access** to their own data
- **Public read access** to products and reviews
- **Guest access** for session creation

## 📈 Indexes

Optimized indexes for:
- User queries by email/phone
- Order filtering by status and date
- Product searches by category and tags
- Payment status tracking
- Geographic queries by pincode

## 🧪 Test Data

The import script creates:
- 2 user profiles (1 admin, 1 regular user)
- 3 sample products (footwear and accessories)
- 3 serviceable pincodes (Mumbai, Delhi)
- 1 sample order with payment
- Traffic source analytics
- Product visit statistics

## 🔧 Customization

### Adding Your Own Data
1. Export data from Supabase as JSON
2. Transform the data to match Firebase schema
3. Use the import script structure to load your data

### Schema Differences from Supabase
- **UUIDs**: Firebase uses document IDs instead of separate UUID fields
- **Timestamps**: Use `new Date()` instead of PostgreSQL timestamps
- **Arrays**: Firebase supports arrays directly (no need for PostgreSQL array syntax)
- **JSON**: All fields are JSON by default in Firestore

### Environment Setup
Create `.env.local`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🚨 Important Notes

1. **Service Account**: Keep your service account key secure and never commit it to git
2. **Cost**: Firestore charges per read/write/delete, monitor your usage
3. **Indexes**: Large datasets may require additional indexes for performance
4. **Security**: Review security rules before going to production

## 📞 Need Help?

If you encounter issues:
1. Check Firebase Console for error messages
2. Verify service account permissions
3. Ensure all indexes are deployed
4. Test with small data batches first

## 🎯 Next Steps

1. ✅ Deploy schema and rules
2. ✅ Import sample data
3. ✅ Test collections in Firebase Console
4. 🔄 Update application code to use Firebase
5. 🔄 Test authentication flows
6. 🔄 Deploy to production

---

**Ready to migrate? Run the scripts in order and let me know if you need help!**
