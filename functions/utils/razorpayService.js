const { getConfig } = require('../config/firebaseConfig');

// Create Razorpay order
async function createRazorpayOrder(orderData) {
  const config = getConfig();
  const { amount, currency, receipt, notes } = orderData;
  
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  const auth = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      payment_capture: 1,
      notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Razorpay API error:', error);
    throw new Error(error.error?.description || 'Failed to create Razorpay order');
  }

  return await response.json();
}

// Process Razorpay refund
async function processRazorpayRefund(paymentId, amountInPaise, notes = {}, receipt = null) {
  const config = getConfig();
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    return { success: false, error: 'Razorpay credentials not configured' };
  }

  try {
    const auth = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
    const body = { amount: amountInPaise };
    
    if (Object.keys(notes).length > 0) body.notes = notes;
    if (receipt) body.receipt = receipt;

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay refund failed:', data);
      return {
        success: false,
        error: data.error?.description || 'Razorpay refund failed',
        details: data.error,
      };
    }

    const refundId = data.id;
    const arn = data?.acquirer_data?.arn || data?.acquirer_data?.rrn || data?.acquirer_data?.utr || null;

    return {
      success: true,
      refundId,
      arn,
      status: data.status,
      details: data,
    };
  } catch (err) {
    console.error('Razorpay API error:', err);
    return { success: false, error: String(err) };
  }
}

// Verify Razorpay webhook signature
function verifyWebhookSignature(body, signature) {
  const config = getConfig();
  if (!config.razorpay.webhookSecret) {
    throw new Error('Razorpay webhook secret not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = {
  createRazorpayOrder,
  processRazorpayRefund,
  verifyWebhookSignature
};
