# Integration Guide - Item-Level Order Management

## Overview
This guide explains how to integrate the new item-level order management functionality into your application.

## ✅ Completed Implementation

### 1. **OrderDetailsPage.tsx** - User Order Cancellation
- ✅ Updated `handleCancelConfirm()` to cancel ALL order items
- ✅ Updates both `order_items` and `orders` tables
- ✅ Sets all items to 'cancelled' status with reason
- ✅ Updates order status to 'cancelled'
- ✅ Shows success message

### 2. **orderStore.ts** - Aggregate Status Calculation
- ✅ Added `calculateAggregateOrderStatus()` utility function
- ✅ Calculates order status based on item statuses
- ✅ Supports partial statuses (partially_delivered, partially_cancelled, etc.)
- ✅ Exported for use in admin dashboard

### 3. **order.ts** - Type Definitions
- ✅ Updated `OrderItem` interface with item-level fields
- ✅ Updated `Order` interface with partial statuses
- ✅ Added payment_status support for partial refunds

### 4. **AdminOrderDashboard.tsx** - Item-Level Actions
- ✅ Updated Order interface with item-level fields
- ✅ Added state management for refunds and selections
- ✅ Implemented `handleShipItem()`
- ✅ Implemented `handleDeliverItem()`
- ✅ Implemented `handleCancelItem()`
- ✅ Implemented `handleRefundItem()`
- ✅ Implemented `handleBulkShipItems()`
- ✅ Implemented `handleBulkRefundItems()`
- ✅ Implemented `updateAggregateOrderStatus()`
- ✅ Implemented `updatePaymentStatus()`

### 5. **New Components Created**
- ✅ `EnhancedOrderDetailsModal.tsx` - Item-level UI with actions
- ✅ `RefundModal.tsx` - Refund confirmation with amount/reason/reference

## 🔧 Integration Steps

### Step 1: Update AdminOrderDashboard.tsx

Replace the existing `OrderDetailsModal` usage with `EnhancedOrderDetailsModal`:

```typescript
// At the top of AdminOrderDashboard.tsx, add import:
import { EnhancedOrderDetailsModal } from './EnhancedOrderDetailsModal';
import { RefundModal } from './RefundModal';

// Add state for refund modal
const [showRefundModal, setShowRefundModal] = useState(false);
const [itemsToRefund, setItemsToRefund] = useState<any[]>([]);

// Update the modal rendering section (around line 930):
{showOrderModal && selectedOrder && (
  <EnhancedOrderDetailsModal
    order={selectedOrder}
    onClose={() => {
      setShowOrderModal(false);
      setSelectedItems([]);
    }}
    onShipItem={handleShipItem}
    onDeliverItem={handleDeliverItem}
    onCancelItem={handleCancelItem}
    onRefundItem={(itemId, orderId) => {
      const item = selectedOrder.order_items.find(i => i.order_item_id === itemId);
      if (item) {
        setItemsToRefund([item]);
        setShowRefundModal(true);
      }
    }}
    onBulkShipItems={handleBulkShipItems}
    onBulkRefundItems={(itemIds, orderId) => {
      const items = selectedOrder.order_items.filter(i => itemIds.includes(i.order_item_id));
      setItemsToRefund(items);
      setShowRefundModal(true);
    }}
    processingAction={processingAction}
  />
)}

{/* Add Refund Modal */}
<RefundModal
  isOpen={showRefundModal}
  onClose={() => {
    setShowRefundModal(false);
    setItemsToRefund([]);
  }}
  items={itemsToRefund}
  orderId={selectedOrder?.order_id || ''}
  onConfirmRefund={(amount, reason, refReference) => {
    const itemIds = itemsToRefund.map(i => i.order_item_id);
    if (itemIds.length === 1) {
      handleRefundItem(itemIds[0], selectedOrder!.order_id, amount, reason, refReference);
    } else {
      handleBulkRefundItems(itemIds, selectedOrder!.order_id, amount, reason);
    }
  }}
  processing={!!processingAction}
/>
```

### Step 2: Update Filter Options

Add partial status filters to the status filter dropdown (around line 520):

```typescript
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>
  <option value="all">All Orders</option>
  <option value="cod-pending">COD Orders (Pending)</option>
  <option value="paid-orders">Paid Orders (Razorpay)</option>
  <option value="cancelled">Cancelled Orders</option>
  <option value="delivered">Delivered Orders</option>
  <option value="shipped">Shipped Orders</option>
  <option value="pending">All Pending Orders</option>
  <option value="paid">All Paid Orders</option>
  <option value="partially_delivered">Partially Delivered</option>
  <option value="partially_cancelled">Partially Cancelled</option>
  <option value="partially_refunded">Partially Refunded</option>
</select>
```

