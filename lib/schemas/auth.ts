import { z } from "zod";

const captchaTokenSchema = z
  .string()
  .min(
    1,
    "Verifikasi keamanan wajib dilengkapi. Centang CAPTCHA terlebih dahulu.",
  );

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Semua field harus diisi.")
      .email("Format email tidak valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Semua field harus diisi."),
    captchaToken: captchaTokenSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email dan password wajib diisi.")
    .email("Format email tidak valid."),
  password: z.string().min(1, "Email dan password wajib diisi."),
  captchaToken: captchaTokenSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  nim: z.string().min(1, "NIM dan Email wajib diisi."),
  email: z
    .string()
    .min(1, "NIM dan Email wajib diisi.")
    .email("Format email tidak valid."),
  captchaToken: captchaTokenSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Semua field harus diisi."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok.",
    path: ["confirmPassword"],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
