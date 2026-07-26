import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Semua field harus diisi.")
      .email("Format email tidak valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Semua field harus diisi."),
    captchaToken: z.string().optional(),
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
  captchaToken: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
