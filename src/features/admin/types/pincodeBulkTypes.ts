/**
 * Bulk Pincode Types
 * Comprehensive type definitions for bulk update operations.
 */

import type { PincodeField } from '../config/bulkFieldConfig';

export type { PincodeField };

/**
 * Filter type for bulk operations
 * Supports geographic, boolean, and numeric filters
 */
export interface PincodeBulkFilter {
  // Geographic filters
  states?: string[];
  cities?: string[];
  pincodes?: string[];
  districts?: string[];

  // Boolean filters
  active?: boolean;
  is_serviceable?: boolean;
  cod_allowed?: boolean;
  cod_fees_applicable?: boolean;
  is_returnable?: boolean;
  is_exchangeable?: boolean;

  // Numeric comparison filters
  shipping_fee_gt?: number;
  shipping_fee_lt?: number;
  shipping_fee_eq?: number;

  cod_fee_gt?: number;
  cod_fee_lt?: number;
  cod_fee_eq?: number;

  free_shipping_threshold_gt?: number;
  free_shipping_threshold_lt?: number;
  free_shipping_threshold_eq?: number;

  min_order_amount_gt?: number;
  min_order_amount_lt?: number;
  min_order_amount_eq?: number;

  return_window_days_gt?: number;
  return_window_days_lt?: number;
  return_window_days_eq?: number;

  exchange_window_days_gt?: number;
  exchange_window_days_lt?: number;
  exchange_window_days_eq?: number;
}

/**
 * Update payload for bulk operations
 * Partial subset of pincode fields that can be updated
 */
export interface PincodeBulkUpdate {
  cod_fee?: number;
  shipping_fee?: number;
  free_shipping_threshold?: number | null;
  return_window_days?: number;
  exchange_window_days?: number;
  delivery_time?: string;
  active?: boolean;
  is_serviceable?: boolean;
  cod_allowed?: boolean;
  cod_fees_applicable?: boolean;
  is_returnable?: boolean;
  is_exchangeable?: boolean;
  min_order_amount?: number;
}

/**
 * Result of a bulk update operation
 */
export interface BulkUpdateResult {
  affectedCount: number;
  samplePincodes?: string[];
  error?: string;
  message?: string;
  dryRun?: boolean;
}

/**
 * Step definition for multi-step wizard
 */
export interface BulkUpdateStep {
  id: number;
  title: string;
  description: string;
}

/**
 * Modal mode for different workflows
 */
export type ModalMode = 'create' | 'edit' | 'bulk-update';