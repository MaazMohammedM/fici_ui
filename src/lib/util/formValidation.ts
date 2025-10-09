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
  thumbnail_url: z.string().optional()
});

// Update schema for editing (without article_id)
export const editProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
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
  thumbnail_url: z.string().optional()
});

export type EnhancedProductFormData = z.infer<typeof enhancedProductSchema>;
export type EditProductFormData = z.infer<typeof editProductSchema>; 