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
// 2. SUB-SCHEMAS
// ---------------------------------------------------------

// Schema untuk Member Detail (Cached Data)
export const GroupMemberSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  nim: z.string(),

  // Statistik Kehadiran
  attendancePercentage: z.number().min(0).max(100).default(0), // 0-100
  totalActivities: z.number().int().nonnegative().default(0),
  attendedActivities: z.number().int().nonnegative().default(0),
  isLowAttendance: z.boolean().default(false), // true jika < 25% (atau threshold lain)
});

// ---------------------------------------------------------
// 3. MAIN SCHEMAS
// ---------------------------------------------------------

// Group Parent - Container utama (misal: "Kelompok Project 1")
export const GroupParentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama kelompok wajib diisi"), // Misal: "Kelompok Project 1"
  description: z.string().optional(),
  orPeriod: z.string(), // Misal: "OR 21"

  // Metadata Statistik
  totalSubGroups: z.number().int().nonnegative().default(0),
  totalMembers: z.number().int().nonnegative().default(0),

  // Ketua Kelompok (dari salah satu member sub-groups)
  leaderId: z.string().nullish(), // null jika belum ada ketua

  isActive: z.boolean().default(true),

  createdBy: z.string(), // UID Admin
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  deletedAt: TimestampSchema.nullish(), // undefined jika belum soft-delete, Date jika sudah
  deletedBy: z.string().nullish(), // UID Admin yang menghapus
});

// Sub-Group - Kelompok aktual (misal: "Kelompok 1", "Kelompok 2")
export const SubGroupSchema = z.object({
  id: z.string(),
  parentId: z.string(), // Reference ke GroupParent ID
  name: z.string().min(1, "Nama sub-group wajib diisi"), // Misal: "Kelompok 1"
  description: z.string().optional(),
  orPeriod: z.string(),

  // Members Management
  memberIds: z.array(z.string()).default([]), // Array of User IDs
  leaderId: z.string().nullish(), // Ketua kelompok (dari salah satu member) - null jika belum ada

  // Member Details for Display (Denormalized/Cached data)
  // Disimpan disini agar saat fetch list kelompok tidak perlu query user satu per satu
  members: z.array(GroupMemberSchema).default([]),

  // Status
  isActive: z.boolean().default(true),

  // Metadata
  createdBy: z.string(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 4. EXPORT TYPES (Inferensi Otomatis)
// ---------------------------------------------------------

export type GroupMember = z.infer<typeof GroupMemberSchema>;
export type GroupParent = z.infer<typeof GroupParentSchema>;
export type SubGroup = z.infer<typeof SubGroupSchema>;
