import { z } from "zod";

export const UserRoleEnum = z.enum([
  "super-admin",
  "admin-or",
  "admin-komdis",
  "admin-kestari",
  "admin-divisi",
  "anggota",
  "caang",
  "alumni",
]);

export const UpdateUserIdentitySchema = z.object({
  userId: z.string().uuid("ID Pengguna tidak valid"),
  role: UserRoleEnum,
  nim: z
    .string()
    .min(5, "NIM minimal 5 karakter")
    .max(20, "NIM maksimal 20 karakter")
    .nullable()
    .optional(),
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  phoneNumber: z
    .string()
    .min(10, "Nomor HP tidak valid")
    .max(15, "Nomor HP maksimal 15 karakter")
    .nullable()
    .optional(),
  studyProgramId: z
    .string()
    .uuid("ID Program Studi tidak valid")
    .nullable()
    .optional(),
  isOnboarded: z.boolean(),
});

export const SoftDeleteUserSchema = z.object({
  userId: z.string().uuid("ID Pengguna tidak valid"),
  deleteReason: z
    .string()
    .min(5, "Alasan penghapusan wajib diisi (minimal 5 karakter)"),
});

export const RestoreUserSchema = z.object({
  userId: z.string().uuid("ID Pengguna tidak valid"),
});

export const UserFilterSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  studyProgramId: z.string().optional(),
  status: z.enum(["all", "active", "archived"]).optional().default("all"),
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().positive().optional().default(10),
});

export type UpdateUserIdentityInput = z.infer<typeof UpdateUserIdentitySchema>;
export type SoftDeleteUserInput = z.infer<typeof SoftDeleteUserSchema>;
export type RestoreUserInput = z.infer<typeof RestoreUserSchema>;
export type UserFilterInput = z.infer<typeof UserFilterSchema>;
