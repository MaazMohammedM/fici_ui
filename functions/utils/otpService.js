const crypto = require('crypto');
const { getConfig, db } = require('../config/firebaseConfig');

// Generate OTP
function generateOtp(length) {
  const config = getConfig();
  length = length || config.otp.length;
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// HMAC for OTP storage
function hmacHex(message) {
  const config = getConfig();
  if (!config.otp.secret) {
    throw new Error('OTP_SECRET is not configured');
  }
  return crypto.createHmac('sha256', config.otp.secret).update(message).digest('hex');
}

// Validate email format
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Validate phone format (Indian mobile numbers)
function isPhone(value) {
  return /^[6-9]\d{9}$/.test(value);
}

// Rate limit count
async function countSendsLastMinutes(identifier, channel, minutes = 60) {
  const since = new Date(Date.now() - minutes * 60000);
  const snapshot = await db.collection('otps')
    .where('identifier', '==', identifier)
    .where('channel', '==', channel)
    .where('created_at', '>=', since)
    .get();
  
  return snapshot.size;
}

// Find latest unexpired OTP
async function findLatestActiveOtp(identifier, channel) {
  const now = new Date();
  const snapshot = await db.collection('otps')
    .where('identifier', '==', identifier)
    .where('channel', '==', channel)
    .where('consumed', '==', false)
    .where('expires_at', '>', now)
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();
  
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// Create OTP record
async function createOtpRecord(identifier, channel, otp) {
  const config = getConfig();
  const otpHmac = hmacHex(`${identifier}|${otp}`);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.otp.ttlMinutes * 60000);

  const docRef = await db.collection('otps').add({
    identifier,
    channel,
    otp_hmac: otpHmac,
    created_at: now,
    expires_at: expiresAt,
    consumed: false,
    attempts: 0,
  });

  return { otpId: docRef.id, otp, expiresAt };
}

// Verify OTP
async function verifyOtp(identifier, channel, providedOtp) {
  const config = getConfig();
  const row = await findLatestActiveOtp(identifier, channel);
  
  if (!row) {
    return { success: false, error: 'no_active_otp' };
  }

  if (row.attempts >= config.otp.maxVerificationAttempts) {
    return { success: false, error: 'too_many_attempts' };
  }

  const candidateHmac = hmacHex(`${identifier}|${providedOtp}`);

  if (candidateHmac === row.otp_hmac) {
    // Mark as consumed
    await db.collection('otps').doc(row.id).update({ consumed: true });
    return { success: true, status: 'verified' };
  }

  // Increment attempts
  await db.collection('otps').doc(row.id).update({
    attempts: row.attempts + 1
  });

  return { success: false, error: 'invalid_otp' };
}

module.exports = {
  generateOtp,
  hmacHex,
  isEmail,
  isPhone,
  countSendsLastMinutes,
  findLatestActiveOtp,
  createOtpRecord,
  verifyOtp
};
