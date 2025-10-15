# Item-Level Order Management API Reference

## Order Store Methods

### `cancelOrderItem(orderItemId, reason, userId?, guestSessionId?)`

Cancels a specific item in an order.

**Parameters:**
- `orderItemId` (string, required): The UUID of the order item to cancel
- `reason` (string, required): Reason for cancellation
- `userId` (string, optional): User ID for authenticated users
- `guestSessionId` (string, optional): Guest session ID for guest orders

**Returns:** `Promise<void>`

**Throws:** Error if cancellation fails

**Example Usage:**
```typescript
import { useOrderStore } from '@/store/orderStore';

const { cancelOrderItem } = useOrderStore();

// For authenticated users
await cancelOrderItem(
  'item-uuid-here',
  'changed_mind',
  user.id
);

// For guest users
await cancelOrderItem(
  'item-uuid-here',
  'wrong_item',
  undefined,
  guestSession.guest_session_id
);
```

**Database Changes:**
- Updates `order_items.item_status` to 'cancelled'
- Sets `order_items.cancel_reason` to provided reason

---

### `requestReturnItem(orderItemId, reason, userId?, guestSessionId?, imageFile?)`

Requests a return for a specific item in an order.

**Parameters:**
- `orderItemId` (string, required): The UUID of the order item to return
- `reason` (string, required): Reason for return request
- `userId` (string, optional): User ID for authenticated users
- `guestSessionId` (string, optional): Guest session ID for guest orders
- `imageFile` (File, optional): Image file showing product issue

**Returns:** `Promise<void>`

**Throws:** Error if return request fails

**Example Usage:**
```typescript
import { useOrderStore } from '@/store/orderStore';

const { requestReturnItem } = useOrderStore();

// With image upload
const imageFile = document.querySelector('input[type="file"]').files[0];

await requestReturnItem(
  'item-uuid-here',
  'Product damaged on arrival',
  user.id,
  undefined,
  imageFile
);

// Without image
await requestReturnItem(
  'item-uuid-here',
  'Wrong size received',
  user.id
);
```

**Database Changes:**
- Updates `order_items.item_status` to 'returned'
- Sets `order_items.return_reason` to provided reason
- Sets `order_items.return_requested_at` to current timestamp
- Uploads image to Supabase storage bucket 'return-images' (if provided)

**Image Upload Details:**
- Bucket: `return-images`
- File naming: `{orderItemId}_{timestamp}.{extension}`
- Supported formats: jpg, jpeg, png, webp, gif
- Max size: 5MB

---

### `updateOrderItemStatus(orderItemId, newStatus)`

Updates the local state for an order item's status (internal use).

**Parameters:**
- `orderItemId` (string, required): The UUID of the order item
- `newStatus` (string, required): New status value

**Returns:** `void`

**Example Usage:**
```typescript
import { useOrderStore } from '@/store/orderStore';

const { updateOrderItemStatus } = useOrderStore();

// Update local state after successful API call
updateOrderItemStatus('item-uuid-here', 'cancelled');
```

**Note:** This method only updates the local Zustand store state. It does not make API calls.

---

## Component Integration Examples

### In a React Component

```typescript
import { useState } from 'react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';

function OrderItemActions({ item }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { cancelOrderItem } = useOrderStore();
  const { user } = useAuthStore();

  const handleCancel = async () => {
    if (!cancelReason) {
      alert('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      await cancelOrderItem(item.order_item_id, cancelReason, user?.id);
      setShowCancelModal(false);
      // Show success message
    } catch (error) {
      alert('Failed to cancel item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {item.item_status === 'pending' && (
        <button onClick={() => setShowCancelModal(true)}>
          Cancel Item
        </button>
      )}
      
      {showCancelModal && (
        <div className="modal">
          <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
            <option value="">Select reason</option>
            <option value="changed_mind">Changed my mind</option>
            <option value="wrong_item">Wrong item</option>
          </select>
          <button onClick={handleCancel} disabled={loading}>
            {loading ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      )}
    </>
  );
}
```

---

## Item Status Values

| Status | Description | User Actions Available |
|--------|-------------|------------------------|
| `pending` | Item is awaiting processing | Cancel Item |
| `shipped` | Item has been shipped | Request Return |
| `delivered` | Item has been delivered | Request Return |
| `cancelled` | Item has been cancelled | None |
| `returned` | Return request submitted | None |
| `refunded` | Item has been refunded | None |

---

## Order Status Values (Aggregate)

| Status | Description |
|--------|-------------|
| `pending` | Order awaiting payment |
| `paid` | Payment confirmed |
| `shipped` | All items shipped |
| `delivered` | All items delivered |
| `cancelled` | All items cancelled |
| `partially_delivered` | Some items delivered, others not |
| `partially_cancelled` | Some items cancelled, others active |
| `partially_refunded` | Some items refunded |

---

## Error Handling

All methods throw errors that should be caught and handled:

```typescript
try {
  await cancelOrderItem(itemId, reason, userId);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Show user-friendly error message
  }
}
```

Common error scenarios:
- Network failure
- Invalid order item ID
- Insufficient permissions
- Item already in final state (cancelled/refunded)
- Database constraint violations

---

## Best Practices

1. **Always validate input** before calling API methods
2. **Show loading states** during async operations
3. **Handle errors gracefully** with user-friendly messages
4. **Refresh order data** after successful operations
5. **Use optimistic updates** for better UX (via `updateOrderItemStatus`)
6. **Validate file size and type** before upload
7. **Compress images** before upload to reduce storage costs

---

## Testing

### Unit Test Example

```typescript
import { renderHook, act } from '@testing-library/react';
import { useOrderStore } from '@/store/orderStore';

describe('cancelOrderItem', () => {
  it('should cancel an item successfully', async () => {
    const { result } = renderHook(() => useOrderStore());
    
    await act(async () => {
      await result.current.cancelOrderItem(
        'test-item-id',
        'changed_mind',
        'test-user-id'
      );
    });
    
    // Assert item status updated in store
    expect(result.current.currentOrder?.items[0].item_status).toBe('cancelled');
  });
});
```

---

## Troubleshooting

### Issue: "Failed to cancel item"
**Solution:** Check that:
- Order item ID is valid
- Item is in 'pending' status
- User has permission to cancel
- Database connection is active

### Issue: "Image upload failed"
**Solution:** Verify:
- Storage bucket 'return-images' exists
- File size is under 5MB
- File type is supported (jpg, png, etc.)
- Storage policies are configured correctly

### Issue: "State not updating"
**Solution:** 
- Ensure `updateOrderItemStatus` is called after API success
- Check that order item ID matches exactly
- Verify items array is properly structured

---

## Support

For issues or questions:
1. Check the implementation documentation
2. Review Supabase logs for API errors
3. Verify database schema matches requirements
4. Check browser console for client-side errors
