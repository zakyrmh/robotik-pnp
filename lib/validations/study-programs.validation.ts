import { z } from 'zod';

export const studyProgramInsertSchema = z.object({
  id: z.string().uuid(),
  major_id: z.string().uuid('ID jurusan tidak valid'),
  name: z.string().min(3, 'Nama program studi minimal 3 karakter').max(255),
});

export const studyProgramUpdateSchema = studyProgramInsertSchema
  .omit({ id: true })
  .partial();

export type StudyProgramInsertInput = z.infer<typeof studyProgramInsertSchema>;
export type StudyProgramUpdateInput = z.infer<typeof studyProgramUpdateSchema>;