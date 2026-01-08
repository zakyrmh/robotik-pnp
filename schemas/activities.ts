import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER (Sama seperti di users.ts & registrations.ts)
// ---------------------------------------------------------

// Helper khusus untuk memvalidasi Firestore Timestamp
// Output akhirnya selalu JavaScript Date agar aman untuk Client Component
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

export const ActivityTypeEnum = z.enum(["recruitment", "internal"]);
export const ActivityModeEnum = z.enum(["online", "offline", "hybrid"]);
export const ActivityStatusEnum = z.enum([
  "upcoming",
  "ongoing",
  "completed",
  "cancelled",
]);

// ---------------------------------------------------------
// 3. MAIN SCHEMA
// ---------------------------------------------------------

export const ActivitySchema = z.object({
  id: z.string(),
  slug: z.string().min(1, "Slug wajib diisi"), // URL friendly identifier
  type: ActivityTypeEnum,

  // Basic Info
  title: z.string().min(3, "Judul aktivitas minimal 3 karakter"),
  description: z.string().optional().default(""),
  orPeriod: z.string().optional(), // Opsional: jika terkait dengan periode OR tertentu

  // Schedule
  startDateTime: TimestampSchema,
  endDateTime: TimestampSchema,

  // Mode & Location
  mode: ActivityModeEnum,
  location: z.string().optional(), // Nama tempat/ruangan (jika offline/hybrid)
  onlineLink: z.string().optional(), // Link meeting (jika online/hybrid)

  // Attendance
  attendanceEnabled: z.boolean().default(false),
  attendanceOpenTime: TimestampSchema.optional(),
  attendanceCloseTime: TimestampSchema.optional(),
  lateTolerance: z.number().int().nonnegative().optional().default(15), // Default 15 menit

  // Statistics (Biasanya diupdate via cloud functions/triggers)
  totalParticipants: z.number().int().nonnegative().default(0),
  attendedCount: z.number().int().nonnegative().default(0),
  absentCount: z.number().int().nonnegative().default(0),

  // Status & Visibility
  status: ActivityStatusEnum.default("upcoming"),
  isVisible: z.boolean().default(true), // Untuk hide/show di list peserta
  isActive: z.boolean().default(true), // Untuk soft disable

  // Soft Delete
  deletedAt: TimestampSchema.nullable().optional(),
  deletedBy: z.string().optional(),

  // Metadata
  createdBy: z.string(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 4. EXPORT TYPES (Inferensi Otomatis)
// ---------------------------------------------------------

export type ActivityType = z.infer<typeof ActivityTypeEnum>;
export type ActivityMode = z.infer<typeof ActivityModeEnum>;
export type ActivityStatus = z.infer<typeof ActivityStatusEnum>;

export type Activity = z.infer<typeof ActivitySchema>;

// ---------------------------------------------------------
// 5. FORM SCHEMA (Untuk Create/Edit Form)
// ---------------------------------------------------------

export const ActivityFormSchema = z.object({
  title: z.string().min(3, "Judul aktivitas minimal 3 karakter"),
  description: z.string(),
  orPeriod: z.string(),

  // Schedule - use string for form input (datetime-local format)
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  startTime: z.string().min(1, "Jam mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  endTime: z.string().min(1, "Jam selesai wajib diisi"),

  // Mode & Location
  mode: ActivityModeEnum,
  location: z.string(),
  onlineLink: z.string(),

  // Attendance
  attendanceEnabled: z.boolean(),
  lateTolerance: z.number().int().nonnegative(),

  // Status
  status: ActivityStatusEnum,
});

export type ActivityFormValues = z.infer<typeof ActivityFormSchema>;

// ---------------------------------------------------------
// 6. SERVICE INPUT TYPES
// ---------------------------------------------------------

export type CreateActivityInput = {
  type: ActivityType;
  title: string;
  description?: string;
  orPeriod?: string;
  startDateTime: Date;
  endDateTime: Date;
  mode: ActivityMode;
  location?: string;
  onlineLink?: string;
  attendanceEnabled: boolean;
  lateTolerance?: number;
  status: ActivityStatus;
  createdBy: string;
};

export type UpdateActivityInput = Partial<
  Omit<CreateActivityInput, "createdBy" | "type">
> & {
  id: string;
};
