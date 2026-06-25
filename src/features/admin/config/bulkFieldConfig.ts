/**
 * Bulk Field Configuration
 * Configuration-driven approach for all bulk-editable fields.
 * Extensible and reusable across the application.
 */

export type PincodeField =
  | 'cod_fee'
  | 'shipping_fee'
  | 'free_shipping_threshold'
  | 'return_window_days'
  | 'exchange_window_days'
  | 'delivery_time'
  | 'cod_allowed'
  | 'cod_fees_applicable'
  | 'is_serviceable'
  | 'is_returnable'
  | 'is_exchangeable'
  | 'active'
  | 'min_order_amount';

export type FieldType = 'number' | 'boolean' | 'text';

export interface FieldConfig {
  label: string;
  description?: string;
  type: FieldType;
  placeholder?: string;
  min?: number;
  step?: number;
  validation?: (value: any) => string | null;
}

/**
 * Configuration for all bulk-editable fields.
 * Add new fields here to automatically support them in bulk update.
 */
export const BULK_EDITABLE_FIELDS: Record<PincodeField, FieldConfig> = {
  cod_fee: {
    label: 'COD Fee',
    description: 'Cash on Delivery fee amount in rupees',
    type: 'number',
    placeholder: 'Enter amount',
    min: 0,
    step: 0.01,
    validation: (value) => {
      if (value === null || value === undefined) return 'COD fee is required';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (num < 0) return 'COD fee cannot be negative';
      return null;
    },
  },
  shipping_fee: {
    label: 'Shipping Fee',
    description: 'Standard shipping fee in rupees',
    type: 'number',
    placeholder: 'Enter amount',
    min: 0,
    step: 0.01,
    validation: (value) => {
      if (value === null || value === undefined) return 'Shipping fee is required';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (num < 0) return 'Shipping fee cannot be negative';
      return null;
    },
  },
  free_shipping_threshold: {
    label: 'Free Shipping Threshold',
    description: 'Order amount above which shipping is free',
    type: 'number',
    placeholder: 'Enter amount',
    min: 0,
    step: 0.01,
    validation: (value) => {
      if (value === null || value === undefined) return null; // Optional
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (num < 0) return 'Threshold cannot be negative';
      return null;
    },
  },
  return_window_days: {
    label: 'Return Window (Days)',
    description: 'Number of days for product return',
    type: 'number',
    placeholder: 'Enter days',
    min: 0,
    step: 1,
    validation: (value) => {
      if (value === null || value === undefined) return 'Return window is required';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (num < 0) return 'Days cannot be negative';
      if (!Number.isInteger(num)) return 'Days must be an integer';
      return null;
    },
  },
  exchange_window_days: {
    label: 'Exchange Window (Days)',
    description: 'Number of days for product exchange',
    type: 'number',
    placeholder: 'Enter days',
    min: 0,
    step: 1,
    validation: (value) => {
      if (value === null || value === undefined) return 'Exchange window is required';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (num < 0) return 'Days cannot be negative';
      if (!Number.isInteger(num)) return 'Days must be an integer';
      return null;
    },
  },
  delivery_time: {
    label: 'Delivery Time',
    description: 'Estimated delivery time (e.g., "2-3 days", "Next day")',
    type: 'text',
    placeholder: 'e.g., "2-3 days"',
    validation: (value) => {
      if (!value || String(value).trim() === '') return 'Delivery time is required';
      return null;
    },
  },
  cod_allowed: {
    label: 'Cash on Delivery Allowed',
    description: 'Enable or disable COD for this area',
    type: 'boolean',
  },
  cod_fees_applicable: {
    label: 'COD Fees Applicable',
    description: 'Whether COD fees should be charged',
    type: 'boolean',
  },
  is_serviceable: {
    label: 'Is Serviceable',
    description: 'Mark area as serviceable',
    type: 'boolean',
  },
  is_returnable: {
    label: 'Is Returnable',
    description: 'Allow product returns in this area',
    type: 'boolean',
  },
  is_exchangeable: {
    label: 'Is Exchangeable',
    description: 'Allow product exchanges in this area',
    type: 'boolean',
  },
  active: {
    label: 'Active',
    description: 'Activate or deactivate pincode',
    type: 'boolean',
  },
  min_order_amount: {
    label: 'Minimum Order Amount',
    description: 'Minimum order value in rupees',
    type: 'number',
    placeholder: 'Enter amount',
    min: 0,
    step: 0.01,
    validation: (value) => {
      if (value === null || value === undefined) return null; // Optional
      const num = Number(value);
      if (isNaN(num)) return 'Must be a valid number';
      if (num < 0) return 'Amount cannot be negative';
      return null;
    },
  },
};

/**
 * Group fields by category for better UX
 */
export const FIELD_GROUPS = {
  PRICING: ['shipping_fee', 'cod_fee', 'free_shipping_threshold', 'min_order_amount'],
  OPERATIONS: ['delivery_time', 'return_window_days', 'exchange_window_days'],
  POLICIES: ['is_serviceable', 'cod_allowed', 'cod_fees_applicable', 'is_returnable', 'is_exchangeable'],
  MANAGEMENT: ['active'],
} as const;

/**
 * Get all fields sorted by group
 */
export const getAllFieldsByGroup = (): Record<string, PincodeField[]> => {
  return FIELD_GROUPS as any;
};

/**
 * Get field config with defaults
 */
export const getFieldConfig = (field: PincodeField): FieldConfig => {
  return BULK_EDITABLE_FIELDS[field];
};