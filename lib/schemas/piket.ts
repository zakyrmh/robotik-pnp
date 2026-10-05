import { z } from "zod";

/**
 * Validasi input aksi `getPiketMemberHistoryAction`.
 * `profileId` wajib UUID (identitas profil Supabase Auth).
 */
export const piketMemberHistorySchema = z.object({
  profileId: z.string().uuid(),
});

export type PiketMemberHistoryInput = z.infer<typeof piketMemberHistorySchema>;
