import { z } from 'zod';

export const enhancedProductSchema = z.object({
  article_id: z.string().min(4, 'Please ensure at least 4 characters'),
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string(),
  sub_category: z.string().optional(),
  mrp_price: z.string().min(1, 'MRP price is required'),
  discount_price: z.string().min(1, 'Discount price is required'),
  gender: z.string().nonempty('Please select a gender'),
  category: z.string().nonempty('Please select a category'),
  sizes: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  }, 'Please add at least one size with quantity'),
  images: z.string().optional(), // Optional for form validation, checked manually in onSubmit
  thumbnail_url: z.string().optional(),
  size_prices: z.string().optional() // JSON string for per-size pricing
});

// Update schema for editing (without article_id) - allows partial updates
export const editProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').trim().optional(),
  description: z.string().optional(),
  sub_category: z.string().optional(),
  mrp_price: z.string()
    .min(1, 'MRP price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'MRP price must be a positive number')
    .transform((val) => val.trim())
    .optional(),
  discount_price: z.string()
    .min(1, 'Discount price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Discount price must be a positive number')
    .transform((val) => val.trim())
    .optional(),
  gender: z.string().min(1, 'Please select a gender').trim().optional(),
  category: z.string().min(1, 'Please select a category').trim().optional(),
  sizes: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  }, 'Please add at least one size with quantity').optional(),
  thumbnail_url: z.string().optional(),
  // New fields for enhanced product management
  is_active: z.boolean().optional(),
  size_prices: z.string().optional(), // JSON string for per-size pricing
  tags: z.string().optional() // Comma-separated tags or JSON array
});

// Product discount validation schema
export const productDiscountSchema = z.object({
  discount_id: z.string().optional(),
  product_id: z.string().uuid(),
  name: z.string().optional(),
  mode: z.enum(['percent', 'amount']),
  value: z.number().min(0, 'Discount value must be positive'),
  base: z.enum(['mrp', 'price']).default('price'),
  active: z.boolean().default(true),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  max_discount_cap: z.number().min(0).optional(),
  promotion_type: z.enum(['clearance', 'deal_of_the_day', 'flash_sale', 'campaign', 'generic']).optional(),
  priority: z.number().int().min(0).default(100),
  stackable: z.boolean().default(false),
  promo_tag: z.string().optional()
});

// Partial update schema for products
export const partialEditProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').trim().optional(),
  description: z.string().optional(),
  sub_category: z.string().optional(),
  mrp_price: z.string()
    .min(1, 'MRP price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'MRP price must be a positive number')
    .transform((val) => val.trim())
    .optional(),
  discount_price: z.string()
    .min(1, 'Discount price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Discount price must be a positive number')
    .transform((val) => val.trim())
    .optional(),
  gender: z.string().min(1, 'Please select a gender').trim().optional(),
  category: z.string().min(1, 'Please select a category').trim().optional(),
  sizes: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  }, 'Please add at least one size with quantity').optional(),
  thumbnail_url: z.string().optional(),
  // New fields for enhanced product management
  is_active: z.boolean().optional(),
  size_prices: z.string().optional(), // JSON string for per-size pricing
  tags: z.string().optional() // Comma-separated tags or JSON array
});

export type EnhancedProductFormData = z.infer<typeof enhancedProductSchema>;
export type EditProductFormData = z.infer<typeof editProductSchema>;
export type ProductDiscountFormData = z.infer<typeof productDiscountSchema>;
export type PartialEditProductFormData = z.infer<typeof partialEditProductSchema>; 