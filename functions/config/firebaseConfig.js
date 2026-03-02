// Firebase configuration for Cloud Functions
const { functions } = require('firebase-functions');
const admin = require('firebase-admin');
const { defineJsonSecret } = require('firebase-functions/params');

// Initialize Firebase Admin
admin.initializeApp();

// Export database references
const db = admin.firestore();
const auth = admin.auth();

// Define secret using the exported config
const configSecret = defineJsonSecret('FUNCTIONS_CONFIG_EXPORT');

// Runtime configuration loader
function getConfig() {
  const secretValue = configSecret.value();
  
  return {
    // Razorpay configuration
    razorpay: {
      keyId: secretValue?.razorpay?.key_id || process.env.RAZORPAY_KEY_ID,
      keySecret: secretValue?.razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: secretValue?.razorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    
    // SMTP configuration
    smtp: {
      host: secretValue?.smtp?.host || process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(secretValue?.smtp?.port || process.env.SMTP_PORT || '465'),
      user: secretValue?.smtp?.user || process.env.SMTP_USER || 'orders@ficishoes.com',
      pass: secretValue?.smtp?.pass || process.env.SMTP_PASSWORD,
      fromName: secretValue?.smtp?.from_name || process.env.FROM_NAME || 'FiCi Shoes',
      fromEmail: secretValue?.smtp?.from_email || process.env.FROM_EMAIL || 'orders@ficishoes.com',
    },
    
    // OTP configuration
    otp: {
      secret: secretValue?.otp?.secret || process.env.OTP_SECRET,
      ttlMinutes: parseInt(secretValue?.otp?.ttl_minutes || process.env.OTP_TTL_MINUTES || '10'),
      length: parseInt(secretValue?.otp?.length || process.env.OTP_LENGTH || '6'),
      maxSendsPerHour: parseInt(secretValue?.otp?.max_sends_per_hour || process.env.MAX_SENDS_PER_HOUR || '3'),
      maxVerificationAttempts: parseInt(secretValue?.otp?.max_verification_attempts || process.env.MAX_VERIFICATION_ATTEMPTS || '3'),
    },
    
    // Application URLs
    app: {
      url: secretValue?.app?.url || process.env.APP_URL || 'https://www.ficishoes.com',
      logoUrl: 'https://www.ficishoes.com/fici_128x128.png',
    }
  };
}

module.exports = {
  functions,
  admin,
  db,
  auth,
  getConfig,
  configSecret
};
