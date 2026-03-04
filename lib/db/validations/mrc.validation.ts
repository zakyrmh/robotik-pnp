/**
 * Validasi Zod untuk tabel MRC
 *
 * Schema validasi untuk operasi CRUD pada mrc_events
 * dan mrc_categories. Digunakan di server actions
 * untuk memastikan data input sesuai aturan bisnis.
 */

import { z } from 'zod'
import { MRC_EVENT_STATUS } from '@/lib/db/schema/mrc'

// ═══════════════════════════════════════
// VALIDASI: MRC Event
// ═══════════════════════════════════════

/** Schema untuk membuat event baru */
export const mrcEventInsertSchema = z.object({
  name: z.string().min(3, 'Nama event minimal 3 karakter').max(255),
  slug: z
    .string()
    .min(3, 'Slug minimal 3 karakter')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  description: z.string().max(2000).nullable().optional(),
  venue: z.string().max(500).nullable().optional(),
  contact_person: z.string().max(255).nullable().optional(),
  contact_phone: z.string().max(20).nullable().optional(),
  contact_email: z.string().email('Format email tidak valid').nullable().optional(),
})

/** Schema untuk update pendaftaran (buka/tutup) */
export const mrcRegistrationUpdateSchema = z
  .object({
    status: z.enum(MRC_EVENT_STATUS),
    registration_open: z.string().nullable().optional(),
    registration_close: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Jika status registration, waktu buka harus diisi
      if (data.status === 'registration' && !data.registration_open) {
        return false
      }
      return true
    },
    { message: 'Waktu buka pendaftaran wajib diisi saat membuka pendaftaran.' }
  )

/** Schema untuk update jadwal event */
export const mrcEventScheduleSchema = z
  .object({
    event_start: z.string().nullable().optional(),
    event_end: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.event_start && data.event_end) {
        return new Date(data.event_start) <= new Date(data.event_end)
      }
      return true
    },
    { message: 'Tanggal mulai harus sebelum atau sama dengan tanggal selesai.' }
  )

// ═══════════════════════════════════════
// VALIDASI: MRC Category
// ═══════════════════════════════════════

/** Schema untuk membuat kategori baru */
export const mrcCategoryInsertSchema = z
  .object({
    event_id: z.string().uuid('Event ID tidak valid'),
    name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(255),
    description: z.string().max(2000).nullable().optional(),
    rules_url: z.string().url('Format URL tidak valid').nullable().optional(),
    max_team_size: z.number().int().min(1).max(20).default(3),
    min_team_size: z.number().int().min(1).max(20).default(1),
    max_teams: z.number().int().min(1).nullable().optional(),
    registration_fee: z.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.min_team_size <= data.max_team_size, {
    message: 'Min anggota tim harus ≤ max anggota tim.',
  })
