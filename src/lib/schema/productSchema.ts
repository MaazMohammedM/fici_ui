import { z } from 'zod';

export const productSchema = z.object({
  article_id: z.string().min(4, 'Please ensure at least 4 characters'),
  name: z.string().min(2),
  description: z.string().optional(),
  sub_category: z.string().optional(),
  mrpPrice: z.number(),
  discountPrice: z.number(),
  gender: z.enum(['men', 'women', 'unisex']),
  category: z.enum(['Footwear', 'Bags and Accessories']),
  sizes: z.string(), // JSON stringified
  images: z.string(), // ✅ Add this line
  thumbnail_url: z.string().optional()
});

export type ProductFormData = z.infer<typeof productSchema>;
