import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

// Helper function to parse CSV file
function parseCSVFile(filePath) {
  try {
    const fileContent = readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        // Handle boolean values
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // Handle null/empty values
        if (value === '' || value === null || value === 'NULL') return null;
        
        // Handle numeric values
        if (!isNaN(value) && value !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) return num;
        }
        
        // Handle JSON strings
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
    return records;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

// Helper function to convert date strings to Firestore timestamps
function convertDates(obj) {
  const converted = { ...obj };
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    // Handle date strings
    if (typeof value === 'string' && 
        (value.includes('-') && value.includes(':')) && 
        !value.includes('T')) {
      // Convert PostgreSQL timestamp format to JavaScript Date
      try {
        converted[key] = new Date(value);
      } catch (e) {
        // Keep original if conversion fails
      }
    }
    
    // Handle timestamp with timezone
    if (typeof value === 'string' && value.includes('+00:00')) {
      try {
        converted[key] = new Date(value);
      } catch (e) {
        // Keep original if conversion fails
      }
    }
  });
  
  return converted;
}

// Helper function to safely create document reference
function createDocumentRef(collectionName, docId) {
  if (!docId || docId === '') {
    return null;
  }
  return doc(db, collectionName, docId);
}

// Import user_profiles
async function importUserProfiles() {
  console.log('📥 Importing user_profiles...');
  const records = parseCSVFile('./tables_data/user_profiles_rows.csv');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const converted = convertDates(record);
      
      // Parse addresses if it's a string
      if (typeof converted.addresses === 'string') {
        try {
          converted.addresses = JSON.parse(converted.addresses);
        } catch (e) {
          converted.addresses = [];
        }
      }
      
      await db.collection('user_profiles').doc(record.user_id).set(converted);
      successCount++;
    } catch (error) {
      console.error(`Error importing user ${record.user_id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ User Profiles: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Import products
async function importProducts() {
  console.log('📥 Importing products...');
  const records = parseCSVFile('./tables_data/products_rows (1).csv');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const converted = convertDates(record);
      
      // Parse sizes JSON
      if (typeof converted.sizes === 'string') {
        try {
          converted.sizes = JSON.parse(converted.sizes.replace(/""/g, '"'));
        } catch (e) {
          converted.sizes = {};
        }
      }
      
      // Parse images array
      if (typeof converted.images === 'string') {
        try {
          converted.images = converted.images.split(',').map(img => img.trim());
        } catch (e) {
          converted.images = [];
        }
      }
      
      // Parse size_prices if exists
      if (converted.size_prices && typeof converted.size_prices === 'string') {
        try {
          converted.size_prices = JSON.parse(converted.size_prices);
        } catch (e) {
          converted.size_prices = null;
        }
      }
      
      // Parse tags array
      if (converted.tags && typeof converted.tags === 'string') {
        try {
          converted.tags = JSON.parse(converted.tags);
        } catch (e) {
          converted.tags = [];
        }
      }
      
      await db.collection('products').doc(record.product_id).set(converted);
      successCount++;
    } catch (error) {
      console.error(`Error importing product ${record.product_id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Products: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Import orders
async function importOrders() {
  console.log('📥 Importing orders...');
  const records = parseCSVFile('./tables_data/orders_rows.csv');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const converted = convertDates(record);
      
      // Parse shipping_address JSON
      if (typeof converted.shipping_address === 'string') {
        try {
          converted.shipping_address = JSON.parse(converted.shipping_address);
        } catch (e) {
          converted.shipping_address = null;
        }
      }
      
      // Parse items JSON if exists
      if (converted.items && typeof converted.items === 'string') {
        try {
          converted.items = JSON.parse(converted.items);
        } catch (e) {
          converted.items = [];
        }
      }
      
      await db.collection('orders').doc(record.order_id).set(converted);
      successCount++;
    } catch (error) {
      console.error(`Error importing order ${record.order_id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Orders: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Import order_items
async function importOrderItems() {
  console.log('📥 Importing order_items...');
  const records = parseCSVFile('./tables_data/order_items_rows.csv');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const converted = convertDates(record);
      
      // Parse status_email_sent JSON
      if (typeof converted.status_email_sent === 'string') {
        try {
          converted.status_email_sent = JSON.parse(converted.status_email_sent);
        } catch (e) {
          converted.status_email_sent = {};
        }
      }
      
      await db.collection('order_items').doc(record.order_item_id).set(converted);
      successCount++;
    } catch (error) {
      console.error(`Error importing order item ${record.order_item_id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Order Items: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Import payments
async function importPayments() {
  console.log('📥 Importing payments...');
  const records = parseCSVFile('./tables_data/payments_rows.csv');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const converted = convertDates(record);
      
      // Parse provider_response JSON if exists
      if (converted.provider_response && typeof converted.provider_response === 'string') {
        try {
          converted.provider_response = JSON.parse(converted.provider_response);
        } catch (e) {
          converted.provider_response = null;
        }
      }
      
      await db.collection('payments').doc(record.payment_id).set(converted);
      successCount++;
    } catch (error) {
      console.error(`Error importing payment ${record.payment_id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Payments: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Import pincodes
async function importPincodes() {
  console.log('📥 Importing pincodes...');
  const records = parseCSVFile('./tables_data/pincodes_rows.csv');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const converted = convertDates(record);
      
      // Skip records with empty pincode
      if (!record.pincode || record.pincode.toString().trim() === '') {
        errorCount++;
        continue;
      }
      
      // Parse districts array
      if (typeof converted.districts === 'string') {
        try {
          converted.districts = JSON.parse(converted.districts);
        } catch (e) {
          converted.districts = [];
        }
      }
      
      await db.collection('pincodes').doc(record.pincode.toString().trim()).set(converted);
      successCount++;
    } catch (error) {
      console.error(`Error importing pincode ${record.pincode}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Pincodes: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Import product_visit_stats
async function importProductVisitStats() {
  console.log('📥 Importing product_visit_stats...');
  const records = parseCSVFile('./tables_data/product_visit_stats_rows.csv');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const converted = convertDates(record);
      
      await db.collection('product_visit_stats').doc(record.product_id).set(converted);
      successCount++;
    } catch (error) {
      console.error(`Error importing product visit stats ${record.product_id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Product Visit Stats: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
}

// Main import function
async function importAllData() {
  console.log('🔥 Starting comprehensive data import from Supabase to Firebase...');
  
  const results = {};
  
  try {
    // Import all collections
    results.userProfiles = await importUserProfiles();
    results.products = await importProducts();
    results.orders = await importOrders();
    results.orderItems = await importOrderItems();
    results.payments = await importPayments();
    results.pincodes = await importPincodes();
    results.productVisitStats = await importProductVisitStats();
    
    console.log('\n🎉 Data import completed!');
    console.log('\n📊 Summary:');
    
    Object.entries(results).forEach(([collection, result]) => {
      console.log(`- ${collection}: ${result.success} success, ${result.errors} errors`);
    });
    
    const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.success, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);
    
    console.log(`\n📈 Total: ${totalSuccess} records imported, ${totalErrors} errors`);
    
    if (totalErrors > 0) {
      console.log('\n⚠️  Some records failed to import. Check the error messages above.');
    } else {
      console.log('\n✅ All records imported successfully!');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
importAllData().then(() => {
  console.log('\n🚀 Firebase migration complete! Your database is ready.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
