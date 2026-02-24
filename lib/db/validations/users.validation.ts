import { z } from 'zod';
import { USER_STATUS } from '../schema/enums';

export const userInsertSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email('Email tidak valid'),
  status: z.enum(USER_STATUS).default('active'),
  deleted_at: z.string().datetime({ offset: true }).nullable().optional(),
});

export const userUpdateSchema = userInsertSchema.partial().omit({ id: true });

export type UserInsertInput = z.infer<typeof userInsertSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;