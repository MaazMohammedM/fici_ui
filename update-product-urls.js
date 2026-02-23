import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'fici-shoes.firebasestorage.app'
});

const storage = getStorage(app);
const bucket = storage.bucket();

// Parse products CSV to get image URLs and update them to Firebase URLs
function parseProductsCSV() {
  try {
    const fileContent = readFileSync('./tables_data/products_rows (1).csv', 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === '' || value === null || value === 'NULL') return null;
        if (!isNaN(value) && value !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) return num;
        }
        return value;
      }
    });
    return records;
  } catch (error) {
    console.error('Error parsing products CSV:', error);
    return [];
  }
}

// Update product URLs to use Firebase Storage placeholder URLs
async function updateProductUrls() {
  console.log('🔥 Updating product URLs to Firebase Storage format...');
  
  try {
    const products = parseProductsCSV();
    console.log(`📊 Found ${products.length} products to update`);
    
    const db = getFirestore(app);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        const { product_id, images, thumbnail_url } = product;
        
        // Generate Firebase Storage URLs (placeholder for now)
        const firebaseBaseUrl = `https://storage.googleapis.com/${bucket.name}/products/${product_id}`;
        
        // Parse existing images and convert to Firebase format
        let firebaseImages = [];
        let firebaseThumbnail = null;
        
        if (thumbnail_url) {
          // Extract filename from Supabase URL
          const filename = thumbnail_url.split('/').pop();
          firebaseThumbnail = `${firebaseBaseUrl}/${filename}`;
        }
        
        if (images && typeof images === 'string') {
          const imageUrls = images.split(',').map(url => url.trim());
          firebaseImages = imageUrls.map((url, index) => {
            const filename = url.split('/').pop();
            return `${firebaseBaseUrl}/${filename}`;
          });
        }
        
        // Update product in Firestore
        const updateData = {};
        if (firebaseThumbnail) {
          updateData.thumbnail_url = firebaseThumbnail;
        }
        if (firebaseImages.length > 0) {
          updateData.images = firebaseImages.join(',');
        }
        
        await db.collection('products').doc(product_id).update(updateData);
        successCount++;
        
        console.log(`✅ Updated URLs for product: ${product.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to update product ${product.product_id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Product URL update completed!');
    console.log('\n📊 Summary:');
    console.log(`- Products updated: ${successCount}`);
    console.log(`- Update errors: ${errorCount}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Manually upload product images to Firebase Storage');
    console.log('2. Use the folder structure: products/{product_id}/{filename}');
    console.log('3. Update the URLs in Firestore if needed');
    
  } catch (error) {
    console.error('❌ Fatal error during URL update:', error);
    process.exit(1);
  }
}

// Run the URL update
updateProductUrls().then(() => {
  console.log('\n🚀 Product URLs updated to Firebase Storage format!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ URL update failed:', error);
  process.exit(1);
});
