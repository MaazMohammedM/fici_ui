import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import pkg from 'follow-redirects';
const { https } = pkg;

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'fici-shoes.appspot.com'
});

const storage = getStorage(app);
const bucket = storage.bucket();

// Supabase storage base URL
const SUPABASE_URL = 'https://qegaebazravcwofibtry.supabase.co/storage/v1/object/public/ficishoesimages/';

// Helper function to download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Helper function to upload image to Firebase Storage
async function uploadImageToFirebase(imageBuffer, destinationPath, contentType = 'image/jpeg') {
  const file = bucket.file(destinationPath);
  
  await file.save(imageBuffer, {
    metadata: {
      contentType: contentType,
      cacheControl: 'public, max-age=31536000', // 1 year cache
    }
  });

  // Make file public
  await file.makePublic();
  
  // Return public URL
  return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
}

// Extract product ID and image path from Supabase URL
function parseSupabaseImageUrl(supabaseUrl) {
  if (!supabaseUrl || !supabaseUrl.includes('ficishoesimages/')) {
    return null;
  }
  
  // Extract path after ficishoesimages/
  const pathMatch = supabaseUrl.match(/ficishoesimages\/(.+)/);
  if (!pathMatch) return null;
  
  const fullPath = pathMatch[1];
  const pathParts = fullPath.split('/');
  
  // Extract product folder and filename
  const productFolder = pathParts[0] || 'unknown';
  const filename = pathParts[pathParts.length - 1] || 'image.jpg';
  
  return {
    productFolder,
    filename,
    originalPath: fullPath
  };
}

// Get content type from file extension
function getContentType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

// Migrate product images
async function migrateProductImages() {
  console.log('🖼️  Starting product image migration...');
  
  try {
    // Get all products from Firestore to find their images
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore(app);
    
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => doc.data());
    
    console.log(`📦 Found ${products.length} products to process`);
    
    let totalImages = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const product of products) {
      console.log(`\n🔄 Processing product: ${product.name}`);
      
      // Parse images array
      let imageUrls = [];
      if (typeof product.images === 'string') {
        imageUrls = product.images.split(',').map(url => url.trim());
      } else if (Array.isArray(product.images)) {
        imageUrls = product.images;
      }
      
      // Also check thumbnail_url
      if (product.thumbnail_url && !imageUrls.includes(product.thumbnail_url)) {
        imageUrls.push(product.thumbnail_url);
      }
      
      const firebaseImageUrls = [];
      
      for (const imageUrl of imageUrls) {
        if (!imageUrl || !imageUrl.startsWith('https://qegaebazravcwofibtry.supabase.co')) {
          console.log(`  ⏭️  Skipping non-Supabase URL: ${imageUrl}`);
          skippedCount++;
          continue;
        }
        
        totalImages++;
        
        try {
          const parsed = parseSupabaseImageUrl(imageUrl);
          if (!parsed) {
            console.log(`  ⚠️  Could not parse URL: ${imageUrl}`);
            errorCount++;
            continue;
          }
          
          console.log(`  📥 Downloading: ${parsed.originalPath}`);
          
          // Download image from Supabase
          const imageBuffer = await downloadImage(imageUrl);
          
          // Create Firebase Storage path
          const firebasePath = `products/${parsed.productFolder}/${parsed.filename}`;
          
          // Upload to Firebase Storage
          const firebaseUrl = await uploadImageToFirebase(
            imageBuffer, 
            firebasePath, 
            getContentType(parsed.filename)
          );
          
          firebaseImageUrls.push(firebaseUrl);
          successCount++;
          console.log(`  ✅ Uploaded: ${firebaseUrl}`);
          
        } catch (error) {
          console.error(`  ❌ Error processing ${imageUrl}:`, error.message);
          errorCount++;
        }
      }
      
      // Update product document with new Firebase URLs
      if (firebaseImageUrls.length > 0) {
        await db.collection('products').doc(product.product_id).update({
          images: firebaseImageUrls,
          thumbnail_url: firebaseImageUrls[0] || product.thumbnail_url,
          image_migrated: true,
          migration_date: new Date()
        });
        console.log(`  📝 Updated product with ${firebaseImageUrls.length} Firebase URLs`);
      }
    }
    
    console.log('\n🎉 Image migration completed!');
    console.log('\n📊 Summary:');
    console.log(`- Total images processed: ${totalImages}`);
    console.log(`- Successfully migrated: ${successCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    
    return { success: successCount, errors: errorCount, skipped: skippedCount };
    
  } catch (error) {
    console.error('❌ Fatal error during image migration:', error);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Supabase to Firebase Storage migration...');
  
  try {
    const result = await migrateProductImages();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
