import { z } from 'zod';
import { contactSchema } from '../schema/contactSchema';

export type ContactFormData = z.infer<typeof contactSchema>;
