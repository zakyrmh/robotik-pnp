import { z } from 'zod';

export const userBlacklistInsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid(),
    admin_id: z.string().uuid(),
    reason: z.string().min(10, 'Alasan minimal 10 karakter'),
    evidence_url: z.string().url('URL bukti tidak valid').nullable().optional(),
    is_permanent: z.boolean().default(false),
    expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine(
    (data) => {
      // Jika tidak permanen, expires_at harus diisi
      if (!data.is_permanent && !data.expires_at) return false;
      return true;
    },
    {
      message: 'expires_at harus diisi jika blacklist tidak permanen',
      path: ['expires_at'],
    },
  );

export const userBlacklistUpdateSchema = userBlacklistInsertSchema
  .omit({ user_id: true, admin_id: true, id: true })
  .partial();

export type UserBlacklistInsertInput = z.infer<typeof userBlacklistInsertSchema>;
export type UserBlacklistUpdateInput = z.infer<typeof userBlacklistUpdateSchema>;