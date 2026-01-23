// Cancel reason constants for different user roles

export const CUSTOMER_CANCEL_REASONS = [
  { value: 'ordered_by_mistake', label: 'Ordered by mistake' },
  { value: 'size_issue', label: 'Size issue' },
  { value: 'delivery_delay', label: 'Delivery delay' },
  { value: 'found_better_price', label: 'Found better price elsewhere' },
  { value: 'no_longer_needed', label: 'No longer needed' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'wrong_item_ordered', label: 'Wrong item ordered' },
  { value: 'other', label: 'Other' }
] as const;

export const ADMIN_CANCEL_REASONS = [
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'logistics_issue', label: 'Logistics issue' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'system_error', label: 'System error' },
  { value: 'fraud_suspicion', label: 'Fraud suspicion' },
  { value: 'customer_request', label: 'Customer request' },
  { value: 'other', label: 'Other' }
] as const;

export type CustomerCancelReason = typeof CUSTOMER_CANCEL_REASONS[number]['value'];
export type AdminCancelReason = typeof ADMIN_CANCEL_REASONS[number]['value'];
