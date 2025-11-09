# Quick Reference - Item-Level Order Management

## Admin Dashboard Actions

### Ship Items
1. Click **"Ship"** button on order
2. Select items to ship (checkboxes)
3. Enter **Shipping Partner** (required)
4. Enter **Tracking ID** (required)
5. Enter **Tracking URL** (optional)
6. Click **"Ship X Item(s)"**

**Result**: Selected items → `item_status = 'shipped'`, tracking details saved

---

### Deliver Items
1. Click **"Deliver"** button on shipped order
2. Select shipped items to mark as delivered
3. Click **"Mark X Item(s) as Delivered"**

**Result**: Selected items → `item_status = 'delivered'`, `delivered_at` timestamp set

---

## User Actions

### Cancel Items
1. Click **"Cancel Order"** button
2. Select items to cancel (checkboxes)
3. Select **cancellation reason** (required)
4. Add optional comments
5. Click **"Cancel X Item(s)"**

**Result**: Selected items → `item_status = 'cancelled'`, order status updates

---

## Order Status Logic

### Aggregate Status Calculation
- **All items cancelled** → Order status = `'cancelled'`
- **All items delivered** → Order status = `'delivered'`
- **All items shipped** (none delivered/cancelled) → Order status = `'shipped'`
- **Some items cancelled** → Order status = `'partially_cancelled'`
- **Some items delivered** → Order status = `'partially_delivered'`
- **Mixed statuses** → Order status = `'partially_delivered'` or `'partially_cancelled'`

---

## Item Status Values

| Status | Description | Available Actions (Admin) | Available Actions (User) |
|--------|-------------|---------------------------|--------------------------|
| `pending` | Item awaiting processing | Ship, Cancel | Cancel |
| `shipped` | Item has been shipped | Deliver | Request Return |
| `delivered` | Item has been delivered | Refund | Request Return |
| `cancelled` | Item has been cancelled | None | None |
| `returned` | Return requested | Approve/Reject | None |
| `refunded` | Item has been refunded | None | None |

---

## Database Fields Updated

### When Shipping Items
```sql
-- order_items table
item_status = 'shipped'

-- orders table
shipping_partner = 'delhivery'
tracking_id = 'TRACK123'
tracking_url = 'https://...'
shipped_at = NOW()
status = (calculated aggregate)
```

### When Delivering Items
```sql
-- order_items table
item_status = 'delivered'

-- orders table
delivered_at = NOW()
status = (calculated aggregate)
```

### When Cancelling Items
```sql
-- order_items table
item_status = 'cancelled'
cancel_reason = 'changed_mind'

-- orders table
status = (calculated aggregate)
cancelled_at = NOW() -- only if all items cancelled
```

---

## Validation Rules

### Ship Items
- ✅ At least 1 item must be selected
- ✅ Shipping partner required
- ✅ Tracking ID required
- ❌ Cannot ship already shipped/delivered/cancelled items

### Deliver Items
- ✅ At least 1 shipped item must be selected
- ❌ Cannot deliver non-shipped items

### Cancel Items
- ✅ At least 1 item must be selected
- ✅ Cancellation reason required
- ❌ Cannot cancel already cancelled/delivered items

---

## UI Components

### Item Selection List
- **Checkbox**: Select/deselect item
- **Product Image**: 10x10 thumbnail
- **Product Name**: Item name
- **Details**: Size, Quantity, Status
- **Price**: Item total (price × quantity)
- **Disabled State**: Greyed out for non-actionable items

### Status Badges
- **Pending**: Yellow background
- **Shipped**: Blue background
- **Delivered**: Green background
- **Cancelled**: Red background
- **Returned**: Gray background
- **Refunded**: Teal background

---

## Common Scenarios

### Scenario 1: Partial Shipment
**Situation**: Order has 3 items, admin ships 2

**Steps**:
1. Admin selects 2 items in ship modal
2. Enters tracking details
3. Confirms shipment

**Result**:
- 2 items: `item_status = 'shipped'`
- 1 item: `item_status = 'pending'`
- Order: `status = 'shipped'` or `'partially_delivered'`

---

### Scenario 2: User Cancels Some Items
**Situation**: User wants to cancel 1 out of 2 items

**Steps**:
1. User selects 1 item in cancel modal
2. Selects reason
3. Confirms cancellation

**Result**:
- 1 item: `item_status = 'cancelled'`
- 1 item: `item_status = 'pending'`
- Order: `status = 'partially_cancelled'`

---

### Scenario 3: Deliver All Shipped Items
**Situation**: All items shipped, admin marks as delivered

**Steps**:
1. Admin clicks "Select All Shipped"
2. Confirms delivery

**Result**:
- All items: `item_status = 'delivered'`
- Order: `status = 'delivered'`, `delivered_at = NOW()`

---

## Troubleshooting

### Issue: "Please select at least one item"
**Solution**: Check at least one checkbox before confirming

### Issue: Items are greyed out
**Solution**: Those items are in a final state (cancelled/delivered) and cannot be modified

### Issue: Order status not updating
**Solution**: Check that `calculateAggregateOrderStatus()` is being called and database has proper constraints

### Issue: Tracking details not saving
**Solution**: Ensure shipping_partner and tracking_id are provided

---

## API Calls Made

### Ship Items
```typescript
// Update items
await supabase
  .from('order_items')
  .update({ item_status: 'shipped' })
  .in('order_item_id', selectedItemIds);

// Update order
await supabase
  .from('orders')
  .update({ shipping_partner, tracking_id, tracking_url, shipped_at })
  .eq('order_id', orderId);

// Recalculate status
await updateAggregateOrderStatus(orderId);
```

### Deliver Items
```typescript
// Update items
await supabase
  .from('order_items')
  .update({ item_status: 'delivered' })
  .in('order_item_id', selectedItemIds);

// Update order
await supabase
  .from('orders')
  .update({ delivered_at })
  .eq('order_id', orderId);

// Recalculate status
await updateAggregateOrderStatus(orderId);
```

### Cancel Items
```typescript
// Update items
await supabase
  .from('order_items')
  .update({ item_status: 'cancelled', cancel_reason })
  .in('order_item_id', selectedItemIds);

// Fetch all items
const { data: allItems } = await supabase
  .from('order_items')
  .select('item_status')
  .eq('order_id', orderId);

// Calculate and update order
const newStatus = calculateStatus(allItems);
await supabase
  .from('orders')
  .update({ status: newStatus, ... })
  .eq('order_id', orderId);
```

---

## Success Messages

- **Ship**: "X item(s) shipped successfully"
- **Deliver**: "X item(s) marked as delivered successfully"
- **Cancel**: Success banner appears for 5 seconds

---

## Best Practices

1. **Always select items carefully** - Double-check selection before confirming
2. **Provide tracking details** - Helps customers track their shipments
3. **Use appropriate reasons** - Helps improve service quality
4. **Check item status** - Ensure items are in correct state before action
5. **Verify aggregate status** - Confirm order status updates correctly

---

## Keyboard Shortcuts

- **Esc**: Close modal
- **Enter**: Confirm action (when form is valid)
- **Space**: Toggle checkbox (when focused)

---

## Mobile Considerations

- Modals are scrollable on small screens
- Touch-friendly checkbox sizes
- Responsive layout for item lists
- Clear visual feedback on selection

---

## Support

For issues:
1. Check browser console for errors
2. Verify database schema matches requirements
3. Ensure Supabase connection is active
4. Review FIXES_SUMMARY.md for detailed information
