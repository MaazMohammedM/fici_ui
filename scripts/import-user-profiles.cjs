const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config - use environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAkN9flWbY8Jgr854vn_DLOti9NuaoSLak",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "fici-shoes.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "fici-shoes",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "fici-shoes.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "217737816203",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:217737816203:web:9825f43452609cd3ca0c8e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to parse CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    // Parse CSV handling quoted fields with commas inside
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote, add and skip next
          current += '"';
          j++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    values.push(current.trim());
    
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || null;
    }
    
    data.push(row);
  }
  
  return data;
}

// Function to safely parse JSON
function safeParseJSON(jsonString) {
  try {
    if (!jsonString || jsonString === '""' || jsonString === '') {
      return [];
    }
    
    // Handle the specific CSV format: "[{""id"": ""value""...}]" 
    let cleanJson = jsonString;
    
    // Remove outer quotes if present
    if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
      cleanJson = cleanJson.slice(1, -1);
    }
    
    // Replace double escaped quotes with single quotes
    cleanJson = cleanJson.replace(/""/g, '"');
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString.substring(0, 100) + '...', error);
    return [];
  }
}

async function importUserProfiles() {
  try {
    console.log('🚀 Importing user profiles from CSV...');
    
    const csvPath = path.join(__dirname, '..', 'user_profiles_rows.csv');
    const userData = parseCSV(csvPath);
    
    console.log(`📊 Found ${userData.length} user profiles to import`);
    
    for (const user of userData) {
      try {
        const userProfile = {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          phone_number: user.phone_number,
          addresses: safeParseJSON(user.addresses),
          is_guest: user.is_guest === 'true',
          guest_session_id: user.guest_session_id,
          phone_verified: user.phone_verified === 'true',
          email_verified: user.email_verified === 'true',
          merged_from_guest_id: user.merged_from_guest_id,
          last_login_at: user.last_login_at ? new Date(user.last_login_at) : null,
          login_method: user.login_method,
          created_at: user.created_at ? new Date(user.created_at) : serverTimestamp(),
          updated_at: serverTimestamp()
        };

        // Use user_id as document ID
        await setDoc(doc(db, 'user_profiles', user.user_id), userProfile);
        console.log(`✅ Imported user profile: ${user.email} (${user.user_id})`);
        
      } catch (error) {
        console.error(`❌ Error importing user ${user.email}:`, error.message);
      }
    }
    
    console.log('🎉 User profiles import complete!');
    
  } catch (error) {
    console.error('❌ Error importing user profiles:', error);
    throw error;
  }
}

// Run the import
importUserProfiles()
  .then(() => {
    console.log('✅ Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
