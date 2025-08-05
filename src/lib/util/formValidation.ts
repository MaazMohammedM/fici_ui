import { z } from 'zod';

export const enhancedProductSchema = z.object({
  article_id: z.string().min(4, 'Please ensure at least 4 characters'),
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string(),
  brand: z.string().optional(),
  mrp_price: z.string().min(1, 'MRP price is required'),
  discount_price: z.string().min(1, 'Discount price is required'),
  gender: z.string().nonempty('Please select a gender'),
  category: z.string().nonempty('Please select a category'),
  sizes: z.string(),
  images: z.string(),
  thumbnail_url: z.string().optional()
});

// Update schema for editing (without article_id)
export const editProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  brand: z.string().optional(),
  mrp_price: z.string().min(1, 'MRP price is required'),
  discount_price: z.string().min(1, 'Discount price is required'),
  gender: z.string().nonempty('Please select a gender'),
  category: z.string().nonempty('Please select a category'),
  sizes: z.string(),
  thumbnail_url: z.string().optional()
});

export type EnhancedProductFormData = z.infer<typeof enhancedProductSchema>;
export type EditProductFormData = z.infer<typeof editProductSchema>; 