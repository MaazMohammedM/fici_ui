import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import https from 'https';
import { URL } from 'url';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'fici-shoes.firebasestorage.app'
});

const storage = getStorage(app);
const bucket = storage.bucket();

// Supabase storage configuration
const SUPABASE_URL = 'https://qegaebazravcwofibtry.storage.supabase.co/storage/v1/s3/ap-south-1';
const SUPABASE_ACCESS_KEY = '1c985edfd78dc1e123065242e43a2bde';
const SUPABASE_SECRET = '1c985edfd78dc1e123065242e43a2bde';

// Helper function to download image from Supabase
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// Helper function to extract file path from Supabase URL
function extractSupabasePath(url) {
  if (!url) return null;
  
  try {
    // Extract path from Supabase URL
    // Example: https://qegaebazravcwofibtry.supabase.co/storage/v1/object/public/ficishoesimages/casl01_dk.tan/casl01_dk.tan_1.png
    const match = url.match(/\/ficishoesimages\/(.+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting path:', error);
    return null;
  }
}

// Helper function to generate Firebase Storage path
function generateFirebasePath(supabasePath, productId, index = 0) {
  if (!supabasePath) return null;
  
  // Extract filename from path
  const filename = supabasePath.split('/').pop();
  const extension = filename.split('.').pop();
  
  // Create organized folder structure
  return `products/${productId}/${filename}`;
}

// Parse products CSV to get image URLs
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

// Migrate images for a single product
async function migrateProductImages(product) {
  const { product_id, images, thumbnail_url } = product;
  console.log(`📥 Migrating images for product: ${product.name} (${product_id})`);
  
  let successCount = 0;
  let errorCount = 0;
  const migratedUrls = [];
  
  try {
    // Migrate thumbnail URL first
    if (thumbnail_url) {
      const supabasePath = extractSupabasePath(thumbnail_url);
      if (supabasePath) {
        const firebasePath = generateFirebasePath(supabasePath, product_id, 0);
        if (firebasePath) {
          try {
            const supabaseUrl = `${SUPABASE_URL}/ficishoesimages/${supabasePath}`;
            const imageBuffer = await downloadImage(supabaseUrl);
            
            const file = bucket.file(firebasePath);
            await file.save(imageBuffer, {
              metadata: {
                contentType: `image/${supabasePath.split('.').pop()}`,
                cacheControl: 'public, max-age=31536000',
              }
            });
            
            // Make file publicly readable
            await file.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebasePath}`;
            migratedUrls.push(publicUrl);
            successCount++;
            
            console.log(`  ✅ Thumbnail migrated: ${firebasePath}`);
          } catch (error) {
            console.error(`  ❌ Thumbnail migration failed:`, error.message);
            errorCount++;
          }
        }
      }
    }
    
    // Migrate product images
    if (images && typeof images === 'string') {
      const imageUrls = images.split(',').map(url => url.trim());
      
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        const supabasePath = extractSupabasePath(imageUrl);
        
        if (supabasePath) {
          const firebasePath = generateFirebasePath(supabasePath, product_id, i + 1);
          if (firebasePath) {
            try {
              const supabaseUrl = `${SUPABASE_URL}/ficishoesimages/${supabasePath}`;
              const imageBuffer = await downloadImage(supabaseUrl);
              
              const file = bucket.file(firebasePath);
              await file.save(imageBuffer, {
                metadata: {
                  contentType: `image/${supabasePath.split('.').pop()}`,
                  cacheControl: 'public, max-age=31536000',
                }
              });
              
              // Make file publicly readable
              await file.makePublic();
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebasePath}`;
              migratedUrls.push(publicUrl);
              successCount++;
              
              console.log(`  ✅ Image ${i + 1} migrated: ${firebasePath}`);
            } catch (error) {
              console.error(`  ❌ Image ${i + 1} migration failed:`, error.message);
              errorCount++;
            }
          }
        }
      }
    }
    
    // Update product in Firestore with new Firebase URLs
    if (migratedUrls.length > 0) {
      const { getFirestore, doc, updateDoc } = await import('firebase-admin/firestore');
      const db = getFirestore(app);
      
      const updateData = {};
      if (migratedUrls.length > 0) {
        updateData.thumbnail_url = migratedUrls[0]; // First image as thumbnail
        updateData.images = migratedUrls.join(',');
      }
      
      await updateDoc(doc(db, 'products', product_id), updateData);
      console.log(`  🔄 Product URLs updated in Firestore`);
    }
    
  } catch (error) {
    console.error(`❌ Product migration failed:`, error);
    errorCount++;
  }
  
  return { success: successCount, errors: errorCount, urls: migratedUrls };
}

// Main migration function
async function migrateAllImages() {
  console.log('🔥 Starting image migration from Supabase to Firebase Storage...');
  
  try {
    const products = parseProductsCSV();
    console.log(`📊 Found ${products.length} products to process`);
    
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalProducts = 0;
    
    // Process products in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
      
      for (const product of batch) {
        const result = await migrateProductImages(product);
        totalSuccess += result.success;
        totalErrors += result.errors;
        totalProducts++;
        
        // Small delay between products to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 Image migration completed!');
    console.log('\n📊 Summary:');
    console.log(`- Products processed: ${totalProducts}`);
    console.log(`- Images migrated: ${totalSuccess}`);
    console.log(`- Migration errors: ${totalErrors}`);
    
    if (totalErrors > 0) {
      console.log('\n⚠️  Some images failed to migrate. Check the error messages above.');
    } else {
      console.log('\n✅ All images migrated successfully!');
    }
    
    console.log('\n🔗 Firebase Storage: https://console.firebase.google.com/project/fici-shoes/storage/fici-shoes.firebasestorage.app/files/products');
    
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateAllImages().then(() => {
  console.log('\n🚀 Image migration complete! Your images are now in Firebase Storage.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
