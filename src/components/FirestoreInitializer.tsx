import { useEffect } from 'react';
import { 
  db, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  serverTimestamp 
} from '../lib/firebase';

export default function FirestoreInitializer() {
  useEffect(() => {
    const initializeCollections = async () => {
      try {
        console.log('🚀 Initializing Firestore collections...');

        // Collections that need to be created
        const collections = [
          'reviews',
          'checkout_discount_rules', 
          'product_discounts',
          'traffic_sources',
          'pincodes',
          'guest_sessions',
          'payments',
          'refunds',
          'otps',
          'user_identities', 
          'account_merges',
          'product_visit_stats'
        ];

        // Create each collection with a sample document
        for (const collectionName of collections) {
          try {
            console.log(`📁 Creating collection: ${collectionName}`);
            
            const placeholderData = {
              _initialized: true,
              created_at: serverTimestamp(),
              note: 'This is a placeholder document to ensure collection exists'
            };

            const docRef = await addDoc(collection(db, collectionName), placeholderData);
            console.log(`✅ Created ${collectionName} collection with doc ID: ${docRef.id}`);
            
          } catch (error: any) {
            console.log(`ℹ️ Collection ${collectionName} might already exist:`, error?.message || error);
          }
        }

        // Create sample pincodes
        const samplePincodes = [
          {
            pincode: "110001",
            city: "New Delhi",
            state: "Delhi",
            active: true,
            is_serviceable: true,
            cod_allowed: true,
            min_order_amount: 0,
            shipping_fee: 0,
            cod_fee: 0,
            free_shipping_threshold: 500,
            delivery_time: "2-3 days",
            districts: ["Central Delhi"],
            is_returnable: true,
            is_exchangeable: true,
            return_window_days: 7,
            exchange_window_days: 7
          },
          {
            pincode: "400001",
            city: "Mumbai", 
            state: "Maharashtra",
            active: true,
            is_serviceable: true,
            cod_allowed: true,
            min_order_amount: 0,
            shipping_fee: 0,
            cod_fee: 0,
            free_shipping_threshold: 500,
            delivery_time: "2-3 days",
            districts: ["Mumbai City"],
            is_returnable: true,
            is_exchangeable: true,
            return_window_days: 7,
            exchange_window_days: 7
          },
          {
            pincode: "560001",
            city: "Bangalore",
            state: "Karnataka", 
            active: true,
            is_serviceable: true,
            cod_allowed: true,
            min_order_amount: 0,
            shipping_fee: 0,
            cod_fee: 0,
            free_shipping_threshold: 500,
            delivery_time: "2-3 days",
            districts: ["Bangalore Urban"],
            is_returnable: true,
            is_exchangeable: true,
            return_window_days: 7,
            exchange_window_days: 7
          }
        ];

        console.log('📍 Adding sample pincodes...');
        for (const pincode of samplePincodes) {
          try {
            await setDoc(doc(db, 'pincodes', pincode.pincode), {
              ...pincode,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
            console.log(`✅ Added pincode: ${pincode.pincode}`);
          } catch (error: any) {
            console.log(`ℹ️ Pincode ${pincode.pincode} might already exist:`, error?.message || error);
          }
        }

        // Create sample checkout discount rule
        const sampleDiscountRule = {
          rule_type: "percent",
          percent: 10,
          min_order: 1000,
          max_discount_cap: 100,
          active: true,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        try {
          await addDoc(collection(db, 'checkout_discount_rules'), sampleDiscountRule);
          console.log('✅ Added sample checkout discount rule');
        } catch (error: any) {
          console.log('ℹ️ Checkout discount rule might already exist:', error?.message || error);
        }

        console.log('🎉 Firestore collections initialization complete!');
        
      } catch (error: any) {
        console.error('❌ Error initializing collections:', error?.message || error);
      }
    };

    // Run initialization
    initializeCollections();
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>🔥 Initializing Firestore Collections...</h2>
      <p>Please check the browser console for progress.</p>
      <p>Once initialization is complete, you can close this tab.</p>
    </div>
  );
}
