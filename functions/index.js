/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Import custom modules
const { functions, db, getConfig, configSecret } = require('./config/firebaseConfig');
const { sendEmail: sendEmailUtil } = require('./utils/emailService');
const { 
  generateOtp, 
  isEmail, 
  isPhone, 
  countSendsLastMinutes, 
  createOtpRecord, 
  verifyOtp 
} = require('./utils/otpService');
const { 
  validateStockAvailability, 
  updateProductInventory, 
  restoreStockForCancelledItem 
} = require('./utils/inventoryService');
const { 
  createRazorpayOrder, 
  processRazorpayRefund, 
  verifyWebhookSignature 
} = require('./utils/razorpayService');
const { 
  buildCodOrderEmail, 
  buildPaidOrderEmail, 
  buildOtpEmail 
} = require('./utils/emailTemplates');
const cors = require('cors')({ 
  origin: [
    // Local development
    'http://localhost:5174', 
    'http://localhost:5173', 
    'http://localhost:3000',
    'http://127.0.0.1:5174', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    // Production
    'https://fici-shoes.web.app',
    'https://www.ficishoes.com',
    'https://ficishoes.com'
  ],
  credentials: true
});

// Helper function to get current IST time
function nowIST() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffsetMs);
  return ist.toISOString().replace("T", " ").replace("Z", "");
}

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ======================================================
// GET BULK UPDATE COUNT
// ======================================================
exports.getBulkUpdateCount = onRequest({ 
  secrets: [configSecret],
  region: 'asia-south1'
}, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { filters } = req.body;

      // Validate required fields
      if (!filters || typeof filters !== 'object') {
        return res.status(400).json({ 
          error: 'Missing required field: filters' 
        });
      }

      // Build query based on filters
      let query = db.collection('pincodes');
      
      // Apply filters if provided
      if (filters.is_serviceable !== undefined) {
        query = query.where('is_serviceable', '==', filters.is_serviceable);
      }
      
      if (filters.state) {
        query = query.where('state', '==', filters.state);
      }
      
      if (filters.active !== undefined) {
        query = query.where('active', '==', filters.active);
      }
      
      if (filters.pincode) {
        query = query.where('pincode', '==', filters.pincode);
      }
      
      if (filters.pincodes && Array.isArray(filters.pincodes)) {
        // Firestore 'in' queries support up to 10 items
        if (filters.pincodes.length > 10) {
          return res.status(400).json({ 
            error: 'Maximum 10 pincodes allowed per request' 
          });
        }
        query = query.where('pincode', 'in', filters.pincodes);
      }

      // Get count using count() aggregation for efficiency
      const countSnapshot = await query.count();
      const count = countSnapshot.count || 0; // Ensure count is never undefined
      
      return res.json({
        success: true,
        totalMatched: count,
        message: `Found ${count} documents matching criteria`
      });

    } catch (error) {
      logger.error('Error in getBulkUpdateCount:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
});

