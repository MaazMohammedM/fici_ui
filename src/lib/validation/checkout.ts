import { z } from 'zod';

// Guest contact validation schema
export const guestContactSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number is too long'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long')
});

// Address validation schema
export const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(10, 'Complete address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  landmark: z.string().optional()
});

// Order validation schema
export const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    article_id: z.string(),
    name: z.string(),
    color: z.string(),
    size: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    mrp: z.number().min(0),
    discount_percentage: z.number().min(0).max(100),
    thumbnail_url: z.string().url()
  })).min(1, 'Cart cannot be empty'),
  subtotal: z.number().min(0),
  discount: z.number().min(0),
  delivery_charge: z.number().min(0),
  shipping_address: addressSchema,
  payment_method: z.enum(['razorpay', 'cod'])
});

export type GuestContactInfo = z.infer<typeof guestContactSchema>;
export type Address = z.infer<typeof addressSchema>;
export type OrderData = z.infer<typeof orderSchema>;
