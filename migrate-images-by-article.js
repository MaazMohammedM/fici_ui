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

// List of article ID folders from Supabase bucket
const ARTICLE_FOLDERS = [
  'bpbl01_black',
  'cadc05_navyblue', 
  'cadc06_brown',
  'casl01_dk.tan',
  'casl01_grey',
  'casl01_tan',
  'Caslgr_grey',
  'Caslprt_tan',
  'Casslp_black',
  'cawo03_tan',
  'Cflda54_dk.navy',
  'Chdrpl23_black'
];

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

// Helper function to get all images from Supabase folder
async function getImagesFromSupabaseFolder(articleId) {
  try {
    // List files in the Supabase folder
    const listUrl = `${SUPABASE_URL}/object/list/${SUPABASE_BUCKET}?prefix=${articleId}/`;
    
    const response = await fetch(listUrl, {
      headers: {
        'apikey': 'your-api-key-here', // You might need to add your Supabase anon key
        'Authorization': 'Bearer your-anon-key-here'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️  Could not list files for ${articleId}, trying common patterns...`);
      return getCommonImagePatterns(articleId);
    }
    
    const data = await response.json();
    return data.map(file => `${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${file.name}`);
    
  } catch (error) {
    console.log(`⚠️  Error listing ${articleId}, using common patterns...`);
    return getCommonImagePatterns(articleId);
  }
}

// Helper function to generate common image patterns
function getCommonImagePatterns(articleId) {
  const patterns = [];
  
  // Common image numbers
  for (let i = 1; i <= 6; i++) {
    patterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}_${i}.png`);
    patterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}_${i}.jpg`);
    patterns.push(`${SUPABASE_URL}/object/public/${SUPABASE_BUCKET}/${articleId}/${articleId}_${i}.webp`);
  }
  
  return patterns;
}

// Helper function to get Firebase Storage public URL
function getFirebasePublicUrl(filePath) {
  return `https://firebasestorage.googleapis.com/v0/b/fici-shoes.firebasestorage.app/o/${encodeURIComponent(filePath)}?alt=media`;
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
        contentType: 'image/jpeg', // Will be auto-detected
        cacheControl: 'public, max-age=31536000', // 1 year cache
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

// Check if image exists before downloading
async function imageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Migrate images for a single article folder
async function migrateArticleFolder(articleId) {
  console.log(`\n📦 Processing article folder: ${articleId}`);
  
  const imageUrls = await getImagesFromSupabaseFolder(articleId);
  let uploadedCount = 0;
  
  for (const imageUrl of imageUrls) {
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
    
    if (exists) {
      console.log(`⏭️  Already exists: ${firebasePath}`);
      uploadedCount++;
      continue;
    }
    
    // Upload to Firebase
    const result = await uploadImageToFirebase(imageUrl, firebasePath);
    if (result) {
      uploadedCount++;
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Completed ${articleId}: ${uploadedCount} images`);
  return uploadedCount;
}

// Main migration function
async function migrateAllArticleFolders() {
  console.log('🚀 Starting complete image migration from Supabase to Firebase...');
  console.log(`📁 Processing ${ARTICLE_FOLDERS.length} article folders...\n`);
  
  let totalUploaded = 0;
  
  for (const articleId of ARTICLE_FOLDERS) {
    const uploaded = await migrateArticleFolder(articleId);
    totalUploaded += uploaded;
  }
  
  console.log('\n🎉 Migration completed!');
  console.log(`📊 Total images uploaded: ${totalUploaded}`);
  console.log('\n🔗 Firebase Storage: https://console.firebase.google.com/project/fici-shoes/storage/fici-shoes.firebasestorage.app/files/~2Fproducts');
  
  // Update product URLs in Firestore
  await updateProductImageUrls();
}

// Update product image URLs in Firestore to use new Firebase structure
async function updateProductImageUrls() {
  console.log('\n🔄 Updating product image URLs in Firestore...');
  
  try {
    const productsSnapshot = await db.collection('products').get();
    let updatedCount = 0;
    
    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const articleId = product.article_id;
      
      if (!articleId) continue;
      
      // Get all images for this article from Firebase
      const folderPath = `products/${articleId}/`;
      const [files] = await bucket.getFiles({ 
        prefix: folderPath,
        delimiter: '/'
      });
      
      if (files.length === 0) continue;
      
      // Sort files to get consistent order
      const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
      
      // Generate Firebase URLs
      const firebaseUrls = sortedFiles.map(file => getFirebasePublicUrl(file.name));
      
      // Update product document
      const updates = {
        images: firebaseUrls
      };
      
      // Set thumbnail to first image if not set
      if (firebaseUrls.length > 0 && (!product.thumbnail_url || product.thumbnail_url.includes('supabase'))) {
        updates.thumbnail_url = firebaseUrls[0];
      }
      
      await db.collection('products').doc(productDoc.id).update(updates);
      updatedCount++;
      
      console.log(`✅ Updated ${articleId} with ${firebaseUrls.length} images`);
    }
    
    console.log(`\n🎯 Updated ${updatedCount} products with Firebase image URLs`);
    
  } catch (error) {
    console.error('❌ Error updating product URLs:', error);
  }
}

// Run the migration
migrateAllArticleFolders().then(() => {
  console.log('\n✅ Complete image migration finished!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
