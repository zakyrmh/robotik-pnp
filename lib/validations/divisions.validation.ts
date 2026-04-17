/**
 * Validasi Zod untuk tabel divisions
 *
 * Validasi data divisi kontes robot termasuk slug.
 */

import { z } from 'zod';

/** Regex untuk validasi slug: lowercase, angka, tanda hubung */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const divisionInsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, 'Nama divisi minimal 2 karakter')
    .max(100, 'Nama divisi maksimal 100 karakter'),
  slug: z
    .string()
    .min(2, 'Slug minimal 2 karakter')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(slugRegex, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
});

export const divisionUpdateSchema = divisionInsertSchema
  .omit({ id: true })
  .partial();

export type DivisionInsertInput = z.infer<typeof divisionInsertSchema>;
export type DivisionUpdateInput = z.infer<typeof divisionUpdateSchema>;
