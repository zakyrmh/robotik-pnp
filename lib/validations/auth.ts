/**
 * Skema validasi Zod untuk formulir autentikasi
 *
 * Menggunakan Zod v4 untuk validasi data login dan register
 * dengan pesan error dalam Bahasa Indonesia.
 */

import { z } from 'zod'

/** Aturan validasi email yang dipakai ulang */
const emailSchema = z
  .email('Format email tidak valid')

/** Aturan validasi password yang dipakai ulang */
const passwordSchema = z
  .string()
  .min(6, 'Password minimal 6 karakter')

/** Skema validasi untuk form login */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

/** Skema validasi untuk form register */
export const registerSchema = z.object({
  full_name: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  email: emailSchema,
  password: passwordSchema,
})

/** Tipe data yang dihasilkan dari validasi login */
export type LoginFormData = z.infer<typeof loginSchema>

/** Tipe data yang dihasilkan dari validasi register */
export type RegisterFormData = z.infer<typeof registerSchema>
