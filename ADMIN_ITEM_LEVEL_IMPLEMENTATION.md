# Admin Item-Level Order Management Implementation

## Summary
Successfully implemented item-level order management functionality for admin dashboard with ship/deliver/refund/cancel actions for individual items and bulk operations.

## Changes Made

### 1. Order Interface Updates (`AdminOrderDashboard.tsx`)
**Enhanced Order interface** to include:
- Partial order statuses: `'partially_delivered' | 'partially_cancelled' | 'partially_refunded'`
- Partial payment statuses: `'partially_refunded'`
- Item-level fields in `order_items`:
  - `item_status`: 'pending' | 'cancelled' | 'shipped' | 'delivered' | 'returned' | 'refunded'
  - `cancel_reason`, `return_reason`, `refund_amount`, `refunded_at`
- `razorpay_payment_id` for refund processing

### 2. State Management
**Added new state variables**:
- `showRefundModal`: Control refund modal visibility
- `refundForm`: Store refund details (amount, reason, reference, items)
- `selectedItems`: Track selected items for bulk actions

### 3. Item-Level Action Handlers

#### `handleShipItem(orderItemId, orderId)`
- Updates `order_items.item_status` to 'shipped'
- Recalculates aggregate order status
- Refreshes order list

#### `handleDeliverItem(orderItemId, orderId)`
- Updates `order_items.item_status` to 'delivered'
- Recalculates aggregate order status

#### `handleCancelItem(orderItemId, orderId, reason)`
- Updates `order_items.item_status` to 'cancelled'
- Stores `cancel_reason`
- Recalculates aggregate order status

#### `handleRefundItem(orderItemId, orderId, amount, reason, refReference)`
- Updates `order_items.item_status` to 'refunded'
- Stores `refund_amount`, `refunded_at`, `return_reason`
- Updates payment status (refunded/partially_refunded)
- Recalculates aggregate order status

### 4. Bulk Action Handlers

#### `handleBulkShipItems(itemIds, orderId)`
- Ships multiple items at once
- Updates all selected items to 'shipped' status
- Recalculates aggregate order status

#### `handleBulkRefundItems(itemIds, orderId, totalAmount, reason)`
- Refunds multiple items at once
- Updates all selected items to 'refunded' status
- Updates payment status
- Recalculates aggregate order status

### 5. Helper Functions

#### `updateAggregateOrderStatus(orderId)`
- Fetches all order items
- Uses `calculateAggregateOrderStatus()` utility
- Updates order status based on item statuses:
  - All cancelled → 'cancelled'
  - All delivered → 'delivered'
  - All shipped → 'shipped'
  - Mixed statuses → 'partially_delivered' | 'partially_cancelled' | 'partially_refunded'

#### `updatePaymentStatus(orderId)`
- Checks refund statuses of all items
- Updates order payment_status:
  - All refunded → 'refunded'
  - Some refunded → 'partially_refunded'
  - None refunded → 'paid'

### 6. OrderDetailsPage Cancel Order Enhancement
**Updated `handleCancelConfirm()`**:
- Step 1: Updates ALL `order_items` to 'cancelled' status
- Step 2: Updates order status to 'cancelled'
- Updates local state to reflect changes
- Shows success message

## UI Components to Add

### Enhanced OrderDetailsModal
The modal needs to be updated to show:

1. **Item List with Actions**:
   - Checkbox for bulk selection
   - Item status badge (color-coded)
   - Action buttons per item:
     - "Ship" (for pending items)
     - "Deliver" (for shipped items)
     - "Refund" (for delivered/returned items)
     - "Cancel" (for pending items with user request)

2. **Bulk Action Buttons**:
   - "Ship Selected Items"
   - "Refund Selected Items"
   - "Select All" / "Deselect All"

3. **Item Status Display**:
   - Pending: Yellow badge
   - Shipped: Blue badge
   - Delivered: Green badge
   - Cancelled: Red badge
   - Refunded: Teal badge