// ======================================================
// BULK UPDATE PINCODES
// ======================================================
exports.bulkUpdatePincodes = onRequest({ 
  secrets: [configSecret],
  region: 'asia-south1'
}, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { filters, updateData } = req.body;

      // Validate required fields
      if (!filters || typeof filters !== 'object') {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required field: filters' 
        });
      }

      if (!updateData || typeof updateData !== 'object') {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required field: updateData' 
        });
      }

      // Build base query based on filters
      let query = db.collection('pincodes');
      
      // Apply filters if provided
      if (filters.is_serviceable !== undefined) {
        query = query.where('is_serviceable', '==', filters.is_serviceable);
      }
      
      if (filters.state) {
        query = query.where('state', '==', filters.state);
      }
      
      if (filters.active !== undefined) {
        query = query.where('active', '==', filters.active);
      }
      
      if (filters.pincode) {
        query = query.where('pincode', '==', filters.pincode);
      }
      
      if (filters.pincodes && Array.isArray(filters.pincodes)) {
        // For large arrays, we need to handle multiple queries
        if (filters.pincodes.length > 10) {
          return res.status(400).json({ 
            success: false,
            error: 'Maximum 10 pincodes allowed per request. Use multiple requests for larger arrays.' 
          });
        }
        query = query.where('pincode', 'in', filters.pincodes);
      }

      // Get total count first
      const countSnapshot = await query.count();
      const totalMatched = countSnapshot.count;
      
      if (totalMatched === 0) {
        return res.json({ 
          success: true,
          totalMatched: 0,
          totalUpdated: 0,
          message: 'No documents found matching the criteria' 
        });
      }

      // Prepare update data with server timestamp
      const finalUpdateData = {
        ...updateData,
        updated_at: require('firebase-admin').firestore.FieldValue.serverTimestamp()
      };

      // Process in batches using pagination to avoid memory issues
      const batchSize = 500;
      let totalUpdated = 0;
      let lastDoc = null;
      let hasMore = true;
      let failedBatches = 0;

      while (hasMore) {
        let batchQuery = query;
        
        // Apply pagination
        if (lastDoc) {
          batchQuery = batchQuery.startAfter(lastDoc);
        }
        
        // Limit to batch size
        batchQuery = batchQuery.limit(batchSize);
        
        // Get documents for this batch
        const snapshot = await batchQuery.get();
        
        if (snapshot.empty) {
          hasMore = false;
          break;
        }
        
        // Create batch
        const batch = db.batch();
        
        // Add documents to batch
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, finalUpdateData);
        });
        
        try {
          await batch.commit();
          totalUpdated += snapshot.docs.length;
          
          // Set last document for pagination
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
          
          // Log progress for large updates
          if (totalMatched > 1000) {
            logger.info(`Bulk update progress: ${totalUpdated}/${totalMatched} documents updated`);
          }
          
          // Check if we have more documents
          if (snapshot.docs.length < batchSize) {
            hasMore = false;
          }
          
        } catch (batchError) {
          failedBatches++;
          logger.error(`Batch update failed:`, batchError);
          
          // If too many failures, stop processing
          if (failedBatches > 5) {
            return res.status(500).json({
              success: false,
              error: 'Too many batch failures. Operation stopped.',
              totalMatched,
              totalUpdated,
              failedBatches
            });
          }
          
          // Continue with next batch despite failure
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
          if (snapshot.docs.length < batchSize) {
            hasMore = false;
          }
        }
      }

      const message = failedBatches > 0 
        ? `Updated ${totalUpdated} pincodes with ${failedBatches} failed batches`
        : `Successfully updated ${totalUpdated} pincodes`;

      return res.json({
        success: true,
        totalMatched,
        totalUpdated,
        failedBatches,
        message
      });

    } catch (error) {
      logger.error('Error in bulkUpdatePincodes:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
});

// ======================================================
// CREATE GUEST SESSION
// ======================================================
exports.createGuestSession = onRequest({ secrets: [configSecret], region: 'asia-south1' }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { email, phone, name } = req.body;

      // Validate required fields
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Generate session ID and expiry
      const sessionId = generateUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Create guest session
      const guestSessionRef = await db.collection('guest_sessions').add({
        session_id: sessionId,
        email: email,
        phone_number: phone || null,
        name: name || null,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      });

      const guestSession = await guestSessionRef.get();

      // Return success response
      const sessionResponse = {
        guest_session_id: guestSession.data().session_id,
        email: guestSession.data().email,
        phone: guestSession.data().phone_number,
        name: guestSession.data().name,
        created_at: guestSession.data().created_at,
        expires_at: guestSession.data().expires_at,
        is_active: guestSession.data().is_active
      };

      return res.status(200).json(sessionResponse);

    } catch (err) {
      console.error('❌ createGuestSession error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        details: err.message
      });
    }
  });
});

