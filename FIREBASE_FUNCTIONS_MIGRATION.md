# Firebase Cloud Functions Migration Guide

This document outlines the migration of Supabase Edge Functions to Firebase Cloud Functions for the Fici Shoes application.

## Overview

Successfully migrated 6 Supabase Edge Functions to Firebase Cloud Functions:

1. **create-guest-session** → `createGuestSession`
2. **create-order** → `createOrder`
3. **razorpay-webhook** → `razorpayWebhook`
4. **send-email** → `sendEmail`
5. **send-verify-otp** → `sendVerifyOtp`
6. **update-item-status** → `updateItemStatus` (simplified version)

## Architecture

### Firebase Functions Structure
```
functions/
├── config/
│   └── firebaseConfig.js      # Firebase initialization and configuration
├── utils/
│   ├── emailService.js        # SMTP email sending via Nodemailer
│   ├── otpService.js          # OTP generation and verification
│   ├── inventoryService.js    # Stock management and validation
│   ├── razorpayService.js     # Razorpay API integration
│   └── emailTemplates.js      # Email template builders
├── index.js                   # Main Cloud Functions
├── package.json               # Dependencies and scripts
└── .env.example              # Environment variables template
```

## Key Changes from Supabase to Firebase

### 1. Database Operations
- **Supabase**: `supabase.from('table').select().eq()`
- **Firebase**: `db.collection('table').where('field', '==', 'value').get()`

### 2. Authentication
- **Supabase**: Direct auth client usage
- **Firebase**: Firebase Admin SDK with service account

### 3. Environment Variables
- **Supabase**: `Deno.env.get()`
- **Firebase**: `functions.config()` or process.env

### 4. HTTP Handling
- **Supabase**: Deno serve with manual CORS
- **Firebase**: Firebase onRequest with cors middleware

### 5. Email Sending
- **Supabase**: Raw SMTP via Deno.connectTls
- **Firebase**: Nodemailer library for better reliability

## Configuration Setup

### 1. Set Firebase Config Variables
```bash
# Razorpay Configuration
firebase functions:config:set razorpay.key_id="your_key_id"
firebase functions:config:set razorpay.key_secret="your_key_secret"
firebase functions:config:set razorpay.webhook_secret="your_webhook_secret"

# SMTP Configuration
firebase functions:config:set smtp.host="smtp.hostinger.com"
firebase functions:config:set smtp.port="465"
firebase functions:config:set smtp.user="orders@ficishoes.com"
firebase functions:config:set smtp.pass="your_password"
firebase functions:config:set smtp.from_name="FiCi Shoes"
firebase functions:config:set smtp.from_email="orders@ficishoes.com"

# OTP Configuration
firebase functions:config:set otp.secret="your_otp_secret"
firebase functions:config:set otp.ttl_minutes="10"
firebase functions:config:set otp.length="6"
firebase functions:config:set otp.max_sends_per_hour="3"
firebase functions:config:set otp.max_verification_attempts="3"

# App Configuration
firebase functions:config:set app.url="https://www.ficishoes.com"
```

### 2. Install Dependencies
```bash
cd functions
npm install
```

### 3. Deploy Functions
```bash
firebase deploy --only functions
```

## Function Endpoints

After deployment, functions will be available at:

- `https://asia-south1-fici-shoes.cloudfunctions.net/createGuestSession`
- `https://asia-south1-fici-shoes.cloudfunctions.net/createOrder`
- `https://asia-south1-fici-shoes.cloudfunctions.net/razorpayWebhook`
- `https://asia-south1-fici-shoes.cloudfunctions.net/sendEmail`
- `https://asia-south1-fici-shoes.cloudfunctions.net/sendVerifyOtp`
- `https://asia-south1-fici-shoes.cloudfunctions.net/updateItemStatus`

## API Changes

### 1. OTP Function URL Structure
- **Supabase**: `/functions/v1/send-verify-otp/send` and `/functions/v1/send-verify-otp/verify`
- **Firebase**: `/sendVerifyOtp` (action determined by request body and URL path)

### 2. Request/Response Format
- All functions maintain the same request/response format as Supabase
- CORS is handled automatically
- Error responses follow the same structure

## Testing

### Local Testing
```bash
# Start Firebase emulators
firebase emulators:start --only functions

# Test functions locally
curl -X POST http://localhost:5001/fici-shoes/asia-south1/createGuestSession \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Production Testing
```bash
# Test deployed function
curl -X POST https://asia-south1-fici-shoes.cloudfunctions.net/createGuestSession \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Database Schema Compatibility

The Firebase functions are designed to work with the existing Firestore database schema. No database changes are required.

## Monitoring and Logging

- Firebase Console → Functions → Logs
- Functions automatically log to Cloud Logging
- Error tracking and performance monitoring available

## Security Considerations

1. **API Keys**: All sensitive keys are stored in Firebase config
2. **Webhook Security**: Razorpay webhook signature verification maintained
3. **Rate Limiting**: OTP rate limiting preserved
4. **CORS**: Properly configured for web access

## Rollback Plan

If needed, you can rollback to Supabase by:
1. Updating frontend API endpoints to point back to Supabase
2. Disabling Firebase functions in Firebase Console
3. Keeping Supabase functions active during transition

## Next Steps

1. **Test all functions** in the Firebase environment
2. **Update frontend** to use Firebase function URLs
3. **Monitor performance** and logs
4. **Set up alerts** for function failures
5. **Consider implementing** the full `updateItemStatus` functionality with all email templates

## Support

For issues during migration:
1. Check Firebase Functions logs
2. Verify configuration variables
3. Test with Firebase emulators locally
4. Review this documentation and compare with original Supabase functions
