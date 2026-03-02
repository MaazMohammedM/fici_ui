const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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

async function initializeUserProfilesCollection() {
  try {
    console.log('🚀 Initializing user_profiles collection...');
    
    // Create a sample user profile document to ensure collection exists
    const sampleUserProfile = {
      user_id: 'sample_user_id',
      first_name: 'Sample',
      last_name: 'User',
      email: 'sample@example.com',
      role: 'user',
      phone_number: '+1234567890',
      addresses: [
        {
          id: 'addr_sample_001',
          city: 'Sample City',
          name: 'Sample User',
          email: 'sample@example.com',
          phone: '+1234567890',
          state: 'Sample State',
          address: '123 Sample Street',
          pincode: '123456',
          district: 'Sample District',
          landmark: 'Near Sample Landmark',
          is_default: true
        }
      ],
      is_guest: false,
      guest_session_id: null,
      phone_verified: true,
      email_verified: true,
      merged_from_guest_id: null,
      last_login_at: new Date(),
      login_method: 'email',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    // Add the sample document
    await setDoc(doc(db, 'user_profiles', 'sample_user_id'), sampleUserProfile);
    console.log('✅ Created user_profiles collection with sample document');
    
    console.log('🎉 User profiles collection initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing user_profiles collection:', error);
    throw error;
  }
}

// Run the initialization
initializeUserProfilesCollection()
  .then(() => {
    console.log('✅ User profiles collection initialization completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });
