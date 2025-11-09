import { z } from 'zod';

// Enhanced validation schemas for production-grade validation

// User Authentication Schemas
export const SignInSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*)(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

export const SignUpSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Guest Checkout Schema
export const GuestContactSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-\(\)]{10,15}$/.test(val), {
      message: 'Please enter a valid phone number'
    })
});

// Address Schema
export const AddressSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address is too long'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'City can only contain letters and spaces'),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'State can only contain letters and spaces'),
  pincode: z.string()
    .min(5, 'Pincode must be at least 5 digits')
    .max(10, 'Pincode is too long')
    .regex(/^\d{5,10}$/, 'Please enter a valid pincode'),
  country: z.string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country name is too long')
    .default('India'),
  isDefault: z.boolean().default(false)
});

// Product Search Schema
export const ProductSearchSchema = z.object({
  query: z.string()
    .max(100, 'Search query is too long')
    .optional(),
  category: z.string()
    .max(50, 'Category name is too long')
    .optional(),
  subCategory: z.string()
    .max(50, 'Sub-category name is too long')
    .optional(),
  gender: z.enum(['men', 'women', 'unisex', 'all'])
    .optional(),
  minPrice: z.number()
    .min(0, 'Minimum price cannot be negative')
    .max(100000, 'Price is too high')
    .optional(),
  maxPrice: z.number()
    .min(0, 'Maximum price cannot be negative')
    .max(100000, 'Price is too high')
    .optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'popular'])
    .default('newest'),
  page: z.number()
    .min(1, 'Page number must be at least 1')
    .max(1000, 'Page number is too high')
    .default(1),
  limit: z.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(12)
}).refine((data) => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "Minimum price cannot be greater than maximum price",
  path: ["minPrice"],
});

// Cart Item Schema
export const CartItemSchema = z.object({
  productId: z.string()
    .min(1, 'Product ID is required'),
  articleId: z.string()
    .min(1, 'Article ID is required'),
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name is too long'),
  size: z.string()
    .max(10, 'Size is too long')
    .optional(),
  color: z.string()
    .max(50, 'Color name is too long')
    .optional(),
  quantity: z.number()
    .min(1, 'Quantity must be at least 1')
    .max(10, 'Cannot add more than 10 items'),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(100000, 'Price is too high'),
  mrp: z.number()
    .min(0, 'MRP cannot be negative')
    .max(100000, 'MRP is too high'),
  discountPercentage: z.number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),
  thumbnailUrl: z.string()
    .url('Invalid image URL')
    .optional()
});

// Contact Form Schema
export const ContactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-\(\)]{10,15}$/.test(val), {
      message: 'Please enter a valid phone number'
    }),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject is too long'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long'),
  category: z.enum(['general', 'support', 'complaint', 'suggestion', 'business'])
    .default('general')
});

// Newsletter Subscription Schema
export const NewsletterSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  preferences: z.array(z.enum(['new_arrivals', 'sales', 'exclusive_offers', 'style_tips']))
    .optional()
    .default(['new_arrivals', 'sales'])
});

// Review Schema
export const ReviewSchema = z.object({
  productId: z.string()
    .min(1, 'Product ID is required'),
  rating: z.number()
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  title: z.string()
    .min(5, 'Review title must be at least 5 characters')
    .max(100, 'Review title is too long'),
  comment: z.string()
    .min(10, 'Review comment must be at least 10 characters')
    .max(1000, 'Review comment is too long'),
  wouldRecommend: z.boolean()
    .default(true),
  size: z.string()
    .max(10, 'Size is too long')
    .optional(),
  fit: z.enum(['too_small', 'perfect', 'too_large'])
    .optional()
});

// Order Schema
export const OrderSchema = z.object({
  items: z.array(CartItemSchema)
    .min(1, 'Order must contain at least one item'),
  shippingAddress: AddressSchema,
  paymentMethod: z.enum(['razorpay', 'cod', 'upi', 'card'])
    .default('razorpay'),
  subtotal: z.number()
    .min(0, 'Subtotal cannot be negative'),
  discount: z.number()
    .min(0, 'Discount cannot be negative')
    .default(0),
  deliveryCharge: z.number()
    .min(0, 'Delivery charge cannot be negative')
    .default(0),
  tax: z.number()
    .min(0, 'Tax cannot be negative')
    .default(0),
  totalAmount: z.number()
    .min(0, 'Total amount cannot be negative'),
  notes: z.string()
    .max(500, 'Notes are too long')
    .optional()
});

// File Upload Schema
export const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 'Only JPEG, PNG, and WebP images are allowed'),
  alt: z.string()
    .max(200, 'Alt text is too long')
    .optional()
});

// Export type definitions
export type SignInFormData = z.infer<typeof SignInSchema>;
export type SignUpFormData = z.infer<typeof SignUpSchema>;
export type GuestContactInfo = z.infer<typeof GuestContactSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type ProductSearchParams = z.infer<typeof ProductSearchSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type ContactFormData = z.infer<typeof ContactFormSchema>;
export type NewsletterData = z.infer<typeof NewsletterSchema>;
export type ReviewData = z.infer<typeof ReviewSchema>;
export type OrderData = z.infer<typeof OrderSchema>;
export type FileUploadData = z.infer<typeof FileUploadSchema>;

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
  return /^\+?[\d\s\-\(\)]{10,15}$/.test(phone);
};

export const validatePincode = (pincode: string): boolean => {
  return /^\d{5,10}$/.test(pincode);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  return { isValid: true };
};