// ======================================================
// CREATE ORDER
// ======================================================
exports.createOrder = onRequest({ secrets: [configSecret], region: 'asia-south1' }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const {
        total_amount,
        subtotal,
        discount = 0,
        delivery_charge = 0,
        effective_amount,
        currency = 'INR',
        user_id,
        guest_session_id,
        guest_contact_info,
        order_id: incomingOrderId,
        payment_method,
        items = [],
        shipping_address,
      } = req.body;

      const isGuest = !user_id;
      const guestOtp = isGuest ? generateOtp() : null;
      const guestOtpHash = guestOtp ? require('crypto').createHash('sha256').update(guestOtp).digest('hex') : null;

      const order_id = incomingOrderId || generateUUID();
      const istNow = nowIST();
      
      // Calculate effective amount if not provided
      const calculatedEffectiveAmount = effective_amount ?? 
        (Number(subtotal || 0) + Number(delivery_charge || 0) - Number(discount || 0));

      // Validate stock availability before creating order
      await validateStockAvailability(items);

      // Create order in database
      const orderData = {
        order_id,
        subtotal: Number(subtotal || 0),
        total_amount: Number(total_amount || 0),
        discount: Number(discount || 0),
        delivery_charge: Number(delivery_charge || 0),
        effective_amount: calculatedEffectiveAmount,
        payment_method,
        payment_status: 'pending',
        status: 'pending',
        shipping_address,
        created_at: istNow,
        updated_at: istNow,
        items: items.map(item => ({
          product_id: item.product_id,
          article_id: item.article_id || null, // Handle missing article_id
          name: item.product_name || item.name, // Use product_name from payload
          price: Number(item.price_at_purchase || item.price || 0),
          quantity: Number(item.quantity || 0),
          size: item.size,
          color: item.color,
          image: item.thumbnail_url || item.image, // Use thumbnail_url from payload
          sub_category: item.sub_category || null, // Handle missing sub_category
          category: item.category || null, // Handle missing category
          mrp: item.mrp
        }))
      };

      // Only add guest fields for guest users
      if (isGuest && guest_contact_info) {
        orderData.guest_email = guest_contact_info.email;
        orderData.guest_phone = guest_contact_info.phone;
        orderData.guest_otp_hash = guestOtpHash;
      }

      // Only add user_id for registered users
      if (user_id) {
        orderData.user_id = user_id;
      }

      // Only add guest_session_id for guest users
      if (guest_session_id) {
        orderData.guest_session_id = guest_session_id;
      }

      const orderRef = await db.collection('orders').add(orderData);

      const order = await orderRef.get();

      // Create order items
      const orderItems = items.map(item => ({
        order_id,
        product_id: item.product_id,
        size: item.size,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase || item.price,
        mrp: item.mrp,
        thumbnail_url: item.thumbnail_url || item.product_thumbnail_url,
        product_name: item.product_name || item.name,
        price_currency: currency,
        color: item.color,
        item_status: 'pending',
        created_at: istNow,
        updated_at: istNow,
      }));

      // Save order items
      for (const item of orderItems) {
        await db.collection('order_items').add(item);
      }

      // Handle COD flow
      if (payment_method === 'cod') {
        // Create payment record
        await db.collection('payments').add({
          order_id,
          provider: 'cod',
          provider_reference: order_id,
          payment_status: 'pending',
          payment_method: 'cod',
          amount: calculatedEffectiveAmount,
          currency,
          user_id: isGuest ? null : user_id,
          guest_session_id: isGuest ? guest_session_id : null,
          payment_type: isGuest ? 'guest' : 'registered',
          updated_at: istNow,
        });

        // Send confirmation email
        let email = guest_contact_info?.email;
        
        if (!email && user_id) {
          const userDoc = await db.collection('user_profiles')
            .where('user_id', '==', user_id)
            .limit(1)
            .get();
          
          if (!userDoc.empty) {
            email = userDoc.docs[0].data().email;
          }
        }

        if (email) {
          try {
            const mail = buildCodOrderEmail(
              { ...order.data(), order_id },
              orderItems,
              isGuest && payment_method === 'cod' ? guestOtp : undefined
            );
            
            await sendEmail({
              to: email,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
            });
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }
        }

        // Update stock only for COD orders
        await updateProductInventory(orderItems);

        return res.status(200).json({ 
          success: true, 
          order_id,
          effective_amount: calculatedEffectiveAmount
        });
      }

      // Handle Razorpay flow
      if (payment_method === 'razorpay') {
        const razorpayOrder = await createRazorpayOrder({
          amount: calculatedEffectiveAmount,
          currency,
          receipt: order_id,
          notes: {
            order_id,
            user_id,
            guest_session_id,
            email: guest_contact_info?.email,
            phone: guest_contact_info?.phone,
            items_count: items.length,
          },
        });

        // Update order with Razorpay order ID
        await orderRef.update({ 
          razorpay_order_id: razorpayOrder.id,
          updated_at: istNow
        });

        // Create payment record
        await db.collection('payments').add({
          order_id,
          provider: 'razorpay',
          provider_reference: razorpayOrder.id,
          payment_status: 'pending',
          payment_method: 'razorpay',
          amount: calculatedEffectiveAmount,
          currency,
          user_id: isGuest ? null : user_id,
          guest_session_id: isGuest ? guest_session_id : null,
          payment_type: isGuest ? 'guest' : 'registered',
          updated_at: istNow,
        });

        return res.status(200).json({
          success: true,
          order_id,
          razorpay_order_id: razorpayOrder.id,
          key: getConfig().razorpay.keyId,
          amount: razorpayOrder.amount,
          currency,
          effective_amount: calculatedEffectiveAmount
        });
      }

      return res.status(400).json({ 
        error: 'Unsupported payment method' 
      });

    } catch (err) {
      console.error('❌ createOrder error:', err);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
      });
    }
  });
});

