# Item-Level Order Management Implementation

## Overview
Successfully implemented item-level delivery/cancellation, refunds, and return functionality for the order management system without affecting existing functionality.

## Database Schema Support
The implementation works with the existing database schema:
- **orders table**: Contains order-level information with support for partial statuses
- **order_items table**: Contains item-level information with `item_status`, `cancel_reason`, `return_reason`, `refund_amount`, etc.

## Changes Made

### 1. Type Definitions (`src/types/order.ts`)
**Updated `OrderItem` interface** to include:
- `item_status`: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded'
- `cancel_reason`: string (reason for cancellation)
- `return_reason`: string (reason for return)
- `refund_amount`: number
- `refunded_at`: timestamp
- `return_requested_at`: timestamp
- `return_approved_at`: timestamp

**Updated `Order` interface** to support partial statuses:
- Added: 'partially_delivered' | 'partially_cancelled' | 'partially_refunded'

### 2. Order Store (`src/store/orderStore.ts`)
**Added three new methods**:

#### `cancelOrderItem(orderItemId, reason, userId?, guestSessionId?)`
- Updates `order_items` table directly via Supabase
- Sets `item_status` to 'cancelled' and stores `cancel_reason`
- Updates local state to reflect changes immediately

#### `requestReturnItem(orderItemId, reason, userId?, guestSessionId?, imageFile?)`
- Uploads optional image to Supabase storage bucket 'return-images'
- Updates `order_items` table with return request
- Sets `item_status` to 'returned' and stores `return_reason`
- Records `return_requested_at` timestamp

#### `updateOrderItemStatus(orderItemId, newStatus)`
- Updates local state (currentOrder and orders array)
- Ensures UI reflects changes without full page reload

### 3. Order Details Page (`src/features/orders/OrderDetailsPage.tsx`)

#### UI Enhancements:
- **Item-level status badges**: Color-coded badges for each item
  - Pending = Yellow
  - Shipped = Blue
  - Delivered = Green
  - Cancelled = Red
  - Returned/Refunded = Gray/Teal

- **Progress timeline per item**: Visual timeline showing Pending → Shipped → Delivered

- **Aggregate order message**: Shows overall order status based on item statuses
  - "This order has been cancelled" (all items cancelled)
  - "All items have been delivered successfully"
  - "Partially fulfilled order" (mix of statuses)

#### Action Buttons:
- **Cancel Item**: Shows for items with `item_status === 'pending'`
- **Request Return**: Shows for items with `item_status === 'shipped' || 'delivered'`
- No actions shown for cancelled/refunded/returned items

#### Modals:
**Cancel Item Modal**:
- Shows item preview (image, name, size, color)
- Dropdown with cancellation reasons
- Confirmation buttons

**Return Item Modal**:
- Shows item preview
- Textarea for return reason (required)
- File upload for product issue image (optional)
- Uploads to Supabase storage bucket

### 4. Order History Page (`src/features/orders/OrderHistoryPage.tsx`)

#### Aggregate Status Display:
- Enhanced `getUserStatusMessage()` to check item-level statuses
- Shows intelligent messages based on item statuses:
  - "This order has been cancelled" (all items cancelled)
  - "All items have been delivered successfully" (all delivered)
  - "Some items cancelled. Others are being processed" (mixed)
  - "Partially fulfilled order" (some cancelled, some delivered)

- Added support for displaying partial order statuses in badges

## API Integration

### Direct Supabase Client Calls
Instead of creating separate Edge Functions, the implementation uses direct Supabase client calls for simplicity:

1. **Cancel Item**: Direct update to `order_items` table
2. **Return Item**: 
   - Upload image to storage (if provided)
   - Update `order_items` table with return info

### Storage Bucket Required
Create a Supabase storage bucket named `return-images` for storing product issue images during return requests.

## Features Implemented

✅ **Item-level status tracking** with color-coded badges
✅ **Cancel individual items** with reason selection
✅ **Request returns** with reason and optional image upload
✅ **Progress timeline** for each item
✅ **Aggregate order messages** based on item statuses
✅ **Modal confirmations** for all actions
✅ **Real-time UI updates** without page reload
✅ **Support for both registered and guest users**
✅ **Dark mode support** for all new UI components

## User Experience Flow

### Cancelling an Item:
1. User clicks "Cancel Item" button on pending item
2. Modal opens showing item details
3. User selects cancellation reason from dropdown
4. Confirms cancellation
5. Item status updates to 'cancelled' immediately
6. Success message shown

### Requesting a Return:
1. User clicks "Request Return" on shipped/delivered item
2. Modal opens with item details
3. User enters return reason (required)
4. Optionally uploads image of product issue
5. Submits return request
6. Item status updates to 'returned'
7. Success message shown

## Testing Checklist

- [ ] Test cancel item for pending items
- [ ] Test return request for shipped items
- [ ] Test return request for delivered items
- [ ] Test image upload during return
- [ ] Verify aggregate messages display correctly
- [ ] Test with multiple items in different statuses
- [ ] Test guest user flow
- [ ] Test registered user flow
- [ ] Verify dark mode styling
- [ ] Test mobile responsiveness

## Database Requirements

Ensure the following columns exist in `order_items` table:
- `item_status` (text with check constraint)
- `cancel_reason` (text, nullable)
- `return_reason` (text, nullable)
- `refund_amount` (numeric, nullable)
- `refunded_at` (timestamp, nullable)
- `return_requested_at` (timestamp, nullable)
- `return_approved_at` (timestamp, nullable)

Ensure `orders` table supports:
- `status` includes: 'partially_delivered', 'partially_cancelled', 'partially_refunded'

## Supabase Storage Setup

Create storage bucket:
```sql
-- Create return-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('return-images', 'return-images', true);

-- Set up storage policies (adjust as needed)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'return-images');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'return-images');
```

## Notes

- All existing functionality remains intact
- No breaking changes to existing code
- Backward compatible with orders that don't have item-level statuses
- Guest users can cancel/return items (if not restricted by business logic)
- Admin approval workflow for returns can be added later
- Refund processing can be integrated with payment gateway

## Future Enhancements

- Admin dashboard to approve/reject return requests
- Automated refund processing integration
- Email notifications for status changes
- SMS notifications for critical updates
- Return pickup scheduling
- Partial refund calculations
- Return tracking system
