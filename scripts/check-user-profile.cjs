const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function checkUserProfile() {
  try {
    console.log('🔍 Checking user profile for nmf16648@gmail.com...');
    
    // Check the specific user that should have addresses
    const userDoc = await getDoc(doc(db, 'user_profiles', '8aeddc2d-0e9d-466d-914a-555be0714fac'));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('📋 User profile data:', JSON.stringify(data, null, 2));
      
      if (data.addresses) {
        console.log('✅ Addresses found:', data.addresses.length);
        console.log('📍 First address:', JSON.stringify(data.addresses[0], null, 2));
      } else {
        console.log('❌ No addresses field found');
        console.log('🔑 Available fields:', Object.keys(data));
      }
    } else {
      console.log('❌ User profile document does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
  }
}

// Run the check
checkUserProfile()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
