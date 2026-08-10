import { z } from "zod";

/**
 * Zod schema for updating user profile & academic registration details.
 */
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter.")
    .or(z.literal("")),
  nickname: z
    .string()
    .min(2, "Nama panggilan minimal 2 karakter.")
    .max(50, "Nama panggilan maksimal 50 karakter.")
    .optional()
    .nullable(),
  gender: z.enum(["L", "P"]).optional().nullable(),
  pob: z.string().max(100, "Tempat lahir maksimal 100 karakter.").optional().nullable(),
  dob: z.string().optional().nullable(),
  phone_number: z
    .string()
    .max(20, "Nomor telepon maksimal 20 karakter.")
    .optional()
    .nullable(),
  study_program_id: z.string().uuid("ID Program Studi tidak valid.").optional().nullable().or(z.literal("")),
  entry_year: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z.number().int().min(2000, "Tahun masuk tidak valid.").max(2100, "Tahun masuk tidak valid.").optional()
    )
    .nullable(),
  current_class: z.string().max(50, "Kelas maksimal 50 karakter.").optional().nullable(),
  high_school: z.string().max(100, "Asal sekolah maksimal 100 karakter.").optional().nullable(),
  origin_address: z.string().max(500, "Alamat asal maksimal 500 karakter.").optional().nullable(),
  domicile_address: z.string().max(500, "Alamat domisili maksimal 500 karakter.").optional().nullable(),
  motivation: z.string().max(2000, "Motivasi maksimal 2000 karakter.").optional().nullable(),
  org_experience: z.string().max(2000, "Pengalaman organisasi maksimal 2000 karakter.").optional().nullable(),
  achievements: z.string().max(2000, "Prestasi maksimal 2000 karakter.").optional().nullable(),
  avatar_url: z.string().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Zod schema for updating account email.
 */
export const updateEmailSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
  newEmail: z
    .string()
    .min(1, "Email baru wajib diisi.")
    .email("Format email tidak valid."),
});

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;

/**
 * Zod schema for changing password.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter."),
    confirmNewPassword: z.string().min(1, "Konfirmasi kata sandi baru wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Konfirmasi kata sandi baru tidak cocok.",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Zod schema for account soft-deletion (Danger Zone / ISMS Compliance).
 */
export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
  deleteReason: z
    .string()
    .min(5, "Alasan penghapusan akun wajib diisi (minimal 5 karakter).")
    .max(500, "Alasan penghapusan maksimal 500 karakter."),
  confirmText: z.string().refine((val) => val === "SAYA INGIN MENGHAPUS AKUN", {
    message: 'Teks konfirmasi harus persis "SAYA INGIN MENGHAPUS AKUN".',
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/**
 * Zod schema for updating notification preferences.
 */
export const updateNotificationPreferencesSchema = z.object({
  activities_notify: z.boolean().default(true),
  piket_notify: z.boolean().default(true),
  tasks_notify: z.boolean().default(true),
  discipline_notify: z.boolean().default(true),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
