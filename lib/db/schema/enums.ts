/**
 * Enum dan konstanta untuk RBAC, Departemen, dan Divisi
 *
 * Memperluas enums yang sudah ada dengan tipe baru
 * untuk role teknis divisi dan role sistem RBAC.
 */

// ── Enum yang sudah ada (dari file asli) ──
export const USER_STATUS = ['active', 'banned', 'deleted', 'inactive'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const GENDER_TYPE = ['L', 'P'] as const;
export type GenderType = (typeof GENDER_TYPE)[number];

// ── Enum baru: Role teknis di divisi kontes ──
export const DIVISION_ROLE = ['mekanik', 'elektrikal', 'programmer'] as const;
export type DivisionRole = (typeof DIVISION_ROLE)[number];

// ── Konstanta: Role sistem RBAC ──
export const SYSTEM_ROLE = [
  'super_admin',
  'admin',
  'pengurus',
  'anggota',
  'caang',       // Calon Anggota — role default saat registrasi
] as const;
export type SystemRole = (typeof SYSTEM_ROLE)[number];