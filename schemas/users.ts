import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER & ENUMS
// ---------------------------------------------------------

// Helper khusus untuk memvalidasi Firestore Timestamp
const TimestampSchema = z.custom<Timestamp | Date>(
  (data) => data instanceof Timestamp || data instanceof Date,
  { message: "Must be a Firestore Timestamp or Date" }
);

export const GenderEnum = z.enum(["male", "female"]);

// ---------------------------------------------------------
// 2. ENUMS FOR ASSIGNMENTS
// ---------------------------------------------------------

// Tim KRI
export const KriTeamEnum = z.enum([
  "krai",
  "krsbi_h", // Humanoid
  "krsbi_b", // Beroda
  "krsti",
  "krsri",
]);

// Posisi Manajemen dalam Tim KRI
export const TeamManagementPositionEnum = z.enum([
  "chairman", // Ketua Tim
  "vice_chairman", // Wakil Ketua Tim
  "secretary", // Sekretaris Tim
  "treasurer", // Bendahara Tim
  "member", // Anggota
]);

// Role Teknis dalam Tim KRI
export const TeamTechnicalRoleEnum = z.enum([
  "mechanic", // Mekanik
  "programmer", // Programmer
  "electronics", // Elektro
]);

// Departemen Regular
export const DepartmentEnum = z.enum([
  "infokom", // Info & Komunikasi (Humas, Pubdok)
  "litbang", // Penelitian & Pengembangan (PSDM, Ristek)
  "mel", // Mekanik, Elektro, Lapangan (Maintenance, Produksi)
  "kestari", // Kesekretariatan
  "komdis", // Komisi Disiplin
  "recruitment", // Open Recruitment
]);

// Sub-Divisi (untuk departemen bertingkat)
export const SubDivisionEnum = z.enum([
  // Infokom
  "humas", // Hubungan Masyarakat
  "pubdok", // Publikasi & Dokumentasi
  // Litbang
  "psdm", // Pengembangan SDM
  "ristek", // Riset & Teknologi
  // MEL
  "maintenance", // Perawatan
  "production", // Produksi
]);

// Posisi dalam Departemen
export const DepartmentPositionEnum = z.enum([
  "coordinator", // Koordinator
  "deputy_coordinator", // Wakil Koordinator
  "head_of_division", // Kepala Bidang (untuk sub-divisi)
  "deputy_head", // Wakil Kepala Bidang
  "member", // Anggota
]);

// Jabatan Struktural (Presidium & Sekretariat)
export const StructuralTitleEnum = z.enum([
  // Presidium
  "ketua_umum",
  "wakil_ketua_1", // Manajemen Organisasi
  "wakil_ketua_2", // Manajemen Tim KRI
  "ketua_komdis",
  "ketua_recruitment",
  // Sekretariat
  "sekretaris_1", // Organisasi
  "sekretaris_2", // Tim KRI
  "bendahara_1", // Organisasi
  "bendahara_2", // Tim KRI
]);

// ---------------------------------------------------------
// 3. SUB-SCHEMAS (Komponen Kecil)
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

// Schema untuk tim kompetisi (KRI)
// Mendukung dual-role: posisi manajemen + role teknis
const CompetitionAssignmentSchema = z.object({
  team: KriTeamEnum,
  managementPosition: TeamManagementPositionEnum, // Posisi manajemen dalam tim
  technicalRole: TeamTechnicalRoleEnum, // Role teknis
  isActive: z.boolean().default(true), // Apakah masih aktif di tim ini
});

// Schema untuk departemen (termasuk sub-divisi)
const DepartmentAssignmentSchema = z.object({
  name: DepartmentEnum,
  position: DepartmentPositionEnum,
  subDivision: SubDivisionEnum.optional(), // Opsional, hanya untuk dept bertingkat
  isActive: z.boolean().default(true),
});

// Schema untuk jabatan struktural
const StructuralAssignmentSchema = z.object({
  title: StructuralTitleEnum,
  periodStart: TimestampSchema.optional(),
  periodEnd: TimestampSchema.optional(),
  isActive: z.boolean().default(true),
});

// Schema untuk assignments (gabungan semua)
const UserAssignmentsSchema = z.object({
  // Tim Kompetisi - bisa multiple (satu orang bisa di banyak tim)
  competitions: z.array(CompetitionAssignmentSchema).optional(),

  // Departemen - biasanya satu, tapi bisa multiple
  departments: z.array(DepartmentAssignmentSchema).optional(),

  // Jabatan Struktural - biasanya satu
  structural: StructuralAssignmentSchema.optional(),
});

const UserProfileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  nickname: z.string().optional(),
  nim: z.string().optional(),
  phone: z.string().optional(),
  gender: GenderEnum.optional(),
  birthDate: TimestampSchema.optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),

  major: z.string().optional(),
  department: z.string().optional(),
  entryYear: z.number().int().optional(),

  photoUrl: z.string().optional(),
  ktmUrl: z.string().optional(),
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
// 4. MAIN SCHEMA (User)
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

  // Verification & Security
  verification: z
    .object({
      emailVerified: z.boolean().default(false),
      resendAttempts: z.number().default(0),
      lastResendAt: TimestampSchema.nullable().optional(),
      blockResendUntil: TimestampSchema.nullable().optional(), // 1x24 hours block
    })
    .optional(),

  // Audit Logs (Soft Delete)
  deletedAt: TimestampSchema.optional(),
  deletedBy: z.string().optional(),
  deleteReason: z.string().optional(),

  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 5. EXPORT TYPES (Inferensi Otomatis)
// ---------------------------------------------------------

export type User = z.infer<typeof UserSchema>;
export type UserSystemRoles = z.infer<typeof UserSystemRolesSchema>;
export type UserAssignments = z.infer<typeof UserAssignmentsSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserMembership = z.infer<typeof UserMembershipSchema>;
export type BlacklistData = z.infer<typeof BlacklistDataSchema>;

// Assignment sub-types
export type CompetitionAssignment = z.infer<typeof CompetitionAssignmentSchema>;
export type DepartmentAssignment = z.infer<typeof DepartmentAssignmentSchema>;
export type StructuralAssignment = z.infer<typeof StructuralAssignmentSchema>;

// Enum types
export type KriTeam = z.infer<typeof KriTeamEnum>;
export type TeamManagementPosition = z.infer<typeof TeamManagementPositionEnum>;
export type TeamTechnicalRole = z.infer<typeof TeamTechnicalRoleEnum>;
export type Department = z.infer<typeof DepartmentEnum>;
export type SubDivision = z.infer<typeof SubDivisionEnum>;
export type DepartmentPosition = z.infer<typeof DepartmentPositionEnum>;
export type StructuralTitle = z.infer<typeof StructuralTitleEnum>;

// ---------------------------------------------------------
// 6. HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Mendapatkan nama tim KRI yang readable
 */
export function getTeamDisplayName(team: KriTeam): string {
  const names: Record<KriTeam, string> = {
    krai: "KRAI",
    krsbi_h: "KRSBI Humanoid",
    krsbi_b: "KRSBI Beroda",
    krsti: "KRSTI",
    krsri: "KRSRI",
  };
  return names[team];
}

/**
 * Mendapatkan nama departemen yang readable
 */
export function getDepartmentDisplayName(dept: Department): string {
  const names: Record<Department, string> = {
    infokom: "Infokom",
    litbang: "Litbang",
    mel: "MEL",
    kestari: "Kesekretariatan",
    komdis: "Komisi Disiplin",
    recruitment: "Open Recruitment",
  };
  return names[dept];
}

/**
 * Mendapatkan nama jabatan struktural yang readable
 */
export function getStructuralDisplayName(title: StructuralTitle): string {
  const names: Record<StructuralTitle, string> = {
    ketua_umum: "Ketua Umum",
    wakil_ketua_1: "Wakil Ketua I (Organisasi)",
    wakil_ketua_2: "Wakil Ketua II (KRI)",
    ketua_komdis: "Ketua Komdis",
    ketua_recruitment: "Ketua Open Recruitment",
    sekretaris_1: "Sekretaris I",
    sekretaris_2: "Sekretaris II",
    bendahara_1: "Bendahara I",
    bendahara_2: "Bendahara II",
  };
  return names[title];
}

/**
 * Mendapatkan nama sub-divisi yang readable
 */
export function getSubDivisionDisplayName(subDiv: SubDivision): string {
  const names: Record<SubDivision, string> = {
    humas: "Humas",
    pubdok: "Pubdok",
    psdm: "PSDM",
    ristek: "Ristek",
    maintenance: "Maintenance",
    production: "Produksi",
  };
  return names[subDiv];
}
