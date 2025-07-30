import { z } from 'zod';

export const baseContactSchema = {
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Please enter a valid phone number (10 to 15 digits).'),
  message: z.string().min(1, 'Message is required.'),
  isBusiness: z.boolean().optional(),
};

/**
 * Generate a custom schema from a base template.
 * You can selectively include fields for different forms.
 */
export const createSchema = (fields: (keyof typeof baseContactSchema)[]) => {
  const selected = fields.reduce((acc, key) => {
    acc[key] = baseContactSchema[key];
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);
  return z.object(selected);
};