// ======================================================
// RAZORPAY WEBHOOK
// ======================================================
exports.razorpayWebhook = onRequest({ secrets: [configSecret], region: 'asia-south1' }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const payment = event.payload?.payment?.entity;

    if (event.event !== 'payment.captured' || !payment) {
      return res.status(200).json({ message: 'Event ignored' });
    }

    // Find order by Razorpay order ID
    const orderSnapshot = await db.collection('orders')
      .where('razorpay_order_id', '==', payment.order_id)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      return res.status(200).json({ message: 'Order not found' });
    }

    const orderDoc = orderSnapshot.docs[0];
    const order = { id: orderDoc.id, ...orderDoc.data() };

    if (order.payment_status === 'paid' && order.payment_email_sent) {
      return res.status(200).json({ message: 'Already processed' });
    }

    const istNow = nowIST();

    // Update payment record
    const paymentSnapshot = await db.collection('payments')
      .where('provider_reference', '==', payment.order_id)
      .limit(1)
      .get();

    if (!paymentSnapshot.empty) {
      await paymentSnapshot.docs[0].ref.update({
        payment_status: 'paid',
        payment_method: 'razorpay',
        provider: 'razorpay',
        provider_reference: payment.id,
        provider_response: event,
        paid_at: istNow,
        updated_at: istNow,
      });
    }

    // Update order status
    await orderDoc.ref.update({
      status: 'paid',
      order_status: 'paid',
      payment_status: 'paid',
      payment_method: 'razorpay',
      razorpay_payment_id: payment.id,
      payment_email_sent: true,
      updated_at: istNow,
    });

    // Fetch order items
    const itemsSnapshot = await db.collection('order_items')
      .where('order_id', '==', order.order_id)
      .get();

    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get user email
    let email = order.guest_email;
    
    if (!email && order.user_id) {
      const userSnapshot = await db.collection('user_profiles')
        .where('user_id', '==', order.user_id)
        .limit(1)
        .get();
      
      if (!userSnapshot.empty) {
        email = userSnapshot.docs[0].data().email;
      }
    }

    const guestOtp = order.order_type === 'guest' && order.comments?.startsWith('GUEST_OTP:')
      ? order.comments.replace('GUEST_OTP:', '')
      : undefined;

    if (email) {
      const mail = buildPaidOrderEmail(order, items, guestOtp);
      
      // Update inventory and send email in parallel
      await Promise.all([
        updateProductInventory(items),
        sendEmail({
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        })
      ]);
      
      // Send BCC to support separately
      try {
        await sendEmail({
          to: 'support@ficishoes.com',
          subject: `[BCC] ${mail.subject}`,
          html: mail.html,
          text: mail.text,
        });
      } catch (bccError) {
        console.warn('Failed to send BCC email:', bccError);
      }
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('❌ Razorpay webhook error:', err);
    return res.status(500).json({ error: 'Webhook failed' });
  }
});

