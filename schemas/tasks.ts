import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER (Standard Timestamp Transformation)
// ---------------------------------------------------------

// Mengubah Timestamp/String menjadi Date object agar aman di Client Component
const TimestampSchema = z
  .union([
    z.custom<Timestamp>((data) => data instanceof Timestamp),
    z.date(),
    z.string().datetime(),
  ])
  .transform((data) => {
    if (data instanceof Timestamp) {
      return data.toDate();
    }
    if (typeof data === "string") {
      return new Date(data);
    }
    return data;
  });

// ---------------------------------------------------------
// 2. ENUMS
// ---------------------------------------------------------

// Tipe pengumpulan tugas
export const SubmissionTypeEnum = z.enum([
  "file", // Upload file (PDF/Zip)
  "link", // Link Google Drive/Github
  "text", // Input text langsung
  "none", // Hanya instruksi, tanpa pengumpulan
]);

// Status Tugas (dari sisi Admin/Pembuat)
export const TaskStatusEnum = z.enum([
  "draft", // Masih diedit
  "published", // Sudah bisa dilihat peserta
  "archived", // Sudah lewat/disimpan
]);

// Tipe Tugas (Individu / Kelompok)
export const TaskTypeEnum = z.enum([
  "individual", // Tugas Individu
  "group", // Tugas Kelompok
]);

// ---------------------------------------------------------
// 3. MAIN SCHEMA
// ---------------------------------------------------------

export const TaskSchema = z.object({
  id: z.string(),

  // Basic Info
  title: z.string().min(3, "Judul tugas minimal 3 karakter"),
  description: z.string().optional().default(""),
  orPeriod: z.string().optional(), // e.g., "OR 21" - filter context

  // Settings
  deadline: TimestampSchema,
  submissionType: SubmissionTypeEnum.default("file"),
  taskType: TaskTypeEnum.default("individual"),
  maxPoints: z.number().int().nonnegative().default(100), // Poin maksimal (e.g. 100)

  // Visibility & Status
  isVisible: z.boolean().default(true),
  status: TaskStatusEnum.default("draft"),

  // Soft Delete (Nullable agar sesuai dengan logic 'deletedAt: null')
  deletedAt: TimestampSchema.nullable().optional(),
  deletedBy: z.string().nullable().optional(),

  // Metadata
  createdBy: z.string(), // UID pembuat soal
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 4. EXPORT TYPES
// ---------------------------------------------------------

export type SubmissionType = z.infer<typeof SubmissionTypeEnum>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskType = z.infer<typeof TaskTypeEnum>;

export type Task = z.infer<typeof TaskSchema>;
