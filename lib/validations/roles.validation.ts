/**
 * Validasi Zod untuk tabel roles dan permissions
 *
 * Validasi data role RBAC dan permission granular.
 */

import { z } from 'zod';

// ── Validasi Role ──

export const roleInsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, 'Nama role minimal 2 karakter')
    .max(50, 'Nama role maksimal 50 karakter')
    .regex(
      /^[a-z_]+$/,
      'Nama role hanya boleh huruf kecil dan underscore'
    ),
  description: z.string().max(500).nullable().optional(),
});

export const roleUpdateSchema = roleInsertSchema
  .omit({ id: true })
  .partial();

export type RoleInsertInput = z.infer<typeof roleInsertSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

// ── Validasi Permission ──

export const permissionInsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(3, 'Nama permission minimal 3 karakter')
    .max(100, 'Nama permission maksimal 100 karakter')
    .regex(
      /^[a-z_]+:[a-z_]+$/,
      'Format permission harus <modul>:<aksi> (contoh: member:read)'
    ),
  description: z.string().max(500).nullable().optional(),
});

export const permissionUpdateSchema = permissionInsertSchema
  .omit({ id: true })
  .partial();

export type PermissionInsertInput = z.infer<typeof permissionInsertSchema>;
export type PermissionUpdateInput = z.infer<typeof permissionUpdateSchema>;
