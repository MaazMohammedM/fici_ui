const { getConfig } = require('../config/firebaseConfig');

// Helper function to format IST date for emails
function formatISTDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

// Helper function to format IST datetime for emails
function formatISTDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
}

// COD Order confirmation email template
function buildCodOrderEmail(order, items, guestOtp = null) {
  const config = getConfig();
  const address = order.shipping_address || {};

  const itemsRows = items
    .map(
      (i) => `
<tr>
  <td style="padding:12px;border-bottom:1px solid #e5e7eb">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="70" valign="top">
          <img src="${i.thumbnail_url}" width="70" style="display:block;border-radius:6px" />
        </td>
        <td style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827">
          <strong>${i.product_name}</strong><br/>
          Size: ${i.size} &nbsp;|&nbsp; Qty: ${i.quantity}
        </td>
        <td align="right" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;white-space:nowrap">
          ₹${i.price_at_purchase}
        </td>
      </tr>
    </table>
  </td>
</tr>
`
    )
    .join("");

  const mrp = Number(order.total_amount || 0);
  const subtotal = Number(order.subtotal || 0);
  const delivery = Number(order.delivery_charge || 0);
  const savings = Math.max(mrp - subtotal, 0);
  const total = subtotal + delivery;

  const deliveryRow =
    delivery === 0
      ? `
<tr>
  <td>Delivery</td>
  <td align="right" style="color:#16a34a;font-weight:600">Free Delivery</td>
</tr>`
      : `
<tr>
  <td>Delivery</td>
  <td align="right">₹${delivery}</td>
</tr>`;

  const savingsRow =
    savings > 0
      ? `
<tr>
  <td>Savings</td>
  <td align="right" style="color:#16a34a">- ₹${savings}</td>
</tr>`
      : "";

  return {
    subject: `Order Confirmed – ${order.order_id} | FiCi Shoes`,
    text: `Your order ${order.order_id} has been placed successfully. Amount payable ₹${total}.`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f3f6">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f6">
<tr>
<td align="center" style="padding:16px">

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden">

<tr>
<td style="padding:16px;background:#111827;color:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <img src="${config.app.logoUrl}" width="36" style="vertical-align:middle;display:inline-block" />
  <span style="margin-left:10px;font-size:18px;font-weight:bold">FiCi Shoes</span>
</td>
</tr>

<tr>
<td style="padding:20px;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <h2 style="margin:0 0 8px;font-size:20px">Order Placed Successfully</h2>
  <p style="margin:0;font-size:14px;line-height:1.5">
    Order ID: <strong>${order.order_id}</strong><br/>
    Payment Method: <strong>Cash on Delivery</strong>
  </p>
</td>
</tr>
${guestOtp ? `
<tr>
<td style="padding:16px;background:#fefce8;border:1px solid #fde047">
  <p style="margin:0;font-size:14px;font-family:Arial,Helvetica,sans-serif;color:#111827">
    <strong>Guest Order Access</strong><br/><br/>
    You placed this order as a guest.  
    Use the OTP below to view or track your order.
    <br/><br/>
    <strong>OTP:</strong>
    <span style="font-size:18px;font-weight:bold;letter-spacing:2px">
      ${guestOtp}
    </span>
    <br/><br/>
    Visit:
    <a href="${config.app.url}/orders" target="_blank">
      ${config.app.url}/orders
    </a>
    <br/>
    Enter your email or mobile number along with this OTP.
    <br/><br/>
    <em>This OTP never expires and is unique to this order.</em>
  </p>
</td>
</tr>
` : ""}

<tr>
<td style="padding:0 20px 20px;font-family:Arial,Helvetica,sans-serif">
  <h3 style="margin:0 0 6px;font-size:16px">Delivery Address</h3>
  <p style="margin:0;font-size:14px;line-height:1.5">
    <strong>${address.name || ""}</strong><br/>
    ${address.address || ""}<br/>
    ${address.city || ""}, ${address.state || ""} ${address.pincode || ""}<br/>
    Phone: ${address.phone || ""}
  </p>
</td>
</tr>

<tr>
<td style="padding:0 20px">
  <h3 style="font-size:16px;margin-bottom:8px;font-family:Arial,Helvetica,sans-serif">
    Order Details
  </h3>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${itemsRows}
  </table>
</td>
</tr>

<tr>
<td style="padding:20px">
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;font-family:Arial,Helvetica,sans-serif">
    <tr>
      <td>MRP</td>
      <td align="right">₹${mrp}</td>
    </tr>
    <tr>
      <td>Subtotal</td>
      <td align="right">₹${subtotal}</td>
    </tr>
    ${savingsRow}
    ${deliveryRow}
    <tr><td colspan="2" style="padding:8px 0"><hr style="border:none;border-top:1px solid #e5e7eb"/></td></tr>
    <tr style="font-weight:bold;font-size:15px">
      <td>Total Payable</td>
      <td align="right">₹${total}</td>
    </tr>
  </table>
</td>
</tr>

<tr>
<td style="padding:16px;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555;text-align:center">
  Thank you for shopping with <strong>FiCi Shoes</strong>.
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>
`,
  };
}

// Paid order email template (for Razorpay payments)
function buildPaidOrderEmail(order, items, guestOtp = null) {
  const config = getConfig();
  const address = order.shipping_address || {};

  const itemsRows = items.map(i => `
<tr>
  <td style="padding:12px;border-bottom:1px solid #e5e7eb">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:100%">
      <tr>
        <td width="70" style="width:70px;max-width:70px">
          <img src="${i.thumbnail_url}" width="70" style="display:block;border-radius:6px;max-width:100%;height:auto"/>
        </td>
        <td style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;word-break:break-word">
          <strong>${i.product_name}</strong><br/>
          Size: ${i.size} | Qty: ${i.quantity}
        </td>
        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:nowrap">
          ₹${i.price_at_purchase}
        </td>
      </tr>
    </table>
  </td>
</tr>
`).join("");

  const mrp = Number(order.total_amount || 0);
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const delivery = Number(order.delivery_charge || 0);
  const total = Number(order.effective_amount || 0);
  const savings = Math.max(mrp - subtotal, 0);

  return {
    subject: `Payment Successful – ${order.order_id} | FiCi Shoes`,
    text: `Payment received for order ${order.order_id}. Amount paid ₹${total}.`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Payment Successful - FiCi Shoes</title>
<style>
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; max-width: 100% !important; }
    .email-content { padding: 10px !important; }
    .product-img { width: 50px !important; height: auto !important; }
    .font-size-mobile { font-size: 12px !important; }
    .address-text { font-size: 12px !important; line-height: 1.3 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f1f3f6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:20px 10px">

<table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden">

<tr>
<td style="padding:16px;background:#111827;color:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <img src="${config.app.logoUrl}" width="36" style="vertical-align:middle;max-width:100%;height:auto"/>
  <span style="margin-left:10px;font-size:18px;font-weight:bold">FiCi Shoes</span>
</td>
</tr>

<tr>
<td class="email-content" style="padding:20px;font-family:Arial,Helvetica,sans-serif">
  <h2 style="margin:0 0 6px;color:#16a34a;font-size:20px">
    Payment Successful
  </h2>
  <p style="margin:0;font-size:14px;word-break:break-all">
    Order ID: <strong>${order.order_id}</strong>
  </p>
  <p style="margin:0;font-size:14px">
  Payment Method: <strong>Razorpay (Online Payment)</strong>
</p>
</td>
</tr>

${guestOtp ? `
<tr>
<td style="padding:16px;background:#fefce8;border:1px solid #fde047">
  <p style="margin:0;font-size:14px;font-family:Arial,Helvetica,sans-serif">
    <strong>Guest Order Access</strong><br/><br/>
    Use the OTP below to view or track your order.<br/><br/>
    <strong>OTP:</strong>
    <span style="font-size:18px;font-weight:bold;letter-spacing:2px">
      ${guestOtp}
    </span><br/><br/>
    Visit:
    <a href="${config.app.url}/orders">
      ${config.app.url}/orders
    </a><br/>
    Enter your email or mobile number with this OTP.<br/><br/>
    <em>This OTP never expires and is unique to this order.</em>
  </p>
</td>
</tr>
` : ""}

<tr>
<td class="email-content" style="padding:0 20px 20px;font-family:Arial,Helvetica,sans-serif">
  <h3 style="font-size:16px;margin-bottom:6px">Delivery Address</h3>
  <p class="address-text" style="margin:0;font-size:14px;line-height:1.5;word-break:break-word">
    <strong>${address.name || ""}</strong><br/>
    ${address.address || ""}<br/>
    ${address.city || ""}, ${address.state || ""} ${address.pincode || ""}<br/>
    Phone: ${address.phone || ""}
  </p>
</td>
</tr>

<tr>
<td class="email-content" style="padding:0 20px">
  <h3 style="font-size:16px;margin-bottom:8px">
    Order Details
  </h3>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:100%">
    ${itemsRows}
  </table>
</td>
</tr>

<tr>
<td class="email-content" style="padding:20px">
  <table width="100%" style="font-size:14px;max-width:100%">
<tr>
  <td style="word-wrap:break-word">MRP</td>
  <td align="right" style="white-space:nowrap">₹${mrp}</td>
</tr>

<tr>
  <td style="word-wrap:break-word">Subtotal</td>
  <td align="right" style="white-space:nowrap">₹${subtotal}</td>
</tr>

${savings > 0 ? `
<tr>
  <td style="word-wrap:break-word">Savings</td>
  <td align="right" style="color:#16a34a;white-space:nowrap">- ₹${savings}</td>
</tr>` : ""}

<tr>
  <td style="word-wrap:break-word">Delivery</td>
  <td align="right" style="white-space:nowrap">
    ${delivery === 0 ? "Free Delivery" : `₹${delivery}`}
  </td>
</tr>

<tr><td colspan="2"><hr/></td></tr>

<tr style="font-weight:bold">
  <td style="word-wrap:break-word">Total Paid</td>
  <td align="right" style="white-space:nowrap">₹${total}</td>
</tr>
  </table>
</td>
</tr>

<tr>
<td class="email-content font-size-mobile" style="padding:16px;background:#f9fafb;font-size:12px;color:#555">
  Your order will be packed and shipped soon.<br/>
  Thank you for shopping with <strong>FiCi Shoes</strong>.
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`,
  };
}

// OTP verification email template
function buildOtpEmail(otp) {
  const config = getConfig();
  return {
    subject: `${config.smtp.fromName} — Your verification code`,
    text: `Your FICI Shoes verification code is ${otp}. It expires in ${config.otp.ttlMinutes} minutes.`,
    html: `
      <div style="font-family: Arial; padding: 16px; color: #333;">
        <h2>Your FICI Shoes Verification Code</h2>
        <p>Your OTP is:</p>
        <div style="font-size: 28px; font-weight: bold; margin: 12px 0;">
          ${otp}
        </div>
        <p>This code is valid for <strong>${config.otp.ttlMinutes} minutes</strong>.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">
          If you did not request this code, please ignore this message.
        </p>
      </div>
    `,
  };
}

module.exports = {
  formatISTDate,
  formatISTDateTime,
  buildCodOrderEmail,
  buildPaidOrderEmail,
  buildOtpEmail
};