### Refund Modal
New modal component needed with:
- List of items to refund
- Total refund amount calculation
- Reason textarea
- Refund reference ID input
- Confirmation buttons

## Database Operations

### Direct Supabase Calls
All operations use direct Supabase REST API calls:

```typescript
// Update single item
await supabase
  .from('order_items')
  .update({ item_status: 'shipped' })
  .eq('order_item_id', orderItemId);

// Update multiple items (bulk)
await supabase
  .from('order_items')
  .update({ item_status: 'shipped' })
  .in('order_item_id', itemIds);

// Update order aggregate status
await supabase
  .from('orders')
  .update({ status: aggregateStatus })
  .eq('order_id', orderId);
```

## Workflow Examples

### Admin Ships Single Item:
1. Admin clicks "Ship" button on item
2. `handleShipItem()` called
3. Updates `order_items.item_status` to 'shipped'
4. Calls `updateAggregateOrderStatus()`
5. Fetches all items, calculates aggregate
6. Updates `orders.status` (e.g., to 'partially_delivered' if some items still pending)
7. Refreshes order list
8. Shows success message

### Admin Refunds Multiple Items:
1. Admin selects multiple items via checkboxes
2. Clicks "Refund Selected Items"
3. Refund modal opens
4. Admin enters refund details
5. `handleBulkRefundItems()` called
6. Updates all selected items to 'refunded'
7. Calls `updatePaymentStatus()` → sets to 'partially_refunded'
8. Calls `updateAggregateOrderStatus()` → sets to 'partially_cancelled'
9. Refreshes order list

### User Cancels Entire Order:
1. User clicks "Cancel Order" in OrderDetailsPage
2. `handleCancelConfirm()` called
3. Updates ALL `order_items` to 'cancelled' with reason
4. Updates `orders.status` to 'cancelled'
5. Updates local state
6. Shows success message
7. Order now shows as fully cancelled in admin dashboard

## Filter Updates Needed

Add to status filter options:
- `'partially_shipped'`: Orders with some items shipped
- `'partially_delivered'`: Orders with some items delivered
- `'partially_cancelled'`: Orders with some items cancelled

## Testing Checklist

- [ ] Test ship single item
- [ ] Test deliver single item
- [ ] Test cancel single item with reason
- [ ] Test refund single item
- [ ] Test bulk ship multiple items
- [ ] Test bulk refund multiple items
- [ ] Test user cancels entire order (all items cancelled)
- [ ] Verify aggregate status updates correctly
- [ ] Verify payment status updates on refunds
- [ ] Test partial scenarios (some shipped, some cancelled)
- [ ] Verify UI shows correct status badges
- [ ] Test filter by partial statuses

## Next Steps

1. **Update OrderDetailsModal Component**:
   - Add item checkboxes for selection
   - Add per-item action buttons
   - Add bulk action buttons
   - Show item status badges

2. **Create Refund Modal Component**:
   - Item list with amounts
   - Total calculation
   - Reason and reference inputs
   - Confirmation flow

3. **Add Filter Options**:
   - Partially shipped
   - Partially delivered
   - Partially cancelled

4. **Add Razorpay Refund Integration**:
   - Call Razorpay refund API
   - Store refund reference
   - Handle refund webhooks

5. **Add Notifications**:
   - Email customer on item ship/deliver/refund
   - SMS notifications for status changes

## API Endpoints Used

All operations use direct Supabase REST API:
- `POST /rest/v1/order_items` - Update item status
- `POST /rest/v1/orders` - Update order status
- `GET /rest/v1/order_items` - Fetch items for status calculation

No Edge Functions required for basic operations.

## Notes

- All existing functionality preserved
- Backward compatible with orders without item-level statuses
- Admin can manage orders at both order-level and item-level
- Automatic aggregate status calculation ensures data consistency
- Payment status automatically updates based on refunds
