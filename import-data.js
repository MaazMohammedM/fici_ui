import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
// Replace with your service account key path
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

// Sample data generator based on Supabase schema
async function importSampleData() {
  console.log('🔥 Starting data import to Firebase...');

  try {
    // 1. Import User Profiles
    console.log('📥 Importing user_profiles...');
    const userProfiles = [
      {
        user_id: uuidv4(),
        first_name: 'Admin',
        email: 'admin@fici.com',
        role: 'admin',
        created_at: new Date(),
        last_name: 'User',
        addresses: [
          {
            type: 'home',
            street: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          }
        ],
        phone_number: '+919876543210',
        is_guest: false,
        phone_verified: true,
        email_verified: true,
        last_login_at: new Date(),
        login_method: 'email'
      },
      {
        user_id: uuidv4(),
        first_name: 'John',
        email: 'john@example.com',
        role: 'user',
        created_at: new Date(),
        last_name: 'Doe',
        addresses: [],
        phone_number: '+919876543211',
        is_guest: false,
        phone_verified: false,
        email_verified: true,
        last_login_at: new Date(),
        login_method: 'google'
      }
    ];

    for (const profile of userProfiles) {
      await db.collection('user_profiles').doc(profile.user_id).set(profile);
    }
    console.log(`✅ Imported ${userProfiles.length} user profiles`);

    // 2. Import Products
    console.log('📥 Importing products...');
    const products = [
      {
        product_id: uuidv4(),
        name: 'Classic Leather Shoes',
        description: 'Premium leather shoes for formal occasions',
        category: 'Footwear',
        sub_category: 'Formal Shoes',
        mrp_price: '2999',
        gender: 'men',
        sizes: {
          '7': { available: true, price: '2499' },
          '8': { available: true, price: '2499' },
          '9': { available: false, price: '2499' },
          '10': { available: true, price: '2499' }
        },
        images: [
          'https://example.com/shoe1-1.jpg',
          'https://example.com/shoe1-2.jpg'
        ],
        created_at: new Date(),
        article_id: 'SH001',
        discount_price: '2499',
        thumbnail_url: 'https://example.com/shoe1-thumb.jpg',
        is_active: true,
        tags: ['discount_sale']
      },
      {
        product_id: uuidv4(),
        name: 'Sports Running Shoes',
        description: 'Comfortable running shoes for athletes',
        category: 'Footwear',
        sub_category: 'Sports Shoes',
        mrp_price: '3999',
        gender: 'unisex',
        sizes: {
          '6': { available: true, price: '3299' },
          '7': { available: true, price: '3299' },
          '8': { available: true, price: '3299' },
          '9': { available: true, price: '3299' }
        },
        images: [
          'https://example.com/shoe2-1.jpg',
          'https://example.com/shoe2-2.jpg'
        ],
        created_at: new Date(),
        article_id: 'SH002',
        discount_price: '3299',
        thumbnail_url: 'https://example.com/shoe2-thumb.jpg',
        is_active: true,
        tags: []
      },
      {
        product_id: uuidv4(),
        name: 'Leather Handbag',
        description: 'Elegant leather handbag for women',
        category: 'Bags and Accessories',
        sub_category: 'Handbags',
        mrp_price: '4999',
        gender: 'women',
        sizes: {
          'OS': { available: true, price: '3999' }
        },
        images: [
          'https://example.com/bag1-1.jpg',
          'https://example.com/bag1-2.jpg'
        ],
        created_at: new Date(),
        article_id: 'BG001',
        discount_price: '3999',
        thumbnail_url: 'https://example.com/bag1-thumb.jpg',
        is_active: true,
        tags: ['deal_of_the_day']
      }
    ];

    for (const product of products) {
      await db.collection('products').doc(product.product_id).set(product);
    }
    console.log(`✅ Imported ${products.length} products`);

    // 3. Import Pincodes
    console.log('📥 Importing pincodes...');
    const pincodes = [
      {
        pincode: '400001',
        city: 'Mumbai',
        state: 'Maharashtra',
        active: true,
        is_serviceable: true,
        cod_allowed: true,
        min_order_amount: 299,
        shipping_fee: 0,
        cod_fee: 0,
        free_shipping_threshold: 999,
        created_at: new Date(),
        updated_at: new Date(),
        delivery_time: '2-3 days',
        districts: ['Mumbai City'],
        is_returnable: true,
        is_exchangeable: true,
        return_window_days: 7,
        exchange_window_days: 7
      },
      {
        pincode: '400002',
        city: 'Mumbai',
        state: 'Maharashtra',
        active: true,
        is_serviceable: true,
        cod_allowed: true,
        min_order_amount: 299,
        shipping_fee: 50,
        cod_fee: 0,
        free_shipping_threshold: 999,
        created_at: new Date(),
        updated_at: new Date(),
        delivery_time: '3-4 days',
        districts: ['Mumbai City'],
        is_returnable: true,
        is_exchangeable: true,
        return_window_days: 7,
        exchange_window_days: 7
      },
      {
        pincode: '110001',
        city: 'New Delhi',
        state: 'Delhi',
        active: true,
        is_serviceable: true,
        cod_allowed: true,
        min_order_amount: 299,
        shipping_fee: 0,
        cod_fee: 0,
        free_shipping_threshold: 999,
        created_at: new Date(),
        updated_at: new Date(),
        delivery_time: '2-3 days',
        districts: ['New Delhi'],
        is_returnable: true,
        is_exchangeable: true,
        return_window_days: 7,
        exchange_window_days: 7
      }
    ];

    for (const pincode of pincodes) {
      await db.collection('pincodes').doc(pincode.pincode).set(pincode);
    }
    console.log(`✅ Imported ${pincodes.length} pincodes`);

    // 4. Create sample orders
    console.log('📥 Importing orders...');
    const orders = [
      {
        order_id: uuidv4(),
        user_id: userProfiles[1].user_id,
        order_date: new Date(),
        status: 'delivered',
        total_amount: 2499,
        items: [
          {
            product_id: products[0].product_id,
            size: '8',
            quantity: 1,
            price: 2499
          }
        ],
        subtotal: 2499,
        discount: 500,
        delivery_charge: 0,
        payment_status: 'paid',
        payment_method: 'razorpay',
        shipping_address: userProfiles[1].addresses && userProfiles[1].addresses.length > 0 ? userProfiles[1].addresses[0] : null,
        created_at: new Date(),
        updated_at: new Date(),
        order_type: 'registered',
        shipping_partner: 'DTDC',
        tracking_id: 'DT123456789',
        tracking_url: 'https://www.dtdc.in/tracking/',
        shipped_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        delivered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        razorpay_order_id: 'order_' + uuidv4(),
        order_status: 'completed',
        payment_email_sent: true,
        razorpay_payment_id: 'pay_' + uuidv4(),
        effective_amount: 2499
      }
    ];

    for (const order of orders) {
      await db.collection('orders').doc(order.order_id).set(order);
    }
    console.log(`✅ Imported ${orders.length} orders`);

    // 5. Create order items
    console.log('📥 Importing order_items...');
    const orderItems = [
      {
        order_item_id: uuidv4(),
        order_id: orders[0].order_id,
        product_id: products[0].product_id,
        size: '8',
        quantity: 1,
        price_at_purchase: 2499,
        thumbnail_url: products[0].thumbnail_url,
        product_name: products[0].name,
        product_thumbnail_url: products[0].thumbnail_url,
        price_currency: 'INR',
        mrp: 2999,
        item_status: 'delivered',
        shipped_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        delivered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        shipping_partner: 'DTDC',
        tracking_id: 'DT123456789',
        tracking_url: 'https://www.dtdc.in/tracking/',
        status_email_sent: {
          shipped_email_sent: true,
          refunded_email_sent: false,
          cancelled_email_sent: false,
          delivered_email_sent: true,
          replacement_shipped_email_sent: false,
          replacement_approved_email_sent: false,
          replacement_rejected_email_sent: false,
          replacement_delivered_email_sent: false,
          replacement_requested_email_sent: false
        }
      }
    ];

    for (const item of orderItems) {
      await db.collection('order_items').doc(item.order_item_id).set(item);
    }
    console.log(`✅ Imported ${orderItems.length} order items`);

    // 6. Create payments
    console.log('📥 Importing payments...');
    const payments = [
      {
        payment_id: uuidv4(),
        order_id: orders[0].order_id,
        user_id: userProfiles[1].user_id,
        provider: 'razorpay',
        payment_status: 'paid',
        payment_method: 'razorpay',
        amount: 2499,
        currency: 'INR',
        payment_reference: 'razorpay_' + uuidv4(),
        paid_at: new Date(),
        updated_at: new Date(),
        payment_type: 'registered',
        provider_reference: 'pay_' + uuidv4(),
        provider_response: {
          status: 'captured',
          method: 'card'
        },
        capture_method: 'automatic'
      }
    ];

    for (const payment of payments) {
      await db.collection('payments').doc(payment.payment_id).set(payment);
    }
    console.log(`✅ Imported ${payments.length} payments`);

    // 7. Create traffic sources
    console.log('📥 Importing traffic_sources...');
    const trafficSources = [
      {
        id: uuidv4(),
        source: 'google',
        medium: 'organic',
        campaign: null,
        referrer: 'https://www.google.com',
        visit_count: 150,
        last_visited_at: new Date(),
        created_at: new Date()
      },
      {
        id: uuidv4(),
        source: 'facebook',
        medium: 'social',
        campaign: 'summer_sale',
        referrer: 'https://www.facebook.com',
        visit_count: 89,
        last_visited_at: new Date(),
        created_at: new Date()
      },
      {
        id: uuidv4(),
        source: 'direct',
        medium: null,
        campaign: null,
        referrer: null,
        visit_count: 234,
        last_visited_at: new Date(),
        created_at: new Date()
      }
    ];

    for (const source of trafficSources) {
      await db.collection('traffic_sources').doc(source.id).set(source);
    }
    console.log(`✅ Imported ${trafficSources.length} traffic sources`);

    // 8. Create product visit stats
    console.log('📥 Importing product_visit_stats...');
    for (const product of products) {
      const stats = {
        product_id: product.product_id,
        name: product.name,
        thumbnail_url: product.thumbnail_url,
        visit_count: Math.floor(Math.random() * 100) + 10,
        last_visited_at: new Date()
      };
      await db.collection('product_visit_stats').doc(product.product_id).set(stats);
    }
    console.log(`✅ Imported ${products.length} product visit stats`);

    console.log('\n🎉 Data import completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- User Profiles: ${userProfiles.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Pincodes: ${pincodes.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Order Items: ${orderItems.length}`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`- Traffic Sources: ${trafficSources.length}`);
    console.log(`- Product Visit Stats: ${products.length}`);

  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

// Run the import
importSampleData().then(() => {
  console.log('\n✅ Import completed. You can now test your Firebase database!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
