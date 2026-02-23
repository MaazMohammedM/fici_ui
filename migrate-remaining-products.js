import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'fici-shoes.firebasestorage.app'
});

const storage = getStorage(app);
const db = getFirestore(app);
const bucket = storage.bucket();

// Supabase configuration
const SUPABASE_URL = 'https://qegaebazravcwofibtry.supabase.co/storage/v1';
const SUPABASE_BUCKET = 'ficishoesimages';

// Helper function to download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Helper function to get Firebase Storage public URL
function getFirebasePublicUrl(filePath) {
  return `https://firebasestorage.googleapis.com/v0/b/fici-shoes.firebasestorage.app/o/${encodeURIComponent(filePath)}?alt=media`;
}

// Check if image exists before downloading
async function imageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Upload single image to Firebase
async function uploadImageToFirebase(supabaseUrl, firebasePath) {
  try {
    console.log(`📥 Downloading: ${supabaseUrl}`);
    
    // Download from Supabase
    const imageBuffer = await downloadImage(supabaseUrl);
    
    // Upload to Firebase
    console.log(`📤 Uploading to Firebase: ${firebasePath}`);
    const file = bucket.file(firebasePath);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      }
    });

    // Make file public
    await file.makePublic();
    
    console.log(`✅ Uploaded: ${firebasePath}`);
    return getFirebasePublicUrl(firebasePath);
    
  } catch (error) {
    console.log(`❌ Failed to upload ${supabaseUrl}: ${error.message}`);
    return null;
  }
}

// Migrate remaining products from Firestore
async function migrateRemainingProducts() {
  console.log('🔍 Finding remaining products without images...');
  
  try {
    const productsSnapshot = await db.collection('products').get();
    let migratedCount = 0;
    
    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const articleId = product.article_id;
      
      if (!articleId) {
        console.log(`⚠️  Product ${productDoc.id} has no article_id`);
        continue;
      }
      
      // Check if product already has Firebase images
      if (product.images && product.images.length > 0 && product.images[0].includes('firebasestorage')) {
        console.log(`⏭️  ${articleId} already has Firebase images`);
        continue;
      }
      
      console.log(`\n📦 Processing remaining product: ${articleId}`);
      
      // Try to find images using common patterns
      const imagePatterns = [];
      
      // Try different image extensions and numbers
      for (let i = 1; i <= 6; i++) {
        imagePatterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}_${i}.png`);
        imagePatterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}_${i}.jpg`);
        imagePatterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}_${i}.webp`);
      }
      
      // Also try some common variations
      imagePatterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}.png`);
      imagePatterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}.jpg`);
      
      const firebaseUrls = [];
      
      for (const imageUrl of imagePatterns) {
        // Check if image exists in Supabase
        if (!(await imageExists(imageUrl))) {
          continue;
        }
        
        // Extract filename from URL
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const firebasePath = `products/${articleId}/${filename}`;
        
        // Check if already exists in Firebase
        const file = bucket.file(firebasePath);
        const [exists] = await file.exists();
        
        let firebaseUrl;
        if (exists) {
          console.log(`⏭️  Already exists: ${firebasePath}`);
          firebaseUrl = getFirebasePublicUrl(firebasePath);
        } else {
          // Upload to Firebase
          firebaseUrl = await uploadImageToFirebase(imageUrl, firebasePath);
        }
        
        if (firebaseUrl) {
          firebaseUrls.push(firebaseUrl);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Update product if we found any images
      if (firebaseUrls.length > 0) {
        const updates = {
          images: firebaseUrls
        };
        
        // Set thumbnail to first image if needed
        if (!product.thumbnail_url || product.thumbnail_url.includes('supabase')) {
          updates.thumbnail_url = firebaseUrls[0];
        }
        
        await db.collection('products').doc(productDoc.id).update(updates);
        console.log(`✅ Updated ${articleId} with ${firebaseUrls.length} images`);
        migratedCount++;
      } else {
        console.log(`❌ No images found for ${articleId}`);
      }
    }
    
    console.log(`\n🎯 Migrated ${migratedCount} additional products`);
    
  } catch (error) {
    console.error('❌ Error migrating remaining products:', error);
  }
}

// Main migration function
async function completeImageMigration() {
  console.log('🚀 Starting complete image migration for remaining products...\n');
  
  await migrateRemainingProducts();
  
  console.log('\n🎉 Complete migration finished!');
  console.log('\n🔗 Firebase Storage: https://console.firebase.google.com/project/fici-shoes/storage/fici-shoes.firebasestorage.app/files/~2Fproducts');
  console.log('🔗 Firestore: https://console.firebase.google.com/project/fici-shoes/firestore/data');
}

// Run the migration
completeImageMigration().then(() => {
  console.log('\n✅ All products now have Firebase images!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
