import { z } from 'zod';

export const majorInsertSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'Nama jurusan minimal 3 karakter').max(255),
});

export const majorUpdateSchema = majorInsertSchema.pick({ name: true });

export type MajorInsertInput = z.infer<typeof majorInsertSchema>;
export type MajorUpdateInput = z.infer<typeof majorUpdateSchema>;