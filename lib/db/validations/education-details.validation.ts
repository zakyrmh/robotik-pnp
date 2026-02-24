import { z } from 'zod';

export const educationDetailInsertSchema = z.object({
  user_id: z.string().uuid(),
  nim: z
    .string()
    .min(5, 'NIM minimal 5 karakter')
    .max(20, 'NIM maksimal 20 karakter')
    .regex(/^\d+$/, 'NIM hanya boleh angka'),
  study_program_id: z.string().uuid('ID program studi tidak valid'),
  class: z
    .string()
    .max(20, 'Kelas maksimal 20 karakter')
    .nullable()
    .optional(),
});

export const educationDetailUpdateSchema = educationDetailInsertSchema
  .omit({ user_id: true })
  .partial();

export type EducationDetailInsertInput = z.infer<typeof educationDetailInsertSchema>;
export type EducationDetailUpdateInput = z.infer<typeof educationDetailUpdateSchema>;