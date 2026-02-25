/**
 * Tipe schema untuk tabel junction RBAC
 *
 * Berisi tipe untuk:
 * - role_permissions: mapping N:M antara roles dan permissions
 * - user_roles: assignment role RBAC ke user
 * - user_departments: jabatan user di departemen (maks 1)
 * - user_divisions: jabatan user di divisi kontes (maks 2)
 */

import type { DivisionRole } from './enums';

// ── Junction: Role ↔ Permission ──

export type RolePermission = {
  role_id: string;
  permission_id: string;
};

export type RolePermissionInsert = RolePermission;

// ── Junction: User ↔ Role (sistem) ──

export type UserRole = {
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  created_at: string;
};

export type UserRoleInsert = Omit<UserRole, 'created_at'>;
export type UserRoleDelete = Pick<UserRole, 'user_id' | 'role_id'>;

// ── Assignment: User → Departemen ──

export type UserDepartment = {
  id: string;
  user_id: string;
  department_id: string;
  position: string;           // jabatan spesifik di departemen
  created_at: string;
  updated_at: string;
};

export type UserDepartmentInsert = Omit<UserDepartment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UserDepartmentUpdate = Partial<Pick<UserDepartment, 'department_id' | 'position'>>;

// ── Assignment: User → Divisi ──

export type UserDivision = {
  id: string;
  user_id: string;
  division_id: string;
  role: DivisionRole;          // mekanik | elektrikal | programmer
  created_at: string;
  updated_at: string;
};

export type UserDivisionInsert = Omit<UserDivision, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UserDivisionUpdate = Partial<Pick<UserDivision, 'division_id' | 'role'>>;
