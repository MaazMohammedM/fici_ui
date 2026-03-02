// Simple script to add addresses to nmf16648@gmail.com user profile
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, arrayUnion } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAkN9flWbY8Jgr854vn_DLOti9NuaoSLak",
  authDomain: "fici-shoes.firebaseapp.com",
  projectId: "fici-shoes",
  storageBucket: "fici-shoes.firebasestorage.app",
  messagingSenderId: "217737816203",
  appId: "1:217737816203:web:9825f43452609cd3ca0c8e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addAddresses() {
  const addresses = [
    {
      id: "addr_1756573120464",
      city: "Bengaluru",
      name: "Mohammed Furqhaan",
      email: "furqhaanmohammed001@gmail.com",
      phone: "8428426834",
      state: "Karnataka",
      address: "12/2 SS Manzil\n5th Cross Rama tent road",
      pincode: "560045",
      district: "Bengaluru district",
      landmark: "",
      is_default: false
    }
  ];

  try {
    await updateDoc(doc(db, 'user_profiles', '8aeddc2d-0e9d-466d-914a-555be0714fac'), {
      addresses: arrayUnion(...addresses)
    });
    console.log('✅ Addresses added successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addAddresses();
