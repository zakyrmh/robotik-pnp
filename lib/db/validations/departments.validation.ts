/**
 * Validasi Zod untuk tabel departments
 *
 * Validasi data departemen termasuk slug yang harus
 * lowercase dan hanya mengandung huruf, angka, dan tanda hubung.
 */

import { z } from 'zod';

/** Regex untuk validasi slug: lowercase, angka, tanda hubung */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const departmentInsertSchema = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  name: z
    .string()
    .min(2, 'Nama departemen minimal 2 karakter')
    .max(100, 'Nama departemen maksimal 100 karakter'),
  slug: z
    .string()
    .min(2, 'Slug minimal 2 karakter')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(slugRegex, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
});

export const departmentUpdateSchema = departmentInsertSchema
  .omit({ id: true })
  .partial();

export type DepartmentInsertInput = z.infer<typeof departmentInsertSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
