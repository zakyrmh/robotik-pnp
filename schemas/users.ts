import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER & ENUMS
// ---------------------------------------------------------

// Helper khusus untuk memvalidasi Firestore Timestamp
// Kita gunakan z.custom agar kompatibel dengan instance Timestamp Firebase
const TimestampSchema = z.custom<Timestamp | Date>(
  (data) => data instanceof Timestamp || data instanceof Date,
  { message: "Must be a Firestore Timestamp or Date" }
);

export const GenderEnum = z.enum(["male", "female"]);

// ---------------------------------------------------------
// 2. SUB-SCHEMAS (Komponen Kecil)
// ---------------------------------------------------------

const UserSystemRolesSchema = z.object({
  isSuperAdmin: z.boolean().default(false),
  isKestari: z.boolean().default(false),
  isKomdis: z.boolean().default(false),
  isRecruiter: z.boolean().default(false),
  isKRIMember: z.boolean().default(false),
  isOfficialMember: z.boolean().default(false),
  isCaang: z.boolean().default(false),
  isAlumni: z.boolean().default(false),
});

const UserAssignmentsSchema = z.object({
  competition: z
    .object({
      team: z.enum(["krai", "krsbi_h", "krsbi_b", "krsti", "krsri"]),
      position: z.enum([
        "chairman",
        "vice_chairman",
        "secretary",
        "treasurer",
        "member",
      ]),
      role: z.enum(["mechanic", "programmer", "electronics"]),
    })
    .optional(),

  department: z
    .object({
      name: z.enum(["infokom", "litbang", "metrolab", "kestari"]),
      position: z.enum([
        "coordinator",
        "deputy_coordinator",
        "head_of_division",
        "member",
      ]),
    })
    .optional(),

  special_department: z
    .enum([
      "chairman",
      "deputy_general_chairman_1",
      "deputy_general_chairman_2",
      "secretary_1",
      "secretary_2",
      "treasurer_1",
      "treasurer_2",
    ])
    .optional(),

  structural: z
    .object({
      title: z.enum([
        "ketua_umum",
        "wakil_ketua_1",
        "wakil_ketua_2",
        "sekretaris_1",
        "sekretaris_2",
        "bendahara_1",
        "bendahara_2",
      ]),
    })
    .optional(),
});

const UserProfileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  nickname: z.string().optional(),
  nim: z.string().optional(),
  phone: z.string().optional(), // Bisa tambah .regex() untuk format HP Indonesia
  gender: GenderEnum.optional(),
  birthDate: TimestampSchema.optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),

  major: z.string().optional(),
  department: z.string().optional(),
  entryYear: z.number().int().optional(),

  photoUrl: z.string().url().optional(),
  ktmUrl: z.string().url().optional(),
});

const UserMembershipSchema = z.object({
  memberId: z.string(),
  joinYear: z.number().int(),
  joinDate: TimestampSchema,
});

const BlacklistDataSchema = z.object({
  isBlacklisted: z.boolean(),
  reason: z.string(),
  bannedAt: TimestampSchema,
  bannedBy: z.string(),
  period: z.string(),
});

// ---------------------------------------------------------
// 3. MAIN SCHEMA (User)
// ---------------------------------------------------------

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),

  roles: UserSystemRolesSchema,
  assignments: UserAssignmentsSchema.optional(),

  profile: UserProfileSchema,

  registrationId: z.string().optional(),
  membership: UserMembershipSchema.optional(),

  isActive: z.boolean().default(true),
  blacklistInfo: BlacklistDataSchema.optional(),

  // Audit Logs (Soft Delete)
  deletedAt: TimestampSchema.optional(),
  deletedBy: z.string().optional(),
  deleteReason: z.string().optional(),

  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 4. EXPORT TYPES (Inferensi Otomatis)
// ---------------------------------------------------------

// Anda tidak perlu menulis "interface User" lagi secara manual!
// TypeScript akan membuatnya otomatis dari Schema di atas.
export type User = z.infer<typeof UserSchema>;
export type UserSystemRoles = z.infer<typeof UserSystemRolesSchema>;
export type UserAssignments = z.infer<typeof UserAssignmentsSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserMembership = z.infer<typeof UserMembershipSchema>;
export type BlacklistData = z.infer<typeof BlacklistDataSchema>;