### Step 3: Update Filter Logic

Add cases for partial statuses in `filteredOrders` (around line 515):

```typescript
const filteredOrders = orders.filter(order => {
  switch (statusFilter) {
    case 'cod-pending':
      return order.payment_method === 'cod' && order.status === 'pending';
    case 'paid-orders':
      return order.payment_method === 'razorpay' && order.status === 'paid';
    case 'cancelled':
      return order.status === 'cancelled';
    case 'delivered':
      return order.status === 'delivered';
    case 'shipped':
      return order.status === 'shipped';
    case 'pending':
      return order.status === 'pending';
    case 'paid':
      return order.status === 'paid';
    case 'partially_delivered':
      return order.status === 'partially_delivered';
    case 'partially_cancelled':
      return order.status === 'partially_cancelled';
    case 'partially_refunded':
      return order.status === 'partially_refunded' || order.payment_status === 'partially_refunded';
    case 'all':
    default:
      break;
  }
  
  // ... rest of filter logic
});
```

### Step 4: Update Status Display

Update `getStatusColor()` to handle partial statuses (around line 77):

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'paid': return 'text-green-600 bg-green-50 border-green-200';
    case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'delivered': return 'text-green-700 bg-green-50 border-green-200';
    case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
    case 'partially_delivered': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'partially_cancelled': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'partially_refunded': return 'text-purple-600 bg-purple-50 border-purple-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
```

## 📊 Database Schema Verification

Ensure your database has these columns:

### order_items table:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name IN ('item_status', 'cancel_reason', 'return_reason', 'refund_amount', 'refunded_at');

-- If missing, add them:
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Add constraint
ALTER TABLE order_items
ADD CONSTRAINT order_items_item_status_check 
CHECK (item_status IN ('pending', 'cancelled', 'shipped', 'delivered', 'returned', 'refunded'));
```

### orders table:
```sql
-- Update status constraint to include partial statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'returned',
  'partially_delivered', 'partially_cancelled', 'partially_refunded'
));

-- Update payment_status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));
```

## 🧪 Testing Checklist

### User Flow (OrderDetailsPage):
- [ ] User can cancel entire order
- [ ] All items update to 'cancelled' status
- [ ] Order status updates to 'cancelled'
- [ ] Success message displays
- [ ] UI reflects changes immediately

### Admin Flow (AdminOrderDashboard):
- [ ] Admin can view order with item-level details
- [ ] Item status badges display correctly
- [ ] Admin can ship single item
- [ ] Admin can deliver single item
- [ ] Admin can cancel single item with reason
- [ ] Admin can refund single item
- [ ] Admin can select multiple items
- [ ] Admin can bulk ship selected items
- [ ] Admin can bulk refund selected items
- [ ] Aggregate order status updates correctly
- [ ] Payment status updates on refunds
- [ ] Filters work for partial statuses

### Edge Cases:
- [ ] Order with all items cancelled shows 'cancelled'
- [ ] Order with some items cancelled shows 'partially_cancelled'
- [ ] Order with some items delivered shows 'partially_delivered'
- [ ] Order with all items refunded shows payment_status 'refunded'
- [ ] Order with some items refunded shows payment_status 'partially_refunded'

## 🚀 Deployment Steps

1. **Backup Database**:
   ```bash
   # Create backup before schema changes
   pg_dump your_database > backup_$(date +%Y%m%d).sql
   ```

2. **Run Database Migrations**:
   - Execute SQL scripts to add/update columns
   - Update constraints

3. **Deploy Code**:
   - Deploy updated TypeScript files
   - Deploy new component files

4. **Verify**:
   - Test user order cancellation
   - Test admin item-level actions
   - Test bulk operations
   - Verify status calculations

## 📝 API Endpoints Used

All operations use direct Supabase REST API:
- `PATCH /rest/v1/order_items` - Update item status
- `PATCH /rest/v1/orders` - Update order status
- `GET /rest/v1/order_items` - Fetch items for calculations

No Edge Functions required for basic operations.

## 🔐 Security Considerations

1. **Admin Authorization**: Ensure only admins can access item-level actions
2. **Validation**: Validate refund amounts don't exceed order total
3. **Audit Trail**: Consider logging all admin actions
4. **Refund Verification**: Verify refund was processed in payment gateway before updating database

## 📞 Support

For issues or questions:
1. Check database schema is correct
2. Verify imports are correct
3. Check browser console for errors
4. Review Supabase logs for API errors

## 🎉 Success Criteria

✅ Users can cancel entire orders (all items)
✅ Admin can manage orders at item-level
✅ Aggregate statuses calculate correctly
✅ Payment statuses update on refunds
✅ UI shows correct status badges
✅ Bulk operations work smoothly
✅ No breaking changes to existing functionality
