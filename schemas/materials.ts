import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER (Standard Timestamp Transformation)
// ---------------------------------------------------------
const TimestampSchema = z
  .union([
    z.custom<Timestamp>((data) => data instanceof Timestamp),
    z.date(),
    z.string().datetime(),
  ])
  .transform((data) => {
    if (data instanceof Timestamp) return data.toDate();
    if (typeof data === "string") return new Date(data);
    return data;
  });

// ---------------------------------------------------------
// 2. ENUMS
// ---------------------------------------------------------

export const MaterialTypeEnum = z.enum([
  "file", // Uploaded file (PDF, PPTX, ZIP) -> Ada tombol Download
  "link", // External URL (Youtube, Drive, Website) -> Redirect
  "article", // Text content (Markdown/HTML) -> Baca di halaman
]);

// ---------------------------------------------------------
// 3. MAIN SCHEMA (Materi Pustaka)
// ---------------------------------------------------------

export const MaterialSchema = z.object({
  id: z.string(),
  orPeriod: z.string(), // e.g., "OR 21" (Context Isolation)

  // Relasi Optional (Bisa berdiri sendiri, atau nempel ke Activity)
  activityId: z.string().nullable().optional(),

  // Basic Info
  title: z.string().min(3, "Judul materi wajib diisi"),
  description: z.string().optional().default(""),
  type: MaterialTypeEnum,

  // --- Content Fields (Kondisional berdasarkan Type) ---

  // 1. Jika Type == 'file'
  fileUrl: z.string().nullable().optional(), // Path Storage / URL Download
  fileName: z.string().nullable().optional(), // Nama asli file (e.g. "modul_1.pdf")
  fileSize: z.number().int().nullable().optional(), // Ukuran dalam bytes (untuk display "2.5 MB")
  fileType: z.string().nullable().optional(), // MIME type (e.g. "application/pdf")

  // 2. Jika Type == 'link'
  externalUrl: z.string().url().nullable().optional(),

  // 3. Jika Type == 'article'
  articleContent: z.string().nullable().optional(), // HTML string atau Markdown

  // --- Analytics (Counter Sederhana) ---
  // Diupdate via increment() saat user berinteraksi
  viewCount: z.number().int().default(0), // Berapa kali halaman detail dibuka
  downloadCount: z.number().int().default(0), // Berapa kali tombol download diklik

  // Settings
  isVisible: z.boolean().default(true), // Admin bisa hide materi
  isDownloadable: z.boolean().default(true), // Khusus tipe 'file', bisa disable download jika mau (read-only)

  // Soft Delete
  deletedAt: TimestampSchema.nullable().optional(),
  deletedBy: z.string().nullable().optional(),

  // Metadata
  createdBy: z.string(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 4. ANALYTICS LOG SCHEMA (Untuk "Pantau Siapa")
// ---------------------------------------------------------
// Collection terpisah: 'material_logs'
// Gunanya: Agar admin tau "Si Budi sudah baca materi X jam berapa"

export const MaterialAccessTypeEnum = z.enum(["view", "download"]);

export const MaterialLogSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  userId: z.string(),
  orPeriod: z.string(),

  action: MaterialAccessTypeEnum, // 'view' atau 'download'

  timestamp: TimestampSchema,

  // Optional: Device info jika ingin tracking lebih dalam
  userAgent: z.string().optional(),
});

// ---------------------------------------------------------
// 5. EXPORT TYPES
// ---------------------------------------------------------

export type MaterialType = z.infer<typeof MaterialTypeEnum>;
export type MaterialAccessType = z.infer<typeof MaterialAccessTypeEnum>;

export type Material = z.infer<typeof MaterialSchema>;
export type MaterialLog = z.infer<typeof MaterialLogSchema>;
