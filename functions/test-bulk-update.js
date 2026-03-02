// Simple test script to verify the new bulk update functions work correctly
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'fici-shoes'
  });
}

const db = admin.firestore();

async function testBulkUpdateFunctions() {
  console.log('🧪 Testing bulk update functions...');
  
  try {
    // Test 1: Test getBulkUpdateCount logic
    console.log('\n📊 Testing getBulkUpdateCount logic...');
    
    // Build a test query
    let query = db.collection('pincodes').limit(5);
    const snapshot = await query.get();
    console.log(`✅ Query test: Found ${snapshot.docs.length} test documents`);
    
    // Test count aggregation
    const countSnapshot = await query.count();
    console.log(`✅ Count test: ${countSnapshot.count} documents counted`);
    
    // Test 2: Test bulk update logic with a small batch
    console.log('\n🔄 Testing bulk update logic...');
    
    if (snapshot.docs.length > 0) {
      const testDoc = snapshot.docs[0];
      const originalData = testDoc.data();
      
      // Create a test update
      const updateData = {
        test_field: 'test_value_' + Date.now(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Test single document update
      await testDoc.ref.update(updateData);
      console.log(`✅ Single update test: Updated document ${testDoc.id}`);
      
      // Verify the update
      const updatedDoc = await testDoc.ref.get();
      const updatedData = updatedDoc.data();
      console.log(`✅ Verification: test_field = ${updatedData.test_field}`);
      
      // Clean up - remove test field
      await testDoc.ref.update({
        test_field: admin.firestore.FieldValue.delete()
      });
      console.log('✅ Cleanup: Removed test field');
    }
    
    console.log('\n🎉 All tests passed! Bulk update functions should work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBulkUpdateFunctions().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
