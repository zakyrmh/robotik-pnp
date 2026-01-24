import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER
// ---------------------------------------------------------

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

export const AnnouncementTargetEnum = z.enum([
  "all", // Semua user
  "caang", // Calon anggota
  "member", // Anggota resmi
  "kri", // Anggota tim KRI
  "official", // Anggota dengan jabatan struktural/departemen
]);

export const AnnouncementPriorityEnum = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);

// ---------------------------------------------------------
// 3. MAIN SCHEMA
// ---------------------------------------------------------

export const AnnouncementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Judul pengumuman wajib diisi"),
  content: z.string().min(1, "Isi pengumuman wajib diisi"),

  // Target audience
  targetAudience: AnnouncementTargetEnum,
  orPeriod: z.string().optional(), // Opsional: jika khusus untuk periode OR tertentu

  // Priority & Status
  priority: AnnouncementPriorityEnum.default("normal"),
  isPublished: z.boolean().default(false),
  isPinned: z.boolean().default(false),

  // Schedule
  publishedAt: TimestampSchema.optional(),
  expiresAt: TimestampSchema.optional(), // Kapan pengumuman expired/tidak tampil lagi

  // Metadata
  createdBy: z.string(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 4. EXPORT TYPES
// ---------------------------------------------------------

export type AnnouncementTarget = z.infer<typeof AnnouncementTargetEnum>;
export type AnnouncementPriority = z.infer<typeof AnnouncementPriorityEnum>;
export type Announcement = z.infer<typeof AnnouncementSchema>;

// ---------------------------------------------------------
// 5. HELPER FUNCTIONS
// ---------------------------------------------------------

export function getTargetDisplayName(target: AnnouncementTarget): string {
  const names: Record<AnnouncementTarget, string> = {
    all: "Semua",
    caang: "Calon Anggota",
    member: "Anggota",
    kri: "Tim KRI",
    official: "Pengurus",
  };
  return names[target];
}

export function getPriorityDisplayName(priority: AnnouncementPriority): string {
  const names: Record<AnnouncementPriority, string> = {
    low: "Rendah",
    normal: "Normal",
    high: "Tinggi",
    urgent: "Mendesak",
  };
  return names[priority];
}
