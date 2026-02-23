import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';

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

// Helper function to extract file path from Supabase URL
function extractSupabasePath(url) {
  if (!url || !url.includes('ficishoesimages')) return null;
  
  try {
    const urlObj = new URL(url);
    // Extract path after /ficishoesimages/
    const pathParts = urlObj.pathname.split('/ficishoesimages/');
    return pathParts.length > 1 ? pathParts[1] : null;
  } catch {
    return null;
  }
}

// Helper function to get Firebase Storage public URL
function getFirebasePublicUrl(filePath) {
  return `https://firebasestorage.googleapis.com/v0/b/fici-shoes.firebasestorage.app/o/${encodeURIComponent(filePath)}?alt=media`;
}

// Migrate single image
async function migrateImage(supabaseUrl, firebasePath) {
  try {
    // Check if image already exists in Firebase
    const file = bucket.file(firebasePath);
    const [exists] = await file.exists();
    
    if (exists) {
      console.log(`✅ Image already exists: ${firebasePath}`);
      return getFirebasePublicUrl(firebasePath);
    }

    // Extract path from Supabase URL
    const supabasePath = extractSupabasePath(supabaseUrl);
    if (!supabasePath) {
      console.log(`⚠️  Could not extract path from: ${supabaseUrl}`);
      return supabaseUrl; // Return original URL if we can't extract path
    }

    // Download from Supabase
    const supabaseFullUrl = `${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${supabasePath}`;
    console.log(`📥 Downloading: ${supabaseFullUrl}`);
    
    const imageBuffer = await downloadImage(supabaseFullUrl);
    
    // Upload to Firebase
    console.log(`📤 Uploading to Firebase: ${firebasePath}`);
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg', // Default content type
        cacheControl: 'public, max-age=31536000', // 1 year cache
      }
    });

    // Make file public
    await file.makePublic();
    
    console.log(`✅ Uploaded: ${firebasePath}`);
    return getFirebasePublicUrl(firebasePath);
    
  } catch (error) {
    console.error(`❌ Error migrating ${supabaseUrl}:`, error);
    return supabaseUrl; // Return original URL on error
  }
}

// Migrate product images
async function migrateProductImages() {
  console.log('🔥 Starting product image migration...');
  
  try {
    // Get all products from Firebase
    const productsSnapshot = await db.collection('products').get();
    
    let totalImages = 0;
    let migratedImages = 0;
    let skippedImages = 0;
    
    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;
      
      console.log(`\n📦 Processing product: ${product.name} (${productId})`);
      
      const updatedImages = [];
      const updatedThumbnail = product.thumbnail_url;
      
      // Migrate thumbnail
      if (product.thumbnail_url && product.thumbnail_url.includes('supabase')) {
        const thumbnailPath = `products/thumbnails/${productId}_thumbnail.jpg`;
        const newThumbnailUrl = await migrateImage(product.thumbnail_url, thumbnailPath);
        
        if (newThumbnailUrl !== product.thumbnail_url) {
          migratedImages++;
        }
        
        // Update thumbnail URL
        await db.collection('products').doc(productId).update({
          thumbnail_url: newThumbnailUrl
        });
      } else {
        skippedImages++;
      }
      
      // Migrate gallery images
      if (product.images && Array.isArray(product.images)) {
        for (let i = 0; i < product.images.length; i++) {
          const imageUrl = product.images[i];
          totalImages++;
          
          if (imageUrl && imageUrl.includes('supabase')) {
            const galleryPath = `products/gallery/${productId}_image_${i}.jpg`;
            const newImageUrl = await migrateImage(imageUrl, galleryPath);
            
            if (newImageUrl !== imageUrl) {
              migratedImages++;
              updatedImages[i] = newImageUrl;
            } else {
              updatedImages[i] = imageUrl;
            }
          } else {
            updatedImages[i] = imageUrl;
            skippedImages++;
          }
        }
        
        // Update images array if any were migrated
        if (updatedImages.some((img, i) => img !== product.images[i])) {
          await db.collection('products').doc(productId).update({
            images: updatedImages
          });
        }
      }
      
      totalImages++; // Count thumbnail
    }
    
    console.log('\n🎉 Product image migration completed!');
    console.log(`📊 Summary:`);
    console.log(`- Total images processed: ${totalImages}`);
    console.log(`- Images migrated to Firebase: ${migratedImages}`);
    console.log(`- Images skipped (already Firebase/external): ${skippedImages}`);
    
  } catch (error) {
    console.error('❌ Error in product image migration:', error);
  }
}

// Migrate order item images
async function migrateOrderItemImages() {
  console.log('\n🔥 Starting order item image migration...');
  
  try {
    const orderItemsSnapshot = await db.collection('order_items').get();
    
    let migratedImages = 0;
    
    for (const itemDoc of orderItemsSnapshot.docs) {
      const item = itemDoc.data();
      const itemId = itemDoc.id;
      
      // Migrate product_thumbnail_url
      if (item.product_thumbnail_url && item.product_thumbnail_url.includes('supabase')) {
        const thumbnailPath = `order-items/${itemId}_product_thumbnail.jpg`;
        const newThumbnailUrl = await migrateImage(item.product_thumbnail_url, thumbnailPath);
        
        if (newThumbnailUrl !== item.product_thumbnail_url) {
          migratedImages++;
          await db.collection('order_items').doc(itemId).update({
            product_thumbnail_url: newThumbnailUrl
          });
        }
      }
      
      // Migrate thumbnail_url
      if (item.thumbnail_url && item.thumbnail_url.includes('supabase')) {
        const thumbnailPath = `order-items/${itemId}_thumbnail.jpg`;
        const newThumbnailUrl = await migrateImage(item.thumbnail_url, thumbnailPath);
        
        if (newThumbnailUrl !== item.thumbnail_url) {
          migratedImages++;
          await db.collection('order_items').doc(itemId).update({
            thumbnail_url: newThumbnailUrl
          });
        }
      }
    }
    
    console.log(`✅ Order item image migration completed!`);
    console.log(`📊 Images migrated: ${migratedImages}`);
    
  } catch (error) {
    console.error('❌ Error in order item image migration:', error);
  }
}

// Main migration function
async function migrateAllImages() {
  console.log('🚀 Starting complete image migration from Supabase to Firebase...');
  
  await migrateProductImages();
  await migrateOrderItemImages();
  
  console.log('\n🎉 Complete image migration finished!');
  console.log('🔗 Firebase Storage: https://console.firebase.google.com/project/fici-shoes/storage/fici-shoes.firebasestorage.app/files');
}

// Run the migration
migrateAllImages().then(() => {
  console.log('\n✅ Image migration complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