// ======================================================
// SEND EMAIL (HTTP Request with CORS)
// ======================================================
exports.sendEmail = onRequest({ secrets: [configSecret], region: 'asia-south1' }, async (req, res) => {
  return cors(req, res, async () => {
    console.log('📧 sendEmail function called:', {
      method: req.method,
      headers: req.headers,
      body: req.body,
      contentType: req.get('Content-Type')
    });
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { to, subject, html, text, cc, bcc, requireAuth = false } = req.body;
      
      console.log('📧 Email request data:', {
        to,
        subject: subject ? subject.substring(0, 50) + '...' : 'undefined',
        htmlLength: html ? html.length : 0,
        textLength: text ? text.length : 0,
        requireAuth
      });

      // Only check authentication if requireAuth is true
      if (requireAuth) {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }

      if (!to || !subject || !html || !text) {
        return res.status(400).json({ error: 'Missing email fields' });
      }

      // Additional validation for public requests to prevent abuse
      if (!requireAuth) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
          return res.status(400).json({ error: 'Invalid recipient email' });
        }

        // Basic content validation for public requests
        if (html.length > 100000 || text.length > 50000) {
          return res.status(400).json({ error: 'Content too large' });
        }

        // Rate limiting could be implemented here based on IP
        // For now, we'll allow basic contact form submissions
      }

      console.log('📤 Sending email...');
      await sendEmailUtil({ to, subject, html, text, cc, bcc });
      console.log('✅ Email sent successfully');

      return res.status(200).json({ success: true });

    } catch (err) {
      console.error('❌ sendEmail error details:', {
        message: err.message,
        stack: err.stack,
        body: req.body,
        headers: req.headers
      });
      return res.status(500).json({
        error: 'Email send failed',
        details: err.message
      });
    }
  });
});

// ======================================================
// SEND/VERIFY OTP
// ======================================================
exports.sendVerifyOtp = onRequest({ secrets: [configSecret], region: 'asia-south1' }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { identifier, otp } = req.body;
      const action = req.path.split('/').pop(); // Get 'send' or 'verify' from URL
      const identifierRaw = (identifier || '').trim();
      const providedOtp = (otp || '').trim();
      const channel = 'email';

      // Identifier validation
      if (!identifierRaw) {
        return res.status(400).json({
          error: 'email_required',
          message: 'Please enter your email address to receive OTP.',
        });
      }

      // Phone number entered (explicitly unsupported)
      if (isPhone(identifierRaw)) {
        return res.status(400).json({
          error: 'mobile_otp_not_supported',
          message: 'OTP via mobile number is not supported yet. Please use email OTP.',
        });
      }

      // Invalid email format
      if (!isEmail(identifierRaw)) {
        return res.status(400).json({
          error: 'invalid_email_format',
          message: 'Please enter a valid email address.',
        });
      }

      // SEND OTP
      if (action === 'send') {
        const count = await countSendsLastMinutes(identifierRaw, channel, 60);
        if (count >= getConfig().otp.maxSendsPerHour) {
          return res.status(429).json({ error: 'rate_limited' });
        }

        const { otpId, otp: generatedOtp, expiresAt } = await createOtpRecord(
          identifierRaw, 
          channel, 
          generateOtp(getConfig().otp.length)
        );

        const mail = buildOtpEmail(generatedOtp);

        try {
          await sendEmail({
            to: identifierRaw,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
          });
        } catch (err) {
          console.error('SMTP error:', err);
          return res.status(502).json({ error: 'email_send_failed' });
        }

        return res.status(200).json({ 
          status: 'sent', 
          otp_id: otpId,
          expires_at: expiresAt.toISOString()
        });
      }

      // VERIFY OTP
      if (action === 'verify') {
        if (!providedOtp) {
          return res.status(400).json({ error: 'otp_required' });
        }

        const result = await verifyOtp(identifierRaw, channel, providedOtp);
        
        if (result.success) {
          return res.status(200).json({ status: 'verified' });
        } else {
          return res.status(400).json({ error: result.error });
        }
      }

      return res.status(404).json({ error: 'not_found' });

    } catch (err) {
      console.error('❌ sendVerifyOtp error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        details: err.message
      });
    }
  });
});

