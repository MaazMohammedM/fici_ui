# Razorpay Setup Instructions

## Prerequisites
1. Create a Razorpay account at https://razorpay.com/
2. Get your API keys from the Razorpay dashboard

## Installation Steps

### 1. Install Razorpay SDK (Optional - we're using CDN)
```bash
npm install razorpay
# or
yarn add razorpay
```

### 2. Environment Variables
Create a `.env` file in your project root and add:
```env
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### 3. Backend API Endpoints (Required)
You need to create these API endpoints on your backend:

#### Create Payment Order
```
POST /api/create-payment-order
Body: { amount: number, currency: string }
Response: { id: string, amount: number, currency: string }
```

#### Verify Payment
```
POST /api/verify-payment
Body: { razorpay_payment_id: string, razorpay_order_id: string, razorpay_signature: string }
Response: { verified: boolean }
```

### 4. Supabase Database Schema

#### user_addresses table
```sql
CREATE TABLE user_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### orders table (already exists - extends the existing mock)
```sql
-- Ensure your orders table has all required fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_signature TEXT;
```

### 5. Security Considerations
1. Never expose your Razorpay Key Secret in frontend code
2. Always verify payments on your backend
3. Use HTTPS in production
4. Implement proper error handling
5. Log all payment transactions for auditing

### 6. Testing
Use Razorpay test credentials for development:
- Test Key ID: Available in your Razorpay dashboard
- Use test card numbers provided by Razorpay for testing

### 7. Production Setup
1. Switch to live Razorpay keys
2. Update environment variables
3. Ensure webhook signatures are verified
4. Implement proper logging and monitoring

## Features Implemented
✅ Secure checkout flow with address management
✅ Multiple payment methods (Razorpay + COD)
✅ Order creation and management
✅ Payment verification flow
✅ Responsive design for mobile and desktop
✅ Integration with existing cart and order systems
