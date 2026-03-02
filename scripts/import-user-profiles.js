const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBkZ7P2Y8c8QFjr_HnQx9lG3vRt8ySdXyU",
  authDomain: "fici-shoes.firebaseapp.com",
  projectId: "fici-shoes",
  storageBucket: "fici-shoes.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
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
    const values = lines[i].split(',').map(v => v.trim());
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
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
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
