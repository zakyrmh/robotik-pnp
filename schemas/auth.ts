import { z } from "zod";

/**
 * Login Schema
 * Validasi untuk form login menggunakan Zod.
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginValues = z.infer<typeof LoginSchema>;
