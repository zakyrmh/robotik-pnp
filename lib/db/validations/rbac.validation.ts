/**
 * Validasi Zod untuk tabel junction RBAC
 *
 * Validasi untuk:
 * - role_permissions: mapping role → permission
 * - user_roles: assignment role ke user
 * - user_departments: jabatan user di departemen (maks 1)
 * - user_divisions: jabatan user di divisi (maks 2)
 */

import { z } from 'zod';
import { DIVISION_ROLE } from '../schema/enums';

// ── Validasi: Role ↔ Permission ──

export const rolePermissionInsertSchema = z.object({
  role_id: z.string().uuid('Role ID tidak valid'),
  permission_id: z.string().uuid('Permission ID tidak valid'),
});

export type RolePermissionInsertInput = z.infer<typeof rolePermissionInsertSchema>;

// ── Validasi: User ↔ Role ──

export const userRoleInsertSchema = z.object({
  user_id: z.string().uuid('User ID tidak valid'),
  role_id: z.string().uuid('Role ID tidak valid'),
  assigned_by: z.string().uuid('Assigned by ID tidak valid').nullable().optional(),
});

export const userRoleDeleteSchema = z.object({
  user_id: z.string().uuid('User ID tidak valid'),
  role_id: z.string().uuid('Role ID tidak valid'),
});

export type UserRoleInsertInput = z.infer<typeof userRoleInsertSchema>;
export type UserRoleDeleteInput = z.infer<typeof userRoleDeleteSchema>;

// ── Validasi: User → Departemen ──

export const userDepartmentInsertSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid('User ID tidak valid'),
  department_id: z.string().uuid('Department ID tidak valid'),
  position: z
    .string()
    .min(2, 'Jabatan minimal 2 karakter')
    .max(100, 'Jabatan maksimal 100 karakter'),
});

export const userDepartmentUpdateSchema = userDepartmentInsertSchema
  .omit({ id: true, user_id: true })
  .partial();

export type UserDepartmentInsertInput = z.infer<typeof userDepartmentInsertSchema>;
export type UserDepartmentUpdateInput = z.infer<typeof userDepartmentUpdateSchema>;

// ── Validasi: User → Divisi ──

export const userDivisionInsertSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid('User ID tidak valid'),
  division_id: z.string().uuid('Division ID tidak valid'),
  role: z.enum(DIVISION_ROLE, {
    message: 'Role harus salah satu dari: mekanik, elektrikal, programmer',
  }),
});

export const userDivisionUpdateSchema = userDivisionInsertSchema
  .omit({ id: true, user_id: true })
  .partial();

export type UserDivisionInsertInput = z.infer<typeof userDivisionInsertSchema>;
export type UserDivisionUpdateInput = z.infer<typeof userDivisionUpdateSchema>;
