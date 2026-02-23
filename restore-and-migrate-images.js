import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { parse } from 'csv-parse/sync';

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

// Migrate single image from Supabase to Firebase
async function migrateImage(supabaseUrl, firebasePath) {
  try {
    console.log(`📥 Processing: ${supabaseUrl}`);
    
    // Extract path from Supabase URL
    const supabasePath = extractSupabasePath(supabaseUrl);
    if (!supabasePath) {
      console.log(`⚠️  Could not extract path from: ${supabaseUrl}`);
      return supabaseUrl;
    }

    // Download from Supabase
    const supabaseFullUrl = `${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${supabasePath}`;
    console.log(`📥 Downloading: ${supabaseFullUrl}`);
    
    const imageBuffer = await downloadImage(supabaseFullUrl);
    
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
    console.error(`❌ Error migrating ${supabaseUrl}:`, error);
    return supabaseUrl;
  }
}

// Load original CSV data
function loadOriginalCSVData() {
  try {
    const fileContent = readFileSync('./tables_data/products_rows (1).csv', 'utf8');
    const records = parse(fileContent, { 
      columns: true, 
      skip_empty_lines: true,
      cast: (value, context) => {
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            return JSON.parse(value.replace(/""/g, '"'));
          } catch (e) {
            return value;
          }
        }
        return value;
      }
    });
    
    // Create a map of product_id to original data
    const productMap = {};
    records.forEach(record => {
      productMap[record.product_id] = record;
    });
    
    return productMap;
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return {};
  }
}

// Restore original URLs and migrate to Firebase
async function restoreAndMigrateImages() {
  console.log('🔥 Starting image restoration and migration...');
  
  try {
    // Load original CSV data
    const originalData = loadOriginalCSVData();
    console.log(`📊 Loaded ${Object.keys(originalData).length} products from CSV`);
    
    // Get all products from Firebase
    const productsSnapshot = await db.collection('products').get();
    
    let totalImages = 0;
    let migratedImages = 0;
    let failedImages = 0;
    
    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;
      
      // Get original data from CSV
      const originalProduct = originalData[productId];
      if (!originalProduct) {
        console.log(`⚠️  No original data found for product: ${productId}`);
        continue;
      }
      
      console.log(`\n📦 Processing product: ${product.name} (${productId})`);
      
      const updatedImages = [];
      let updatedThumbnail = product.thumbnail_url;
      
      // Restore and migrate thumbnail
      if (originalProduct.thumbnail_url && originalProduct.thumbnail_url.includes('supabase')) {
        const thumbnailPath = `products/thumbnails/${productId}_thumbnail.jpg`;
        const newThumbnailUrl = await migrateImage(originalProduct.thumbnail_url, thumbnailPath);
        
        if (newThumbnailUrl !== originalProduct.thumbnail_url) {
          migratedImages++;
          updatedThumbnail = newThumbnailUrl;
        }
      }
      
      // Restore and migrate gallery images
      if (originalProduct.images) {
        let imagesArray = [];
        
        // Parse images from CSV
        if (typeof originalProduct.images === 'string') {
          if (originalProduct.images.startsWith('http')) {
            // Comma-separated URLs
            imagesArray = originalProduct.images.split(',').map(url => url.trim());
          } else {
            // Try JSON parse
            try {
              imagesArray = JSON.parse(originalProduct.images.replace(/""/g, '"'));
            } catch (e) {
              imagesArray = [originalProduct.images];
            }
          }
        } else if (Array.isArray(originalProduct.images)) {
          imagesArray = originalProduct.images;
        }
        
        for (let i = 0; i < imagesArray.length; i++) {
          const imageUrl = imagesArray[i];
          totalImages++;
          
          if (imageUrl && imageUrl.includes('supabase')) {
            const galleryPath = `products/gallery/${productId}_image_${i}.jpg`;
            const newImageUrl = await migrateImage(imageUrl, galleryPath);
            
            if (newImageUrl !== imageUrl) {
              migratedImages++;
              updatedImages[i] = newImageUrl;
            } else {
              updatedImages[i] = imageUrl;
              failedImages++;
            }
          } else {
            updatedImages[i] = imageUrl;
          }
        }
      }
      
      // Update product in Firestore with new Firebase URLs
      await db.collection('products').doc(productId).update({
        thumbnail_url: updatedThumbnail,
        images: updatedImages
      });
      
      console.log(`✅ Updated product URLs in Firestore`);
    }
    
    console.log('\n🎉 Image restoration and migration completed!');
    console.log(`📊 Summary:`);
    console.log(`- Total images processed: ${totalImages + productsSnapshot.size}`);
    console.log(`- Images migrated to Firebase: ${migratedImages}`);
    console.log(`- Images failed: ${failedImages}`);
    
  } catch (error) {
    console.error('❌ Error in image restoration and migration:', error);
  }
}

// Main migration function
async function migrateAllImages() {
  console.log('🚀 Starting complete image restoration and migration...');
  console.log('📥 This will restore original Supabase URLs and migrate them to Firebase');
  
  await restoreAndMigrateImages();
  
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