// ======================================================
// UPDATE ITEM STATUS (Simplified version for migration)
// ======================================================
exports.updateItemStatus = onRequest({ secrets: [configSecret], region: 'asia-south1' }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { 
        action, 
        order_id, 
        order_item_id, 
        reason, 
        guest_session_id,
        shipping_partner,
        tracking_id,
        tracking_url,
        user_id 
      } = req.body;

      // For now, implement basic status updates
      // Full implementation would include all the complex logic from the original
      
      const istNow = nowIST();

      switch (action) {
        case 'cancel_order':
          // Cancel entire order
          const orderSnapshot = await db.collection('orders')
            .where('order_id', '==', order_id)
            .limit(1)
            .get();

          if (orderSnapshot.empty) {
            return res.status(404).json({ error: 'Order not found' });
          }

          const orderDoc = orderSnapshot.docs[0];
          const order = orderDoc.data();

          // Get pending items
          const itemsSnapshot = await db.collection('order_items')
            .where('order_id', '==', order_id)
            .where('item_status', '==', 'pending')
            .get();

          // Update items to cancelled
          for (const itemDoc of itemsSnapshot.docs) {
            const item = itemDoc.data();
            await itemDoc.ref.update({
              item_status: 'cancelled',
              cancel_reason: reason || null,
              updated_at: istNow,
            });
            
            await restoreStockForCancelledItem({ ...item, order_item_id: itemDoc.id }, reason);
          }

          // Update order
          await orderDoc.ref.update({
            status: 'cancelled',
            cancelled_at: istNow,
            updated_at: istNow,
          });

          return res.status(200).json({ 
            success: true, 
            order_id,
            cancelled_items: itemsSnapshot.size
          });

        case 'ship_item':
          // Ship individual item
          if (!order_item_id || !shipping_partner || !tracking_id) {
            return res.status(400).json({ 
              error: 'order_item_id, shipping_partner, and tracking_id are required' 
            });
          }

          const itemSnapshot = await db.collection('order_items')
            .where('order_item_id', '==', order_item_id)
            .limit(1)
            .get();

          if (itemSnapshot.empty) {
            return res.status(404).json({ error: 'Order item not found' });
          }

          const itemDoc = itemSnapshot.docs[0];
          
          await itemDoc.ref.update({
            item_status: 'shipped',
            shipping_partner: String(shipping_partner),
            tracking_id: String(tracking_id),
            tracking_url: tracking_url || `https://www.delhivery.com/track/package/${tracking_id}`,
            shipped_at: istNow,
            updated_at: istNow,
          });

          return res.status(200).json({ 
            success: true, 
            order_item_id,
            item_status: 'shipped'
          });

        default:
          return res.status(400).json({ error: 'Unsupported action' });
      }

    } catch (err) {
      console.error('❌ updateItemStatus error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        details: err.message
      });
    }
  });
});
