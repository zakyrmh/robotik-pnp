import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import { KriTeamEnum } from "./users";

// ---------------------------------------------------------
// HELPER
// ---------------------------------------------------------

const TimestampSchema = z.custom<Timestamp | Date>(
  (data) => data instanceof Timestamp || data instanceof Date,
  { message: "Must be a Firestore Timestamp or Date" },
);

// ---------------------------------------------------------
// ENUMS
// ---------------------------------------------------------

// Status logbook entry
export const LogbookStatusEnum = z.enum([
  "draft", // Draft, belum di-submit
  "submitted", // Sudah di-submit, menunggu review
  "needs_revision", // Perlu revisi
  "approved", // Disetujui pembimbing
]);

// Kategori aktivitas riset
export const ResearchActivityCategoryEnum = z.enum([
  "design", // Perancangan (mekanik, elektronik, software)
  "fabrication", // Fabrikasi/pembuatan
  "assembly", // Perakitan
  "programming", // Pemrograman
  "testing", // Pengujian
  "debugging", // Perbaikan bug/masalah
  "documentation", // Dokumentasi
  "meeting", // Rapat/diskusi tim
  "training", // Pelatihan/belajar
  "competition_prep", // Persiapan kompetisi
  "other", // Lainnya
]);

// ---------------------------------------------------------
// SUB-SCHEMAS
// ---------------------------------------------------------

// Attachment/dokumentasi
const AttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string(), // MIME type
  fileSize: z.number().optional(),
  uploadedAt: TimestampSchema,
});

// Komentar dari pembimbing/anggota lain
const LogbookCommentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  content: z.string(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema.optional(),
});

// ---------------------------------------------------------
// MAIN SCHEMA
// ---------------------------------------------------------

export const ResearchLogbookSchema = z.object({
  id: z.string(),

  // Tim KRI (krai, krsbi_h, krsbi_b, krsti, krsri)
  team: KriTeamEnum,

  // Author/pembuat logbook
  authorId: z.string(),
  authorName: z.string(),

  // Tanggal kegiatan (bukan tanggal dibuat)
  activityDate: TimestampSchema,

  // Judul kegiatan
  title: z.string().min(1, "Judul wajib diisi"),

  // Kategori aktivitas
  category: ResearchActivityCategoryEnum,

  // Deskripsi detail kegiatan
  description: z.string().min(1, "Deskripsi wajib diisi"),

  // Hasil yang dicapai
  achievements: z.string().optional(),

  // Kendala yang dihadapi
  challenges: z.string().optional(),

  // Rencana selanjutnya
  nextPlan: z.string().optional(),

  // Durasi kegiatan dalam jam
  durationHours: z.number().min(0).optional(),

  // Attachment/dokumentasi
  attachments: z.array(AttachmentSchema).optional(),

  // Status
  status: LogbookStatusEnum.default("draft"),

  // Komentar/feedback
  comments: z.array(LogbookCommentSchema).optional(),

  // Metadata
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,

  // Soft delete
  deletedAt: TimestampSchema.optional(),
  deletedBy: z.string().optional(),
});

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export type ResearchLogbook = z.infer<typeof ResearchLogbookSchema>;
export type LogbookStatus = z.infer<typeof LogbookStatusEnum>;
export type ResearchActivityCategory = z.infer<
  typeof ResearchActivityCategoryEnum
>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type LogbookComment = z.infer<typeof LogbookCommentSchema>;

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Mendapatkan label status logbook
 */
export function getLogbookStatusLabel(status: LogbookStatus): string {
  const labels: Record<LogbookStatus, string> = {
    draft: "Draft",
    submitted: "Menunggu Review",
    needs_revision: "Perlu Revisi",
    approved: "Disetujui",
  };
  return labels[status];
}

/**
 * Mendapatkan warna badge status logbook
 */
export function getLogbookStatusBadgeColor(status: LogbookStatus): string {
  const colors: Record<LogbookStatus, string> = {
    draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    submitted:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    needs_revision:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  return colors[status];
}

/**
 * Mendapatkan label kategori aktivitas
 */
export function getActivityCategoryLabel(
  category: ResearchActivityCategory,
): string {
  const labels: Record<ResearchActivityCategory, string> = {
    design: "Perancangan",
    fabrication: "Fabrikasi",
    assembly: "Perakitan",
    programming: "Pemrograman",
    testing: "Pengujian",
    debugging: "Debugging",
    documentation: "Dokumentasi",
    meeting: "Rapat/Diskusi",
    training: "Pelatihan",
    competition_prep: "Persiapan Kompetisi",
    other: "Lainnya",
  };
  return labels[category];
}

/**
 * Mendapatkan warna badge kategori
 */
export function getActivityCategoryBadgeColor(
  category: ResearchActivityCategory,
): string {
  const colors: Record<ResearchActivityCategory, string> = {
    design:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    fabrication:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    assembly:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    programming:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    testing: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    debugging: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    documentation:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    meeting:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    training:
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    competition_prep:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    other: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  };
  return colors[category];
}
