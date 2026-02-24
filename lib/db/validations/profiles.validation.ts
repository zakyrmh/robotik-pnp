import { z } from 'zod';
import { GENDER_TYPE } from '../schema/enums';

export const profileInsertSchema = z.object({
  user_id: z.string().uuid(),
  membership_id: z.string().max(50).nullable().optional(),
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(255),
  nickname: z.string().max(100).nullable().optional(),
  gender: z.enum(GENDER_TYPE).nullable().optional(),
  birth_place: z.string().max(100).nullable().optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .nullable()
    .optional(),
  phone: z
    .string()
    .regex(/^(\+62|08)\d{8,12}$/, 'Nomor WhatsApp tidak valid')
    .nullable()
    .optional(),
  avatar_url: z.string().url('URL avatar tidak valid').nullable().optional(),
  address_domicile: z.string().max(500).nullable().optional(),
  address_origin: z.string().max(500).nullable().optional(),
});

export const profileUpdateSchema = profileInsertSchema.omit({ user_id: true }).partial();

export type ProfileInsertInput = z.infer<typeof profileInsertSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;