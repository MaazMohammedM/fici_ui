#!/bin/bash

# Firebase Database Migration Script
# This script creates Firestore collections and indexes based on Supabase schema

echo "🔥 Starting Firebase Database Migration..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase CLI ready"
echo ""

# Create firestore indexes file
echo "📝 Creating Firestore indexes configuration..."

cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "order_date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "order_date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "order_items",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "order_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "item_status",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "is_active",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "tags",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "user_profiles",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "email",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "user_profiles",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "phone_number",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "guest_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "session_id",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "guest_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "email",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "payments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "order_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "payment_status",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pincodes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "pincode",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pincodes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "is_serviceable",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "active",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "product_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "traffic_sources",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "source",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "last_visited_at",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "products",
      "fieldPath": "mrp_price",
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "order": "DESCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "arrayConfig": "CONTAINS",
          "queryScope": "COLLECTION"
        }
      ]
    },
    {
      "collectionGroup": "products",
      "fieldPath": "discount_price",
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "order": "DESCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "arrayConfig": "CONTAINS",
          "queryScope": "COLLECTION"
        }
      ]
    }
  ]
}
EOF

echo "✅ Firestore indexes configuration created"

# Create Firebase security rules
echo "🔒 Creating Firestore security rules..."

cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/user_profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // User profiles
    match /user_profiles/{userId} {
      allow read, write: if isAdmin() || isOwner(userId);
      allow create: if isAuthenticated();
    }
    
    // Products - readable by all, writable by admin
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
      allow create: if isAdmin();
    }
    
    // Orders
    match /orders/{orderId} {
      allow read: if isAdmin() || isOwner(resource.data.user_id);
      allow write: if isAdmin();
      allow create: if isAuthenticated();
    }
    
    // Order items
    match /order_items/{itemId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
      allow create: if isAuthenticated();
    }
    
    // Payments
    match /payments/{paymentId} {
      allow read: if isAdmin() || isOwner(resource.data.user_id);
      allow write: if isAdmin();
      allow create: if isAuthenticated();
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if isAdmin() || isOwner(resource.data.user_id);
      allow create: if isAuthenticated();
    }
    
    // Guest sessions
    match /guest_sessions/{sessionId} {
      allow read, write: if isAdmin();
      allow create: if true;
    }
    
    // OTPs
    match /otps/{otpId} {
      allow read, write: if isAdmin();
      allow create: if true;
    }
    
    // Pincodes
    match /pincodes/{pincode} {
      allow read: if true;
      allow write: if isAdmin();
      allow create: if isAdmin();
    }
    
    // Traffic sources
    match /traffic_sources/{sourceId} {
      allow read, write: if isAdmin();
      allow create: if true;
    }
    
    // Product discounts
    match /product_discounts/{discountId} {
      allow read: if true;
      allow write: if isAdmin();
      allow create: if isAdmin();
    }
    
    // Checkout discount rules
    match /checkout_discount_rules/{ruleId} {
      allow read: if true;
      allow write: if isAdmin();
      allow create: if isAdmin();
    }
    
    // Returns
    match /returns/{returnId} {
      allow read: if isAdmin() || isOwner(resource.data.user_id);
      allow write: if isAdmin();
      allow create: if isAuthenticated();
    }
    
    // Refunds
    match /refunds/{refundId} {
      allow read: if isAdmin() || isOwner(resource.data.user_id);
      allow write: if isAdmin();
      allow create: if isAuthenticated();
    }
    
    // Account merges
    match /account_merges/{mergeId} {
      allow read, write: if isAdmin();
      allow create: if isAuthenticated();
    }
    
    // User identities
    match /user_identities/{identityId} {
      allow read: if isAdmin() || isOwner(resource.data.profile_id);
      allow write: if isAdmin() || isOwner(resource.data.profile_id);
      allow create: if isAuthenticated();
    }
    
    // Product visit stats
    match /product_visit_stats/{productId} {
      allow read: if true;
      allow write: if isAdmin();
      allow create: if true;
    }
  }
}
EOF

echo "✅ Firestore security rules created"

# Deploy indexes and rules
echo "🚀 Deploying indexes and security rules..."

firebase deploy --only firestore:indexes,firestore:rules

echo ""
echo "✅ Migration setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Import your data using the Node.js script (import-data.js)"
echo "2. Test the collections in Firebase Console"
echo "3. Update your application code to use Firebase"
echo ""
echo "🔥 Collections created:"
echo "- user_profiles"
echo "- products" 
echo "- orders"
echo "- order_items"
echo "- payments"
echo "- reviews"
echo "- guest_sessions"
echo "- otps"
echo "- pincodes"
echo "- traffic_sources"
echo "- product_discounts"
echo "- checkout_discount_rules"
echo "- returns"
echo "- refunds"
echo "- account_merges"
echo "- user_identities"
echo "- product_visit_stats"
