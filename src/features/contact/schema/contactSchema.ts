import { createSchema } from '@lib/util/zodSchemaBuilders';

export const contactSchema = createSchema(['name', 'email', 'phone', 'message', 'isBusiness']);
