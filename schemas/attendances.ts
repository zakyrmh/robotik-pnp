import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER (Standard Timestamp Transformation)
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

export const AttendanceStatusEnum = z.enum([
  "present", // Hadir
  "late", // Terlambat
  "excused", // Izin (approved)
  "sick", // Sakit (approved)
  "absent", // Alfa
  "pending_approval", // Menunggu approval izin/sakit
]);

export const AttendanceMethodEnum = z.enum([
  "qr_code", // CAANG generate QR, admin scan
  "manual", // Input manual oleh admin
]);

// ---------------------------------------------------------
// 3. MAIN SCHEMA
// ---------------------------------------------------------

export const AttendanceSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  userId: z.string(),
  orPeriod: z.string(), // e.g., "OR 21"

  // Status
  status: AttendanceStatusEnum,

  // Check-in Info
  checkedInAt: TimestampSchema.optional(),
  checkedInBy: z.string(), // ID Admin atau System yang melakukan check-in
  method: AttendanceMethodEnum,

  // QR Code Data (jika pakai QR)
  qrCodeHash: z.string().optional(),

  // Notes
  userNotes: z.string().optional(),
  adminNotes: z.string().optional(),

  // Approval (untuk izin/sakit)
  needsApproval: z.boolean().default(false),
  approvedBy: z.string().optional(),
  approvedAt: TimestampSchema.optional(),
  rejectionReason: z.string().optional(),

  // Scoring
  // present = 100, late = 75, excused = 50, sick = 50, absent = 0
  points: z.number().int().default(0),

  // Soft delete
  deletedAt: TimestampSchema.nullable().optional(),
  deletedBy: z.string().optional(),

  // Metadata
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 4. EXPORT TYPES (Inferensi Otomatis)
// ---------------------------------------------------------

export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>;
export type AttendanceMethod = z.infer<typeof AttendanceMethodEnum>;

export type Attendance = z.infer<typeof AttendanceSchema>;
